from typing import Optional

from app.schemas.base import CamelModel


# ── E48: Asset Utilization ────────────────────────────────────────────────────
class AssetUtilizationRow(CamelModel):
    asset_id: str
    asset_tag: str
    asset_name: str
    total_allocation_days: int
    total_booking_hours: float
    utilization_rate: float            # 0.0 – 1.0


class AssetUtilizationReport(CamelModel):
    items: list[AssetUtilizationRow]


# ── E49: Department Assets ────────────────────────────────────────────────────
class DepartmentAssetsRow(CamelModel):
    department_id: str
    department_name: str
    total_assets: int
    allocated: int
    available: int
    under_maintenance: int


class DepartmentAssetsReport(CamelModel):
    items: list[DepartmentAssetsRow]


# ── E50: Maintenance Summary ──────────────────────────────────────────────────
class MaintenanceSummaryRow(CamelModel):
    status: str
    count: int
    avg_resolution_days: Optional[float] = None


class MaintenanceSummaryReport(CamelModel):
    items: list[MaintenanceSummaryRow]


# ── E51: Audit Compliance ─────────────────────────────────────────────────────
class AuditComplianceRow(CamelModel):
    cycle_id: str
    cycle_name: str
    total_items: int
    found: int
    missing: int
    damaged: int
    compliance_rate: float             # found / total_items


class AuditComplianceReport(CamelModel):
    items: list[AuditComplianceRow]
