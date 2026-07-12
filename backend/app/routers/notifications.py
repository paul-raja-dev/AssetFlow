"""Notifications router — E47: list and mark read."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user
from app.schemas.notification import NotificationResponse
from app.services import notification_service

router = APIRouter()


@router.get("")
async def list_notifications(
    is_read: bool | None = Query(None, alias="isRead"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """List the current user's notifications — optional ?isRead filter."""
    notifs = await notification_service.list_notifications(
        db, user.id, is_read=is_read
    )
    return ok(
        data=[
            NotificationResponse.model_validate(n).model_dump(by_alias=True)
            for n in notifs
        ],
    )


@router.patch("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Mark all of the current user's notifications as read."""
    result = await notification_service.mark_all_read(db, user.id)
    return ok(data=result, message="All notifications marked as read")


@router.patch("/{notif_id}/read")
async def mark_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Mark a single notification as read."""
    notif = await notification_service.mark_read(db, notif_id, user.id)
    return ok(
        data=NotificationResponse.model_validate(notif).model_dump(by_alias=True),
        message="Notification marked as read",
    )
