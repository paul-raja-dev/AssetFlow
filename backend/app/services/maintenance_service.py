import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.maintenance_requests as maint_crud
import app.crud.assets as asset_crud
import app.crud.allocations as alloc_crud
import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.maintenance_request import MaintenanceRequest
from app.services import notification_service

# PS workflow: Pending → Approved / Rejected → In Progress → Resolved
_VALID_TRANSITIONS: dict[str, set[str]] = {
    "PENDING": {"APPROVED", "REJECTED"},
    "APPROVED": {"IN_PROGRESS", "RESOLVED"},
    "IN_PROGRESS": {"RESOLVED"},
    "RESOLVED": set(),
    "REJECTED": set(),
}


async def list_maintenance_requests(db: AsyncSession, **filters):
    return maint_crud.build_list_query(**filters)


async def create_maintenance_request(
    db: AsyncSession,
    asset_id: str,
    requested_by_id: str,
    description: str,
    priority: str = "MEDIUM",
) -> MaintenanceRequest:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    if asset.status in ("DISPOSED", "LOST"):
        raise AppError(409, "ASSET_TERMINAL_STATE", f"Cannot request maintenance for a {asset.status} asset")

    # Friendly 409 instead of a DB integrity error if a request is already open
    from sqlalchemy import select
    open_req = (await db.execute(
        select(MaintenanceRequest).where(
            MaintenanceRequest.asset_id == asset_id,
            MaintenanceRequest.status.in_(("PENDING", "APPROVED", "IN_PROGRESS")),
        ).limit(1)
    )).scalars().first()
    if open_req:
        raise AppError(409, "OPEN_REQUEST_EXISTS", "An open maintenance request already exists for this asset")

    req = await maint_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        requested_by_id=requested_by_id,
        description=description,
        priority=priority,
        status="PENDING",
    )

    approvers = await users_crud.get_active_by_roles(db, "ADMIN", "ASSET_MANAGER")
    await notification_service.notify_many(
        db,
        [u.id for u in approvers if u.id != requested_by_id],
        "MAINTENANCE_REQUESTED",
        f"Maintenance requested for asset {asset.asset_tag} ({asset.name}): {description[:80]}",
        related_entity_type="MAINTENANCE_REQUEST",
        related_entity_id=req.id,
    )
    return req


async def get_maintenance_request(db: AsyncSession, req_id: str) -> MaintenanceRequest:
    req = await maint_crud.get_by_id(db, req_id)
    if not req:
        raise AppError(404, "MAINTENANCE_REQUEST_NOT_FOUND", "Maintenance request not found")
    return req


async def update_maintenance_status(
    db: AsyncSession,
    req_id: str,
    new_status: str,
    technician_notes: str | None = None,
    resolution_date: date | None = None,
) -> MaintenanceRequest:
    req = await maint_crud.get_by_id(db, req_id)
    if not req:
        raise AppError(404, "MAINTENANCE_REQUEST_NOT_FOUND", "Maintenance request not found")

    allowed = _VALID_TRANSITIONS.get(req.status, set())
    if new_status not in allowed:
        raise AppError(
            409, "INVALID_TRANSITION",
            f"Cannot move a {req.status} request to {new_status}",
        )

    updates: dict = {"status": new_status}
    if technician_notes is not None:
        updates["technician_notes"] = technician_notes
    if resolution_date is not None:
        updates["resolution_date"] = resolution_date
    elif new_status == "RESOLVED":
        updates["resolution_date"] = date.today()

    req = await maint_crud.update(db, req, **updates)

    # Asset status side-effects (PS): flips to UNDER_MAINTENANCE on approval,
    # and back on resolution. A rejected request never touches the asset.
    asset = await asset_crud.get_by_id(db, req.asset_id)
    if asset:
        if new_status == "APPROVED":
            await asset_crud.update(db, asset, status="UNDER_MAINTENANCE")
        elif new_status == "RESOLVED":
            # Restore to ALLOCATED if someone still holds it, else AVAILABLE.
            active_alloc = await alloc_crud.get_active_for_asset(db, req.asset_id)
            restored = "ALLOCATED" if active_alloc else "AVAILABLE"
            await asset_crud.update(db, asset, status=restored)

    # Tell the requester what happened.
    notif_map = {
        "APPROVED": ("MAINTENANCE_APPROVED", "was approved"),
        "REJECTED": ("MAINTENANCE_REJECTED", "was rejected"),
        "RESOLVED": ("MAINTENANCE_RESOLVED", "has been resolved"),
    }
    if new_status in notif_map and asset:
        ntype, verb = notif_map[new_status]
        await notification_service.notify(
            db, req.requested_by_id, ntype,
            f"Your maintenance request for asset {asset.asset_tag} {verb}",
            related_entity_type="MAINTENANCE_REQUEST", related_entity_id=req.id,
        )
    return req


async def delete_maintenance_request(db: AsyncSession, req_id: str) -> None:
    req = await maint_crud.get_by_id(db, req_id)
    if not req:
        raise AppError(404, "MAINTENANCE_REQUEST_NOT_FOUND", "Maintenance request not found")
    if req.status != "PENDING":
        raise AppError(409, "NOT_PENDING", "Only PENDING requests can be deleted")
    await maint_crud.delete(db, req)
