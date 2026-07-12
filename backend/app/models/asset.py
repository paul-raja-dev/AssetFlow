import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    Sequence,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# Used by asset_service to generate AF-XXXX tags
asset_tag_seq = Sequence("asset_tag_seq", start=1)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    asset_tag: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("asset_categories.id"), nullable=False
    )
    serial_number: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="AVAILABLE"
    )
    condition: Mapped[str] = mapped_column(
        String(20), nullable=False, default="GOOD"
    )
    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purchase_cost: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    warranty_expiry: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True
    )
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_field_values: Mapped[Any] = mapped_column(
        JSON, nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'DISPOSED', 'LOST')",
            name="ck_assets_status",
        ),
        CheckConstraint(
            "condition IN ('GOOD', 'FAIR', 'POOR', 'DAMAGED')",
            name="ck_assets_condition",
        ),
        Index(
            "ix_assets_serial_number_unique",
            "serial_number",
            unique=True,
            postgresql_where=serial_number.isnot(None),
        ),
    )
