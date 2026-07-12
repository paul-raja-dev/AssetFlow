from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(func.lower(User.email) == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> User:
    user = User(**kwargs)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update(db: AsyncSession, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def list_users(
    db: AsyncSession,
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
    department_id: str | None = None,
):
    from sqlalchemy import or_
    query = select(User)
    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(User.first_name).like(term),
                func.lower(User.last_name).like(term),
                func.lower(User.email).like(term),
            )
        )
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    if department_id:
        query = query.where(User.department_id == department_id)
    return query
