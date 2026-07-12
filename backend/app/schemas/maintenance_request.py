from datetime import date, datetime
from typing import Literal, Optional

from app.schemas.base import CamelModel

MaintenancePriority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
MaintenanceStatus = Literal["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED", "REJECTED"]


class MaintenanceRequestCreate(CamelModel):
    asset_id: str
    description: str
    priority: MaintenancePriority = "MEDIUM"


class MaintenanceRequestUpdate(CamelModel):
    """Status transitions + technician notes by ASSET_MANAGER/ADMIN."""
    status: MaintenanceStatus
    technician_notes: Optional[str] = None
    resolution_date: Optional[date] = None


class MaintenanceRequestResponse(CamelModel):
    id: str
    asset_id: str
    requested_by_id: str
    status: MaintenanceStatus
    priority: MaintenancePriority
    description: str
    technician_notes: Optional[str] = None
    resolution_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
