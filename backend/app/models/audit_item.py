import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditItem(Base):
    __tablename__ = "audit_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    cycle_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("audit_cycles.id"), nullable=False
    )
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id"), nullable=False
    )
    result: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    condition: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )
    verified_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "result IN ('PENDING', 'FOUND', 'MISSING', 'DAMAGED')",
            name="ck_audit_items_result",
        ),
        CheckConstraint(
            "condition IN ('GOOD', 'FAIR', 'POOR', 'DAMAGED')",
            name="ck_audit_items_condition",
        ),
    )
