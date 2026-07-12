from datetime import datetime
from typing import Literal, Optional

from app.schemas.base import CamelModel

TransferType = Literal["TRANSFER", "RETURN"]
TransferStatus = Literal["PENDING", "APPROVED", "REJECTED"]


class TransferRequestCreate(CamelModel):
    asset_id: str
    type: TransferType
    to_user_id: Optional[str] = None
    to_department_id: Optional[str] = None
    notes: Optional[str] = None


class TransferRequestUpdate(CamelModel):
    """Used by approver/rejecter (ADMIN / ASSET_MANAGER)."""
    status: Literal["APPROVED", "REJECTED"]
    notes: Optional[str] = None


class TransferRequestResponse(CamelModel):
    id: str
    asset_id: str
    type: TransferType
    status: TransferStatus
    requested_by_id: str
    to_user_id: Optional[str] = None
    to_department_id: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
