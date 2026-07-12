import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id"), nullable=False
    )
    booked_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @hybrid_property
    def status(self) -> str:
        if self.cancelled_at is not None:
            return "CANCELLED"
        now = datetime.now(timezone.utc)
        # Some drivers return naive datetimes — treat them as UTC.
        start = self.start_time if self.start_time.tzinfo else self.start_time.replace(tzinfo=timezone.utc)
        end = self.end_time if self.end_time.tzinfo else self.end_time.replace(tzinfo=timezone.utc)
        if now < start:
            return "UPCOMING"
        if start <= now <= end:
            return "ONGOING"
        return "COMPLETED"

    __table_args__ = (
        Index(
            "ix_bookings_asset_time",
            "asset_id",
            "start_time",
            "end_time",
        ),
    )
