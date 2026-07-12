from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def get_by_id(db: AsyncSession, notif_id: str) -> Notification | None:
    result = await db.execute(
        select(Notification).where(Notification.id == notif_id)
    )
    return result.scalar_one_or_none()


async def list_for_user(
    db: AsyncSession, user_id: str, is_read: bool | None = None
) -> list[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    query = query.order_by(Notification.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def mark_read(db: AsyncSession, notif: Notification) -> Notification:
    setattr(notif, "is_read", True)
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_read(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()
    return result.rowcount
