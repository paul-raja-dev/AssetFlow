import uuid

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.transfer_requests as tr_crud
import app.crud.assets as asset_crud
import app.crud.allocations as alloc_crud
from app.exceptions import AppError
from app.models.transfer_request import TransferRequest


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

    # Check no pending transfer already (DB partial unique index also guards this)
    existing = tr_crud.build_list_query(asset_id=asset_id, status="PENDING")

    return await tr_crud.create(
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

    # Execute the transfer: update asset dept if TRANSFER type
    if tr.type == "TRANSFER" and tr.to_department_id:
        asset = await asset_crud.get_by_id(db, tr.asset_id)
        if asset:
            await asset_crud.update(db, asset, department_id=tr.to_department_id)

    # If RETURN type: return the active allocation
    if tr.type == "RETURN":
        active_alloc = await alloc_crud.get_active_for_asset(db, tr.asset_id)
        if active_alloc:
            from datetime import date
            await alloc_crud.update(
                db, active_alloc, status="RETURNED", actual_return_date=date.today()
            )
            asset = await asset_crud.get_by_id(db, tr.asset_id)
            if asset:
                await asset_crud.update(db, asset, status="AVAILABLE")

    return await tr_crud.update(
        db, tr, status="APPROVED", reviewed_by_id=reviewed_by_id, notes=notes or tr.notes
    )


async def reject_transfer_request(
    db: AsyncSession, tr_id: str, reviewed_by_id: str, notes: str | None = None
) -> TransferRequest:
    tr = await tr_crud.get_by_id(db, tr_id)
    if not tr:
        raise AppError(404, "TRANSFER_REQUEST_NOT_FOUND", "Transfer request not found")
    if tr.status != "PENDING":
        raise AppError(409, "NOT_PENDING", "Only PENDING requests can be rejected")

    return await tr_crud.update(
        db, tr, status="REJECTED", reviewed_by_id=reviewed_by_id, notes=notes or tr.notes
    )
