from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department


async def get_by_id(db: AsyncSession, dept_id: str) -> Department | None:
    result = await db.execute(select(Department).where(Department.id == dept_id))
    return result.scalar_one_or_none()


async def get_by_name(db: AsyncSession, name: str) -> Department | None:
    result = await db.execute(
        select(Department).where(func.lower(Department.name) == name.lower().strip())
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> Department:
    dept = Department(**kwargs)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


async def update(db: AsyncSession, dept: Department, **kwargs) -> Department:
    for key, value in kwargs.items():
        setattr(dept, key, value)
    await db.commit()
    await db.refresh(dept)
    return dept


async def delete(db: AsyncSession, dept: Department) -> None:
    await db.delete(dept)
    await db.commit()


async def list_all(db: AsyncSession) -> list[Department]:
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()
