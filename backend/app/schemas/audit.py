from datetime import datetime
from typing import Literal, Optional

from app.schemas.base import CamelModel

AuditCycleStatus = Literal["OPEN", "CLOSED"]
AuditItemResult = Literal["PENDING", "FOUND", "MISSING", "DAMAGED"]


# ── Audit Cycle ───────────────────────────────────────────────────────────────
class AuditCycleCreate(CamelModel):
    name: str
    department_id: Optional[str] = None   # scope by dept
    location: Optional[str] = None        # scope by location
    auditor_ids: list[str] = []


class AuditCycleResponse(CamelModel):
    id: str
    name: str
    status: AuditCycleStatus
    department_id: Optional[str] = None
    location: Optional[str] = None
    auditor_ids: list[str] = []
    total_items: int = 0
    pending_count: int = 0
    found_count: int = 0
    missing_count: int = 0
    damaged_count: int = 0
    created_by_id: str
    closed_at: Optional[datetime] = None
    created_at: datetime


# ── Audit Item ────────────────────────────────────────────────────────────────
class AuditItemUpdate(CamelModel):
    result: AuditItemResult
    notes: Optional[str] = None
    condition: Optional[Literal["GOOD", "FAIR", "POOR", "DAMAGED"]] = None


class AuditItemResponse(CamelModel):
    id: str
    cycle_id: str
    asset_id: str
    result: AuditItemResult
    notes: Optional[str] = None
    condition: Optional[str] = None
    verified_by_id: Optional[str] = None
    verified_at: Optional[datetime] = None


# ── Discrepancy (items not FOUND) ─────────────────────────────────────────────
class DiscrepancyResponse(CamelModel):
    asset_id: str
    asset_tag: str
    asset_name: str
    result: AuditItemResult
    notes: Optional[str] = None
