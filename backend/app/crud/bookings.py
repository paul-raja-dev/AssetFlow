from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking


async def get_by_id(db: AsyncSession, booking_id: str) -> Booking | None:
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    return result.scalar_one_or_none()


async def has_overlap(
    db: AsyncSession, asset_id: str, start_time: datetime, end_time: datetime, exclude_id: str | None = None
) -> bool:
    """True if a non-cancelled booking overlaps the requested slot."""
    query = select(Booking).where(
        Booking.asset_id == asset_id,
        Booking.cancelled_at.is_(None),
        Booking.start_time < end_time,
        Booking.end_time > start_time,
    )
    if exclude_id:
        query = query.where(Booking.id != exclude_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def create(db: AsyncSession, **kwargs) -> Booking:
    booking = Booking(**kwargs)
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def update(db: AsyncSession, booking: Booking, **kwargs) -> Booking:
    for key, value in kwargs.items():
        setattr(booking, key, value)
    await db.commit()
    await db.refresh(booking)
    return booking


def build_list_query(
    asset_id: str | None = None,
    booked_by_id: str | None = None,
):
    query = select(Booking)
    if asset_id:
        query = query.where(Booking.asset_id == asset_id)
    if booked_by_id:
        query = query.where(Booking.booked_by_id == booked_by_id)
    return query.order_by(Booking.start_time.desc())
