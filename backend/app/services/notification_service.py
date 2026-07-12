from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.notifications as notif_crud
from app.exceptions import AppError
from app.models.notification import Notification


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
