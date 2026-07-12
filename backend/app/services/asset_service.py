import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.assets as asset_crud
from app.exceptions import AppError
from app.models.asset import Asset
from app.models.allocation import Allocation


async def _resolve_current_holder(db: AsyncSession, asset_id: str) -> dict | None:
    """Return who currently holds the asset (active allocation), or None."""
    result = await db.execute(
        select(Allocation).where(
            Allocation.asset_id == asset_id,
            Allocation.status == "ACTIVE",
        )
    )
    alloc = result.scalar_one_or_none()
    if not alloc:
        return None
    if alloc.allocated_to_user_id:
        from app.models.user import User
        u = await db.get(User, alloc.allocated_to_user_id)
        return {"type": "USER", "id": alloc.allocated_to_user_id, "name": f"{u.first_name} {u.last_name}" if u else "Unknown"}
    if alloc.allocated_to_department_id:
        from app.models.department import Department
        d = await db.get(Department, alloc.allocated_to_department_id)
        return {"type": "DEPARTMENT", "id": alloc.allocated_to_department_id, "name": d.name if d else "Unknown"}
    return None


async def list_assets(db: AsyncSession, **filters):
    return asset_crud.build_list_query(**filters)


async def create_asset(
    db: AsyncSession,
    name: str,
    category_id: str,
    **kwargs,
) -> Asset:
    # Auto-generate AF-XXXX tag
    seq_val = await asset_crud.next_sequence_val(db)
    asset_tag = f"AF-{seq_val:04d}"

    return await asset_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_tag=asset_tag,
        name=name,
        category_id=category_id,
        **kwargs,
    )


async def get_asset(db: AsyncSession, asset_id: str) -> tuple[Asset, dict | None]:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    holder = await _resolve_current_holder(db, asset_id)
    return asset, holder


async def update_asset(db: AsyncSession, asset_id: str, **updates) -> Asset:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    # Prevent changing asset_tag or status via this endpoint
    updates.pop("asset_tag", None)
    updates.pop("status", None)
    return await asset_crud.update(db, asset, **updates)


async def update_asset_status(db: AsyncSession, asset_id: str, new_status: str) -> Asset:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")

    # Guard: can't change status if DISPOSED or LOST
    if asset.status in ("DISPOSED", "LOST"):
        raise AppError(409, "ASSET_TERMINAL_STATE", f"Asset is already {asset.status} and cannot be updated")

    # Guard: ALLOCATED asset can't be directly disposed/lost — must be returned first
    if asset.status == "ALLOCATED" and new_status in ("DISPOSED", "LOST"):
        raise AppError(409, "ASSET_CURRENTLY_ALLOCATED", "Return the asset before marking it as disposed or lost")

    return await asset_crud.update(db, asset, status=new_status)


async def delete_asset(db: AsyncSession, asset_id: str) -> None:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")

    if asset.status != "AVAILABLE":
        raise AppError(409, "ASSET_NOT_AVAILABLE", "Only AVAILABLE assets can be deleted")

    # Double-check no active allocations exist
    result = await db.execute(
        select(Allocation).where(
            Allocation.asset_id == asset_id,
            Allocation.status == "ACTIVE",
        )
    )
    if result.scalar_one_or_none():
        raise AppError(409, "ACTIVE_ALLOCATION_EXISTS", "Cannot delete asset with an active allocation")

    await asset_crud.delete(db, asset)
