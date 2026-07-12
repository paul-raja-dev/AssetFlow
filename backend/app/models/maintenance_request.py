import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id"), nullable=False
    )
    requested_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="MEDIUM"
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    technician_notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    resolution_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')",
            name="ck_maintenance_requests_status",
        ),
        CheckConstraint(
            "priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="ck_maintenance_requests_priority",
        ),
        Index(
            "ix_maintenance_one_open_per_asset",
            "asset_id",
            unique=True,
            postgresql_where=status.notin_(["REJECTED", "RESOLVED"]),
            sqlite_where=status.notin_(["REJECTED", "RESOLVED"]),
        ),
    )
