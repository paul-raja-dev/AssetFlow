import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.maintenance_requests as maint_crud
import app.crud.assets as asset_crud
from app.exceptions import AppError
from app.models.maintenance_request import MaintenanceRequest

# Statuses that flip asset to UNDER_MAINTENANCE
_ACTIVE_STATUSES = {"APPROVED", "IN_PROGRESS"}
# Statuses that free the asset back to AVAILABLE
_DONE_STATUSES = {"RESOLVED", "REJECTED"}


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

    return await maint_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        requested_by_id=requested_by_id,
        description=description,
        priority=priority,
        status="PENDING",
    )


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

    # Valid transitions only
    terminal = {"RESOLVED", "REJECTED"}
    if req.status in terminal:
        raise AppError(409, "REQUEST_CLOSED", f"Cannot update a {req.status} request")

    updates: dict = {"status": new_status}
    if technician_notes is not None:
        updates["technician_notes"] = technician_notes
    if resolution_date is not None:
        updates["resolution_date"] = resolution_date

    req = await maint_crud.update(db, req, **updates)

    # Flip asset status based on new maintenance status
    asset = await asset_crud.get_by_id(db, req.asset_id)
    if asset:
        if new_status in _ACTIVE_STATUSES:
            await asset_crud.update(db, asset, status="UNDER_MAINTENANCE")
        elif new_status in _DONE_STATUSES:
            await asset_crud.update(db, asset, status="AVAILABLE")

    return req


async def delete_maintenance_request(db: AsyncSession, req_id: str) -> None:
    req = await maint_crud.get_by_id(db, req_id)
    if not req:
        raise AppError(404, "MAINTENANCE_REQUEST_NOT_FOUND", "Maintenance request not found")
    if req.status != "PENDING":
        raise AppError(409, "NOT_PENDING", "Only PENDING requests can be deleted")
    await maint_crud.delete(db, req)
