import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.bookings as booking_crud
import app.crud.assets as asset_crud
from app.exceptions import AppError
from app.models.booking import Booking
from app.models.user import User
from app.services import notification_service


def _can_manage(booking: Booking, actor: User) -> bool:
    """Owner, Admin, or Asset Manager may modify a booking."""
    return booking.booked_by_id == actor.id or actor.role in ("ADMIN", "ASSET_MANAGER")


async def list_bookings(db: AsyncSession, **filters):
    return booking_crud.build_list_query(**filters)


async def create_booking(
    db: AsyncSession,
    asset_id: str,
    booked_by_id: str,
    start_time: datetime,
    end_time: datetime,
    purpose: str | None = None,
) -> Booking:
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise AppError(404, "ASSET_NOT_FOUND", "Asset not found")
    if asset.status in ("DISPOSED", "LOST", "UNDER_MAINTENANCE"):
        raise AppError(409, "ASSET_NOT_BOOKABLE", f"Asset is currently {asset.status}")

    if end_time <= start_time:
        raise AppError(400, "INVALID_TIME_RANGE", "end_time must be after start_time")
    if end_time <= datetime.now(timezone.utc):
        raise AppError(400, "SLOT_IN_PAST", "Cannot book a time slot that has already ended")

    if await booking_crud.has_overlap(db, asset_id, start_time, end_time):
        raise AppError(409, "BOOKING_OVERLAP", "Asset is already booked during this time slot")

    booking = await booking_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        booked_by_id=booked_by_id,
        start_time=start_time,
        end_time=end_time,
        purpose=purpose,
    )
    await notification_service.notify(
        db, booked_by_id, "BOOKING_CONFIRMED",
        f"Booking confirmed for {asset.name} ({asset.asset_tag})",
        related_entity_type="BOOKING", related_entity_id=booking.id,
    )
    return booking


async def get_booking(db: AsyncSession, booking_id: str) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    return booking


async def update_booking(
    db: AsyncSession, booking_id: str, actor: User, **updates
) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    if not _can_manage(booking, actor):
        raise AppError(403, "FORBIDDEN", "You can only reschedule your own bookings")
    if booking.status != "UPCOMING":
        raise AppError(409, "NOT_UPCOMING", "Only UPCOMING bookings can be updated")

    new_start = updates.get("start_time", booking.start_time)
    new_end = updates.get("end_time", booking.end_time)
    if new_end <= new_start:
        raise AppError(400, "INVALID_TIME_RANGE", "end_time must be after start_time")
    if await booking_crud.has_overlap(db, booking.asset_id, new_start, new_end, exclude_id=booking_id):
        raise AppError(409, "BOOKING_OVERLAP", "Asset is already booked during this time slot")

    return await booking_crud.update(db, booking, **updates)


async def cancel_booking(db: AsyncSession, booking_id: str, actor: User) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    if not _can_manage(booking, actor):
        raise AppError(403, "FORBIDDEN", "You can only cancel your own bookings")
    if booking.status == "CANCELLED":
        raise AppError(409, "ALREADY_CANCELLED", "Booking is already cancelled")
    if booking.status == "COMPLETED":
        raise AppError(409, "BOOKING_COMPLETED", "Cannot cancel a completed booking")

    booking = await booking_crud.update(db, booking, cancelled_at=datetime.now(timezone.utc))
    await notification_service.notify(
        db, booking.booked_by_id, "BOOKING_CANCELLED",
        "Your booking has been cancelled",
        related_entity_type="BOOKING", related_entity_id=booking.id,
    )
    return booking
