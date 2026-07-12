from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.exceptions import AppError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Validates JWT and returns the active User ORM object."""
    # Import here to avoid circular imports at module load time
    from app.models.user import User  # noqa: PLC0415

    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise AppError(401, "UNAUTHORIZED", "Invalid token")
    except JWTError:
        raise AppError(401, "UNAUTHORIZED", "Token is invalid or expired")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.status != "ACTIVE":
        raise AppError(401, "UNAUTHORIZED", "Session invalid or account inactive")

    return user


def require_roles(*roles: str):
    """Role-guard factory. Usage: Depends(require_roles('ADMIN', 'ASSET_MANAGER'))"""
    async def checker(user=Depends(get_current_user)):
        if user.role not in roles:
            raise AppError(403, "FORBIDDEN", "Not permitted for this action")
        return user
    return checker
