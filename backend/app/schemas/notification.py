from datetime import datetime
from typing import Literal, Optional

from app.schemas.base import CamelModel

NotificationType = Literal[
    "ASSET_ALLOCATED",
    "ASSET_RETURNED",
    "TRANSFER_REQUESTED",
    "TRANSFER_APPROVED",
    "TRANSFER_REJECTED",
    "MAINTENANCE_REQUESTED",
    "MAINTENANCE_APPROVED",
    "MAINTENANCE_RESOLVED",
    "BOOKING_REMINDER",
    "OVERDUE_RETURN",
    "AUDIT_ASSIGNED",
]


class NotificationResponse(CamelModel):
    id: str
    type: NotificationType
    message: str
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: datetime
