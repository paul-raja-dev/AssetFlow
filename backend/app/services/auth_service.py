import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.password_reset_token import PasswordResetToken


async def signup(db: AsyncSession, email: str, password: str, first_name: str, last_name: str, role: str) -> dict:
    existing = await users_crud.get_by_email(db, email)
    if existing:
        raise AppError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists")

    user = await users_crud.create(
        db,
        email=email.lower().strip(),
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    token = create_access_token(user.id)
    return {"user": user, "access_token": token}


async def login(db: AsyncSession, email: str, password: str) -> dict:
    user = await users_crud.get_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect")
    if user.status != "ACTIVE":
        raise AppError(403, "ACCOUNT_INACTIVE", "Your account has been deactivated")

    token = create_access_token(user.id)
    return {"user": user, "access_token": token}


async def forgot_password(db: AsyncSession, email: str) -> None:
    """Always returns 200 to avoid email enumeration — silently no-ops if user not found."""
    user = await users_crud.get_by_email(db, email)
    if not user:
        return  # silent no-op

    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    reset = PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=raw_token,
        expires_at=expires_at,
    )
    db.add(reset)
    await db.commit()
    # TODO: send email with reset link containing raw_token


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used_at.is_(None),
        )
    )
    reset = result.scalar_one_or_none()

    if not reset:
        raise AppError(400, "INVALID_TOKEN", "Reset token is invalid or already used")
    if reset.expires_at < datetime.now(timezone.utc):
        raise AppError(400, "TOKEN_EXPIRED", "Reset token has expired")

    user = await users_crud.get_by_id(db, reset.user_id)
    if not user:
        raise AppError(404, "USER_NOT_FOUND", "User not found")

    await users_crud.update(db, user, password_hash=hash_password(new_password))

    reset.used_at = datetime.now(timezone.utc)
    await db.commit()
