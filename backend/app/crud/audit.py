from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_cycle import AuditCycle, audit_cycle_auditors
from app.models.audit_item import AuditItem


# ── Audit Cycles ──────────────────────────────────────────────────────────────
async def get_cycle_by_id(db: AsyncSession, cycle_id: str) -> AuditCycle | None:
    result = await db.execute(select(AuditCycle).where(AuditCycle.id == cycle_id))
    return result.scalar_one_or_none()


async def list_cycles(db: AsyncSession) -> list[AuditCycle]:
    result = await db.execute(
        select(AuditCycle).order_by(AuditCycle.created_at.desc())
    )
    return result.scalars().all()


async def create_cycle(db: AsyncSession, **kwargs) -> AuditCycle:
    cycle = AuditCycle(**kwargs)
    db.add(cycle)
    await db.commit()
    await db.refresh(cycle)
    return cycle


async def update_cycle(db: AsyncSession, cycle: AuditCycle, **kwargs) -> AuditCycle:
    for key, value in kwargs.items():
        setattr(cycle, key, value)
    await db.commit()
    await db.refresh(cycle)
    return cycle


# ── Audit Items ───────────────────────────────────────────────────────────────
async def get_item_by_id(db: AsyncSession, item_id: str) -> AuditItem | None:
    result = await db.execute(select(AuditItem).where(AuditItem.id == item_id))
    return result.scalar_one_or_none()


async def update_item(db: AsyncSession, item: AuditItem, **kwargs) -> AuditItem:
    for key, value in kwargs.items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


async def list_items_for_cycle(db: AsyncSession, cycle_id: str) -> list[AuditItem]:
    result = await db.execute(
        select(AuditItem).where(AuditItem.cycle_id == cycle_id)
    )
    return result.scalars().all()


async def bulk_create_items(
    db: AsyncSession, cycle_id: str, asset_ids: list[str]
) -> None:
    items = [
        AuditItem(cycle_id=cycle_id, asset_id=asset_id, result="PENDING")
        for asset_id in asset_ids
    ]
    db.add_all(items)
    await db.commit()


# ── Auditors join table ───────────────────────────────────────────────────────
async def get_auditor_ids(db: AsyncSession, cycle_id: str) -> list[str]:
    result = await db.execute(
        select(audit_cycle_auditors.c.user_id).where(
            audit_cycle_auditors.c.cycle_id == cycle_id
        )
    )
    return [row[0] for row in result.all()]


async def set_auditors(db: AsyncSession, cycle_id: str, user_ids: list[str]) -> None:
    await db.execute(
        delete(audit_cycle_auditors).where(
            audit_cycle_auditors.c.cycle_id == cycle_id
        )
    )
    if user_ids:
        await db.execute(
            insert(audit_cycle_auditors).values(
                [{"cycle_id": cycle_id, "user_id": uid} for uid in user_ids]
            )
        )
    await db.commit()
