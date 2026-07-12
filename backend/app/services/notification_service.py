import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.notifications as notif_crud
from app.exceptions import AppError
from app.models.notification import Notification


async def notify(
    db: AsyncSession,
    user_id: str,
    type_: str,
    message: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
) -> None:
    """Create a notification, silently deduping on the
    (user_id, type, related_entity_id) unique constraint."""
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type_,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )
    db.add(notif)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()  # duplicate notification — ignore


async def notify_many(
    db: AsyncSession,
    user_ids: list[str],
    type_: str,
    message: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
) -> None:
    for uid in user_ids:
        await notify(db, uid, type_, message, related_entity_type, related_entity_id)


async def list_notifications(
    db: AsyncSession, user_id: str, is_read: bool | None = None
) -> list[Notification]:
    return await notif_crud.list_for_user(db, user_id, is_read=is_read)


async def mark_read(db: AsyncSession, notif_id: str, user_id: str) -> Notification:
    notif = await notif_crud.get_by_id(db, notif_id)
    if not notif:
        raise AppError(404, "NOTIFICATION_NOT_FOUND", "Notification not found")
    if notif.user_id != user_id:
        raise AppError(403, "FORBIDDEN", "Not permitted for this action")
    return await notif_crud.mark_read(db, notif)


async def mark_all_read(db: AsyncSession, user_id: str) -> dict:
    count = await notif_crud.mark_all_read(db, user_id)
    return {"updated": count}
