from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset_category import AssetCategory


async def get_by_id(db: AsyncSession, cat_id: str) -> AssetCategory | None:
    result = await db.execute(select(AssetCategory).where(AssetCategory.id == cat_id))
    return result.scalar_one_or_none()


async def get_by_name(db: AsyncSession, name: str) -> AssetCategory | None:
    result = await db.execute(
        select(AssetCategory).where(func.lower(AssetCategory.name) == name.lower().strip())
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> AssetCategory:
    cat = AssetCategory(**kwargs)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def update(db: AsyncSession, cat: AssetCategory, **kwargs) -> AssetCategory:
    for key, value in kwargs.items():
        setattr(cat, key, value)
    await db.commit()
    await db.refresh(cat)
    return cat


async def list_all(db: AsyncSession) -> list[AssetCategory]:
    result = await db.execute(select(AssetCategory).order_by(AssetCategory.name))
    return result.scalars().all()
