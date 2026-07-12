from datetime import datetime
from typing import Literal, Optional

from app.schemas.base import CamelModel

# status is computed (hybrid property), never stored
BookingStatus = Literal["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]


class BookingCreate(CamelModel):
    asset_id: str
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None


class BookingUpdate(CamelModel):
    """Only UPCOMING bookings can be rescheduled."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    purpose: Optional[str] = None


class BookingResponse(CamelModel):
    id: str
    asset_id: str
    booked_by_id: str
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None
    status: BookingStatus          # computed at serialization time
    cancelled_at: Optional[datetime] = None
    created_at: datetime
