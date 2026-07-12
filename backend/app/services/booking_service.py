import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.bookings as booking_crud
from app.exceptions import AppError
from app.models.booking import Booking


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
    if end_time <= start_time:
        raise AppError(400, "INVALID_TIME_RANGE", "end_time must be after start_time")

    if await booking_crud.has_overlap(db, asset_id, start_time, end_time):
        raise AppError(409, "BOOKING_OVERLAP", "Asset is already booked during this time slot")

    return await booking_crud.create(
        db,
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        booked_by_id=booked_by_id,
        start_time=start_time,
        end_time=end_time,
        purpose=purpose,
    )


async def get_booking(db: AsyncSession, booking_id: str) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    return booking


async def update_booking(
    db: AsyncSession, booking_id: str, actor_id: str, **updates
) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    if booking.status != "UPCOMING":
        raise AppError(409, "NOT_UPCOMING", "Only UPCOMING bookings can be updated")

    # Re-check overlap if time is being changed
    new_start = updates.get("start_time", booking.start_time)
    new_end = updates.get("end_time", booking.end_time)
    if new_end <= new_start:
        raise AppError(400, "INVALID_TIME_RANGE", "end_time must be after start_time")
    if await booking_crud.has_overlap(db, booking.asset_id, new_start, new_end, exclude_id=booking_id):
        raise AppError(409, "BOOKING_OVERLAP", "Asset is already booked during this time slot")

    return await booking_crud.update(db, booking, **updates)


async def cancel_booking(db: AsyncSession, booking_id: str, actor_id: str) -> Booking:
    booking = await booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise AppError(404, "BOOKING_NOT_FOUND", "Booking not found")
    if booking.status == "CANCELLED":
        raise AppError(409, "ALREADY_CANCELLED", "Booking is already cancelled")
    if booking.status == "COMPLETED":
        raise AppError(409, "BOOKING_COMPLETED", "Cannot cancel a completed booking")

    return await booking_crud.update(db, booking, cancelled_at=datetime.now(timezone.utc))
