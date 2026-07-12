from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.user import User


async def get_user(db: AsyncSession, user_id: str) -> User:
    user = await users_crud.get_by_id(db, user_id)
    if not user:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return user


async def update_user(db: AsyncSession, target_id: str, actor: User, **updates) -> User:
    target = await users_crud.get_by_id(db, target_id)
    if not target:
        raise AppError(404, "USER_NOT_FOUND", "User not found")

    # Admin-immutability guards
    if target.role == "ADMIN" and actor.id != target.id:
        raise AppError(403, "FORBIDDEN", "Cannot modify another Admin's account")
    if actor.id == target.id and updates.get("role") and updates["role"] != actor.role:
        if actor.role == "ADMIN":
            raise AppError(403, "FORBIDDEN", "Admin cannot change their own role")

    return await users_crud.update(db, target, **updates)
