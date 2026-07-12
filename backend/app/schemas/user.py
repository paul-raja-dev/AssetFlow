from datetime import datetime
from typing import Literal, Optional

from pydantic import EmailStr

from app.schemas.base import CamelModel

UserRole = Literal["ADMIN", "ASSET_MANAGER", "EMPLOYEE"]
UserStatus = Literal["ACTIVE", "INACTIVE"]


class UserResponse(CamelModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    status: UserStatus
    department_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime


class UserUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    department_id: Optional[str] = None
    avatar_url: Optional[str] = None
