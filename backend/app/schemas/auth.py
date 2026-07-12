from datetime import datetime
from typing import Literal, Optional

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel

# ── Enums (as Literals) ───────────────────────────────────────────────────────
UserRole = Literal["ADMIN", "ASSET_MANAGER", "EMPLOYEE"]
UserStatus = Literal["ACTIVE", "INACTIVE"]


# ── Requests ──────────────────────────────────────────────────────────────────
class SignupRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: str
    last_name: str
    role: UserRole = "EMPLOYEE"


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(CamelModel):
    email: EmailStr


class ResetPasswordRequest(CamelModel):
    token: str
    new_password: str = Field(min_length=6)


# ── Responses ─────────────────────────────────────────────────────────────────
class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"


class AuthUserResponse(CamelModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    status: UserStatus
    department_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
