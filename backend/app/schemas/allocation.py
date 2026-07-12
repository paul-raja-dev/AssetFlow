from datetime import date, datetime
from typing import Literal, Optional

from pydantic import model_validator

from app.schemas.base import CamelModel

AllocationStatus = Literal["ACTIVE", "RETURNED"]


class AllocationCreate(CamelModel):
    asset_id: str
    allocated_to_user_id: Optional[str] = None
    allocated_to_department_id: Optional[str] = None
    expected_return_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def exactly_one_recipient(self) -> "AllocationCreate":
        has_user = self.allocated_to_user_id is not None
        has_dept = self.allocated_to_department_id is not None
        if has_user == has_dept:  # both set or neither set
            raise ValueError(
                "Provide exactly one of allocated_to_user_id or allocated_to_department_id"
            )
        return self


class AllocationResponse(CamelModel):
    id: str
    asset_id: str
    allocated_to_user_id: Optional[str] = None
    allocated_to_department_id: Optional[str] = None
    allocated_by_id: str
    status: AllocationStatus
    expected_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None
    notes: Optional[str] = None
    is_overdue: bool = False
    created_at: datetime
