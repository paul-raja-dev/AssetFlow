import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.transfer_requests as tr_crud
import app.crud.assets as asset_crud
import app.crud.allocations as alloc_crud
import app.crud.departments as dept_crud
import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.transfer_request import TransferRequest
from app.services import notification_service


async def list_transfer_requests(db: AsyncSession, **filters):
    return tr_crud.build_list_query(**filters)


async def create_transfer_request(
    db: AsyncSession,
    asset_id: str,
    requested_by_id: str,
    type_: str,
    to_user_id: str | None = None,
    to_department_id: str | None = None,
    notes: str | None = None,
) -> TransferRequest:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")

    # A TRANSFER must name a destination; validate it exists.
    if type_ == "TRANSFER":
        if not to_user_id and not to_department_id:
            raise AppError(400, "MISSING_TARGET", "A transfer request needs a target user or department")
        if to_user_id:
            target = await users_crud.get_by_id(db, to_user_id)
            if not target or target.status != "ACTIVE":
                raise AppError(404, "USER_NOT_FOUND", "Target user not found or inactive")
        if to_department_id:
            dept = await dept_crud.get_by_id(db, to_department_id)
            if not dept:
                raise AppError(404, "DEPARTMENT_NOT_FOUND", "Target department not found")

    # Block duplicate pending requests for the same asset.
    result = await db.execute(
        select(TransferRequest).where(
            TransferRequest.asset_id == asset_id,
            TransferRequest.status == "PENDING",
        ).limit(1)
    )
    if result.scalars().first():
        raise AppError(409, "PENDING_REQUEST_EXISTS", "A pending request already exists for this asset")

    tr = await tr_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        requested_by_id=requested_by_id,
        type=type_,
        status="PENDING",
        to_user_id=to_user_id,
        to_department_id=to_department_id,
        notes=notes,
    )

    # Let approvers know there is something to review.
    approvers = await users_crud.get_active_by_roles(db, "ADMIN", "ASSET_MANAGER")
    await notification_service.notify_many(
        db,
        [u.id for u in approvers if u.id != requested_by_id],
        "TRANSFER_REQUESTED",
        f"{type_.title()} request raised for asset {asset.asset_tag} ({asset.name})",
        related_entity_type="TRANSFER_REQUEST",
        related_entity_id=tr.id,
    )
    return tr


async def get_transfer_request(db: AsyncSession, tr_id: str) -> TransferRequest:
    tr = await tr_crud.get_by_id(db, tr_id)
    if not tr:
        raise AppError(404, "TRANSFER_REQUEST_NOT_FOUND", "Transfer request not found")
    return tr


async def approve_transfer_request(
    db: AsyncSession, tr_id: str, reviewed_by_id: str, notes: str | None = None
) -> TransferRequest:
    tr = await tr_crud.get_by_id(db, tr_id)
    if not tr:
        raise AppError(404, "TRANSFER_REQUEST_NOT_FOUND", "Transfer request not found")
    if tr.status != "PENDING":
        raise AppError(409, "NOT_PENDING", "Only PENDING requests can be approved")

    asset = await asset_crud.get_by_id(db, tr.asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")

    if tr.type == "TRANSFER":
        # Re-allocate (PS): close the current allocation, open a new one to
        # the requested target, and keep history intact automatically.
        active_alloc = await alloc_crud.get_active_for_asset(db, tr.asset_id)
        if active_alloc:
            await alloc_crud.update(
                db, active_alloc, status="RETURNED", actual_return_date=date.today()
            )
        await alloc_crud.create(
            db,
            id=str(uuid.uuid4()),
            asset_id=tr.asset_id,
            allocated_by_id=reviewed_by_id,
            allocated_to_user_id=tr.to_user_id,
            allocated_to_department_id=tr.to_department_id if not tr.to_user_id else None,
            notes=f"Re-allocated via transfer request {tr.id}",
            status="ACTIVE",
        )
        updates: dict = {"status": "ALLOCATED"}
        if tr.to_department_id:
            updates["department_id"] = tr.to_department_id
        await asset_crud.update(db, asset, **updates)

        if tr.to_user_id:
            await notification_service.notify(
                db, tr.to_user_id, "ASSET_ALLOCATED",
                f"Asset {asset.asset_tag} ({asset.name}) has been transferred to you",
                related_entity_type="TRANSFER_REQUEST", related_entity_id=tr.id,
            )

    elif tr.type == "RETURN":
        active_alloc = await alloc_crud.get_active_for_asset(db, tr.asset_id)
        if active_alloc:
            await alloc_crud.update(
                db, active_alloc, status="RETURNED", actual_return_date=date.today()
            )
        await asset_crud.update(db, asset, status="AVAILABLE")

    tr = await tr_crud.update(
        db, tr, status="APPROVED", reviewed_by_id=reviewed_by_id, notes=notes or tr.notes
    )
    await notification_service.notify(
        db, tr.requested_by_id, "TRANSFER_APPROVED",
        f"Your {tr.type.lower()} request for asset {asset.asset_tag} was approved",
        related_entity_type="TRANSFER_REQUEST", related_entity_id=tr.id,
    )
    return tr


async def reject_transfer_request(
    db: AsyncSession, tr_id: str, reviewed_by_id: str, notes: str | None = None
) -> TransferRequest:
    tr = await tr_crud.get_by_id(db, tr_id)
    if not tr:
        raise AppError(404, "TRANSFER_REQUEST_NOT_FOUND", "Transfer request not found")
    if tr.status != "PENDING":
        raise AppError(409, "NOT_PENDING", "Only PENDING requests can be rejected")

    tr = await tr_crud.update(
        db, tr, status="REJECTED", reviewed_by_id=reviewed_by_id, notes=notes or tr.notes
    )
    asset = await asset_crud.get_by_id(db, tr.asset_id)
    await notification_service.notify(
        db, tr.requested_by_id, "TRANSFER_REJECTED",
        f"Your {tr.type.lower()} request for asset {asset.asset_tag if asset else tr.asset_id} was rejected",
        related_entity_type="TRANSFER_REQUEST", related_entity_id=tr.id,
    )
    return tr
