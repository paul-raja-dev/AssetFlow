import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.audit as audit_crud
import app.crud.assets as asset_crud
from app.exceptions import AppError
from app.models.asset import Asset
from app.models.audit_cycle import AuditCycle
from app.models.audit_item import AuditItem
from app.services import notification_service


async def _scope_asset_ids(
    db: AsyncSession,
    department_id: str | None,
    location: str | None,
) -> list[str]:
    """Resolve the in-scope asset ids (never DISPOSED)."""
    query = select(Asset.id).where(Asset.status != "DISPOSED")
    if department_id:
        query = query.where(Asset.department_id == department_id)
    elif location:
        query = query.where(Asset.location == location)
    result = await db.execute(query)
    return [row[0] for row in result.all()]


async def list_cycles(db: AsyncSession) -> list[AuditCycle]:
    return await audit_crud.list_cycles(db)


async def create_cycle(
    db: AsyncSession,
    name: str,
    department_id: str | None,
    location: str | None,
    auditor_ids: list[str],
    created_by_id: str,
) -> tuple[AuditCycle, list[str]]:
    cycle = await audit_crud.create_cycle(
        db,
        id=str(uuid.uuid4()),
        name=name,
        status="OPEN",
        department_id=department_id,
        location=location,
        created_by_id=created_by_id,
    )

    await audit_crud.set_auditors(db, cycle.id, auditor_ids)

    asset_ids = await _scope_asset_ids(db, department_id, location)
    await audit_crud.bulk_create_items(db, cycle.id, asset_ids)

    # Tell the auditors they have work to do.
    await notification_service.notify_many(
        db, auditor_ids, "AUDIT_ASSIGNED",
        f"You have been assigned as an auditor for audit cycle '{name}'",
        related_entity_type="AUDIT_CYCLE", related_entity_id=cycle.id,
    )

    return cycle, auditor_ids


async def get_cycle(
    db: AsyncSession, cycle_id: str
) -> tuple[AuditCycle, list[str], list[AuditItem]]:
    cycle = await audit_crud.get_cycle_by_id(db, cycle_id)
    if not cycle:
        raise AppError(404, "CYCLE_NOT_FOUND", "Audit cycle not found")

    auditor_ids = await audit_crud.get_auditor_ids(db, cycle_id)
    items = await audit_crud.list_items_for_cycle(db, cycle_id)
    return cycle, auditor_ids, items


async def close_cycle(db: AsyncSession, cycle_id: str) -> AuditCycle:
    cycle = await audit_crud.get_cycle_by_id(db, cycle_id)
    if not cycle:
        raise AppError(404, "CYCLE_NOT_FOUND", "Audit cycle not found")
    if cycle.status != "OPEN":
        raise AppError(409, "CYCLE_ALREADY_CLOSED", "Audit cycle is already closed")

    # Closing locks the cycle AND applies verified findings to the assets
    # (PS: e.g. confirmed-missing items become LOST).
    items = await audit_crud.list_items_for_cycle(db, cycle_id)
    for item in items:
        asset = await asset_crud.get_by_id(db, item.asset_id)
        if not asset:
            continue
        if item.result == "MISSING" and asset.status not in ("DISPOSED",):
            await asset_crud.update(db, asset, status="LOST")
        elif item.result == "DAMAGED":
            await asset_crud.update(db, asset, condition="DAMAGED")

    return await audit_crud.update_cycle(
        db,
        cycle,
        status="CLOSED",
        closed_at=datetime.now(timezone.utc),
    )


async def list_discrepancies(db: AsyncSession, cycle_id: str) -> list[dict]:
    """Items flagged MISSING or DAMAGED, joined with asset info (PS report)."""
    cycle = await audit_crud.get_cycle_by_id(db, cycle_id)
    if not cycle:
        raise AppError(404, "CYCLE_NOT_FOUND", "Audit cycle not found")

    items = await audit_crud.list_items_for_cycle(db, cycle_id)
    flagged = [i for i in items if i.result in ("MISSING", "DAMAGED")]

    out = []
    for item in flagged:
        asset = await asset_crud.get_by_id(db, item.asset_id)
        out.append({
            "asset_id": item.asset_id,
            "asset_tag": asset.asset_tag if asset else "?",
            "asset_name": asset.name if asset else "Unknown",
            "result": item.result,
            "notes": item.notes,
        })
    return out


async def list_items(
    db: AsyncSession, cycle_id: str, result_filter: str | None = None
) -> list[AuditItem]:
    cycle = await audit_crud.get_cycle_by_id(db, cycle_id)
    if not cycle:
        raise AppError(404, "CYCLE_NOT_FOUND", "Audit cycle not found")

    items = await audit_crud.list_items_for_cycle(db, cycle_id)
    if result_filter:
        items = [i for i in items if i.result == result_filter]
    return items


async def update_item(
    db: AsyncSession,
    cycle_id: str,
    item_id: str,
    actor_id: str,
    result: str,
    notes: str | None,
    condition: str | None,
) -> AuditItem:
    cycle = await audit_crud.get_cycle_by_id(db, cycle_id)
    if not cycle:
        raise AppError(404, "CYCLE_NOT_FOUND", "Audit cycle not found")
    if cycle.status != "OPEN":
        raise AppError(409, "CYCLE_CLOSED", "Cannot update items in a closed cycle")

    item = await audit_crud.get_item_by_id(db, item_id)
    if not item or item.cycle_id != cycle_id:
        raise AppError(404, "ITEM_NOT_FOUND", "Audit item not found")

    return await audit_crud.update_item(
        db,
        item,
        result=result,
        notes=notes,
        condition=condition,
        verified_by_id=actor_id,
        verified_at=datetime.now(timezone.utc),
    )
