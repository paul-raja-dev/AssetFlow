from datetime import date, datetime
from typing import Any, Literal, Optional

from app.schemas.base import CamelModel

AssetStatus = Literal["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "DISPOSED", "LOST"]
AssetCondition = Literal["GOOD", "FAIR", "POOR", "DAMAGED"]


class CurrentHolder(CamelModel):
    """Resolved at query time — who/what currently holds the asset."""
    type: Literal["USER", "DEPARTMENT"]
    id: str
    name: str


class AssetCreate(CamelModel):
    name: str
    category_id: str
    serial_number: Optional[str] = None
    department_id: Optional[str] = None
    condition: AssetCondition = "GOOD"
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    warranty_expiry: Optional[date] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    custom_field_values: dict[str, Any] = {}


class AssetUpdate(CamelModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    serial_number: Optional[str] = None
    department_id: Optional[str] = None
    condition: Optional[AssetCondition] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    warranty_expiry: Optional[date] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    custom_field_values: Optional[dict[str, Any]] = None


class AssetStatusUpdate(CamelModel):
    status: AssetStatus


class AssetResponse(CamelModel):
    id: str
    asset_tag: str
    name: str
    category_id: str
    serial_number: Optional[str] = None
    department_id: Optional[str] = None
    status: AssetStatus
    condition: AssetCondition
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    warranty_expiry: Optional[date] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    custom_field_values: dict[str, Any] = {}
    current_holder: Optional[CurrentHolder] = None
    created_at: datetime
