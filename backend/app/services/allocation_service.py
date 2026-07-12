import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.allocations as alloc_crud
import app.crud.assets as asset_crud
from app.exceptions import AppError
from app.models.allocation import Allocation


async def list_allocations(db: AsyncSession, **filters):
    return alloc_crud.build_list_query(**filters)


async def allocate_asset(
    db: AsyncSession,
    asset_id: str,
    allocated_by_id: str,
    allocated_to_user_id: str | None = None,
    allocated_to_department_id: str | None = None,
    expected_return_date: date | None = None,
    notes: str | None = None,
) -> Allocation:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    if asset.status != "AVAILABLE":
        raise AppError(409, "ASSET_NOT_AVAILABLE", f"Asset is currently {asset.status}")

    # Create allocation
    alloc = await alloc_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        allocated_by_id=allocated_by_id,
        allocated_to_user_id=allocated_to_user_id,
        allocated_to_department_id=allocated_to_department_id,
        expected_return_date=expected_return_date,
        notes=notes,
        status="ACTIVE",
    )

    # Update asset status
    await asset_crud.update(db, asset, status="ALLOCATED")
    return alloc


async def get_allocation(db: AsyncSession, alloc_id: str) -> Allocation:
    alloc = await alloc_crud.get_by_id(db, alloc_id)
    if not alloc:
        raise AppError(404, "ALLOCATION_NOT_FOUND", "Allocation not found")
    return alloc


async def return_asset(db: AsyncSession, alloc_id: str) -> Allocation:
    alloc = await alloc_crud.get_by_id(db, alloc_id)
    if not alloc:
        raise AppError(404, "ALLOCATION_NOT_FOUND", "Allocation not found")
    if alloc.status != "ACTIVE":
        raise AppError(409, "ALREADY_RETURNED", "This allocation has already been returned")

    # Mark allocation returned
    alloc = await alloc_crud.update(
        db, alloc, status="RETURNED", actual_return_date=date.today()
    )

    # Set asset back to AVAILABLE
    asset = await asset_crud.get_by_id(db, alloc.asset_id)
    if asset:
        await asset_crud.update(db, asset, status="AVAILABLE")

    return alloc


async def get_asset_allocation_history(db: AsyncSession, asset_id: str):
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    return alloc_crud.build_list_query(asset_id=asset_id)
