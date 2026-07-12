from datetime import datetime
from typing import Any, Optional

from app.schemas.base import CamelModel


class CustomFieldDef(CamelModel):
    """Definition of a single custom field for a category."""
    name: str
    field_type: str  # e.g. "text", "number", "date", "boolean"
    required: bool = False


class AssetCategoryCreate(CamelModel):
    name: str
    description: Optional[str] = None
    custom_fields: list[CustomFieldDef] = []


class AssetCategoryUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    custom_fields: Optional[list[CustomFieldDef]] = None


class AssetCategoryResponse(CamelModel):
    id: str
    name: str
    description: Optional[str] = None
    custom_fields: list[dict[str, Any]] = []
    created_at: datetime
