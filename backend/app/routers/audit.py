"""Audit router — E41-E46: audit cycles and audit items."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.models.audit_cycle import AuditCycle
from app.models.audit_item import AuditItem
from app.schemas.audit import (
    AuditCycleCreate,
    AuditItemResponse,
    AuditItemUpdate,
    DiscrepancyResponse,
)
from app.services import audit_service

router = APIRouter()


def _cycle_dict(
    cycle: AuditCycle, auditor_ids: list[str], items: list[AuditItem]
) -> dict:
    return {
        "id": cycle.id,
        "name": cycle.name,
        "status": cycle.status,
        "departmentId": cycle.department_id,
        "location": cycle.location,
        "auditorIds": auditor_ids,
        "totalItems": len(items),
        "pendingCount": sum(1 for i in items if i.result == "PENDING"),
        "foundCount": sum(1 for i in items if i.result == "FOUND"),
        "missingCount": sum(1 for i in items if i.result == "MISSING"),
        "damagedCount": sum(1 for i in items if i.result == "DAMAGED"),
        "createdById": cycle.created_by_id,
        "closedAt": cycle.closed_at.isoformat() if cycle.closed_at else None,
        "createdAt": cycle.created_at.isoformat(),
    }


@router.get("")
async def list_cycles(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """List all audit cycles — ADMIN / ASSET_MANAGER only."""
    cycles = await audit_service.list_cycles(db)
    data = []
    for cycle in cycles:
        _, auditor_ids, items = await audit_service.get_cycle(db, cycle.id)
        data.append(_cycle_dict(cycle, auditor_ids, items))
    return ok(data=data)


@router.post("", status_code=201)
async def create_cycle(
    body: AuditCycleCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Create an audit cycle — ADMIN / ASSET_MANAGER only."""
    cycle, auditor_ids = await audit_service.create_cycle(
        db,
        name=body.name,
        department_id=body.department_id,
        location=body.location,
        auditor_ids=body.auditor_ids,
        created_by_id=user.id,
    )
    _, auditor_ids, items = await audit_service.get_cycle(db, cycle.id)
    return ok(
        data=_cycle_dict(cycle, auditor_ids, items),
        message="Audit cycle created",
    )


@router.get("/{id}")
async def get_cycle(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Get an audit cycle with counts — ADMIN / ASSET_MANAGER only."""
    cycle, auditor_ids, items = await audit_service.get_cycle(db, id)
    return ok(data=_cycle_dict(cycle, auditor_ids, items))


@router.post("/{id}/close")
async def close_cycle(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Close an audit cycle — ADMIN / ASSET_MANAGER only."""
    await audit_service.close_cycle(db, id)
    cycle, auditor_ids, items = await audit_service.get_cycle(db, id)
    return ok(
        data=_cycle_dict(cycle, auditor_ids, items),
        message="Audit cycle closed",
    )


@router.get("/{id}/discrepancies")
async def list_discrepancies(
    id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Auto-generated discrepancy report: items marked MISSING or DAMAGED."""
    rows = await audit_service.list_discrepancies(db, id)
    return ok(
        data=[
            DiscrepancyResponse.model_validate(r).model_dump(by_alias=True)
            for r in rows
        ],
    )


@router.get("/{id}/items")
async def list_items(
    id: str,
    result: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE")),
):
    """List audit items for a cycle — auditors and ADMIN / ASSET_MANAGER."""
    items = await audit_service.list_items(db, id, result_filter=result)
    return ok(
        data=[
            AuditItemResponse.model_validate(i).model_dump(by_alias=True)
            for i in items
        ],
    )


@router.patch("/{id}/items/{item_id}")
async def update_item(
    id: str,
    item_id: str,
    body: AuditItemUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE")),
):
    """Update an audit item's result — auditors and ADMIN / ASSET_MANAGER."""
    item = await audit_service.update_item(
        db,
        cycle_id=id,
        item_id=item_id,
        actor_id=user.id,
        result=body.result,
        notes=body.notes,
        condition=body.condition,
    )
    return ok(
        data=AuditItemResponse.model_validate(item).model_dump(by_alias=True),
        message="Audit item updated",
    )
