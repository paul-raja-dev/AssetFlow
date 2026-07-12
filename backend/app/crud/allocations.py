from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.allocation import Allocation


async def get_by_id(db: AsyncSession, alloc_id: str) -> Allocation | None:
    result = await db.execute(select(Allocation).where(Allocation.id == alloc_id))
    return result.scalar_one_or_none()


async def get_active_for_asset(db: AsyncSession, asset_id: str) -> Allocation | None:
    result = await db.execute(
        select(Allocation).where(
            Allocation.asset_id == asset_id,
            Allocation.status == "ACTIVE",
        )
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> Allocation:
    alloc = Allocation(**kwargs)
    db.add(alloc)
    await db.commit()
    await db.refresh(alloc)
    return alloc


async def update(db: AsyncSession, alloc: Allocation, **kwargs) -> Allocation:
    for key, value in kwargs.items():
        setattr(alloc, key, value)
    await db.commit()
    await db.refresh(alloc)
    return alloc


def build_list_query(
    asset_id: str | None = None,
    user_id: str | None = None,
    department_id: str | None = None,
    status: str | None = None,
    overdue_only: bool = False,
):
    from sqlalchemy import and_, or_
    from app.models.allocation import Allocation as A
    import datetime, timezone

    query = select(A)
    if asset_id:
        query = query.where(A.asset_id == asset_id)
    if user_id:
        query = query.where(A.allocated_to_user_id == user_id)
    if department_id:
        query = query.where(A.allocated_to_department_id == department_id)
    if status:
        query = query.where(A.status == status)
    if overdue_only:
        today = date.today()
        query = query.where(A.status == "ACTIVE", A.expected_return_date < today)
    return query.order_by(A.created_at.desc())
