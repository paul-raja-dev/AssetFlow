from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, asset_tag_seq


async def get_by_id(db: AsyncSession, asset_id: str) -> Asset | None:
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    return result.scalar_one_or_none()


async def get_by_tag(db: AsyncSession, asset_tag: str) -> Asset | None:
    result = await db.execute(select(Asset).where(Asset.asset_tag == asset_tag))
    return result.scalar_one_or_none()


async def next_sequence_val(db: AsyncSession) -> int:
    result = await db.execute(text("SELECT nextval('asset_tag_seq')"))
    return result.scalar()


async def create(db: AsyncSession, **kwargs) -> Asset:
    asset = Asset(**kwargs)
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


async def update(db: AsyncSession, asset: Asset, **kwargs) -> Asset:
    for key, value in kwargs.items():
        setattr(asset, key, value)
    await db.commit()
    await db.refresh(asset)
    return asset


async def delete(db: AsyncSession, asset: Asset) -> None:
    await db.delete(asset)
    await db.commit()


def build_list_query(
    search: str | None = None,
    status: str | None = None,
    condition: str | None = None,
    category_id: str | None = None,
    department_id: str | None = None,
):
    query = select(Asset)
    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            func.lower(Asset.name).like(term)
            | func.lower(Asset.asset_tag).like(term)
            | func.lower(Asset.serial_number).like(term)
        )
    if status:
        query = query.where(Asset.status == status)
    if condition:
        query = query.where(Asset.condition == condition)
    if category_id:
        query = query.where(Asset.category_id == category_id)
    if department_id:
        query = query.where(Asset.department_id == department_id)
    return query.order_by(Asset.asset_tag)
