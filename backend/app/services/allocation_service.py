import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.allocations as alloc_crud
import app.crud.assets as asset_crud
import app.crud.departments as dept_crud
import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.allocation import Allocation
from app.services import notification_service


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
        # Conflict rule (PS): surface who currently holds it so the UI can
        # offer a Transfer Request instead.
        details = {}
        active = await alloc_crud.get_active_for_asset(db, asset_id)
        if active:
            if active.allocated_to_user_id:
                holder = await users_crud.get_by_id(db, active.allocated_to_user_id)
                if holder:
                    details = {"holderType": "USER", "holderId": holder.id,
                               "holderName": f"{holder.first_name} {holder.last_name}"}
            elif active.allocated_to_department_id:
                dept = await dept_crud.get_by_id(db, active.allocated_to_department_id)
                if dept:
                    details = {"holderType": "DEPARTMENT", "holderId": dept.id,
                               "holderName": dept.name}
        raise AppError(409, "ASSET_NOT_AVAILABLE", f"Asset is currently {asset.status}", details)

    # Validate the recipient actually exists (avoid FK 500s)
    if allocated_to_user_id:
        target = await users_crud.get_by_id(db, allocated_to_user_id)
        if not target or target.status != "ACTIVE":
            raise AppError(404, "USER_NOT_FOUND", "Target user not found or inactive")
    if allocated_to_department_id:
        dept = await dept_crud.get_by_id(db, allocated_to_department_id)
        if not dept:
            raise AppError(404, "DEPARTMENT_NOT_FOUND", "Target department not found")

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

    await asset_crud.update(db, asset, status="ALLOCATED")

    if allocated_to_user_id:
        await notification_service.notify(
            db, allocated_to_user_id, "ASSET_ALLOCATED",
            f"Asset {asset.asset_tag} ({asset.name}) has been allocated to you",
            related_entity_type="ALLOCATION", related_entity_id=alloc.id,
        )
    return alloc


async def get_allocation(db: AsyncSession, alloc_id: str) -> Allocation:
    alloc = await alloc_crud.get_by_id(db, alloc_id)
    if not alloc:
        raise AppError(404, "ALLOCATION_NOT_FOUND", "Allocation not found")
    return alloc


async def return_asset(
    db: AsyncSession,
    alloc_id: str,
    condition: str | None = None,
    return_notes: str | None = None,
) -> Allocation:
    alloc = await alloc_crud.get_by_id(db, alloc_id)
    if not alloc:
        raise AppError(404, "ALLOCATION_NOT_FOUND", "Allocation not found")
    if alloc.status != "ACTIVE":
        raise AppError(409, "ALREADY_RETURNED", "This allocation has already been returned")

    updates: dict = {"status": "RETURNED", "actual_return_date": date.today()}
    if return_notes:
        checkin = f"Check-in: {return_notes}"
        updates["notes"] = f"{alloc.notes}\n{checkin}" if alloc.notes else checkin
    alloc = await alloc_crud.update(db, alloc, **updates)

    # Asset back to AVAILABLE (+ condition captured at check-in)
    asset = await asset_crud.get_by_id(db, alloc.asset_id)
    if asset:
        asset_updates: dict = {"status": "AVAILABLE"}
        if condition:
            asset_updates["condition"] = condition
        await asset_crud.update(db, asset, **asset_updates)

    if alloc.allocated_to_user_id and asset:
        await notification_service.notify(
            db, alloc.allocated_to_user_id, "ASSET_RETURNED",
            f"Asset {asset.asset_tag} ({asset.name}) has been returned",
            related_entity_type="ALLOCATION", related_entity_id=alloc.id,
        )
    return alloc


async def get_asset_allocation_history(db: AsyncSession, asset_id: str):
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    return alloc_crud.build_list_query(asset_id=asset_id)
