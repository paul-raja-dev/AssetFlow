from datetime import datetime
from typing import Optional

from app.schemas.base import CamelModel


class DepartmentCreate(CamelModel):
    name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_id: Optional[str] = None


class DepartmentUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_id: Optional[str] = None


class DepartmentResponse(CamelModel):
    id: str
    name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_id: Optional[str] = None
    created_at: datetime
