from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.user import User


async def get_user(db: AsyncSession, user_id: str) -> User:
    user = await users_crud.get_by_id(db, user_id)
    if not user:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return user


# Fields a user may change on their own profile. Everything else
# (role, status, department) is Admin-managed from the Employee Directory.
_SELF_EDITABLE = {"first_name", "last_name", "avatar_url"}
_PRIVILEGED = {"role", "status", "department_id"}


async def update_user(db: AsyncSession, target_id: str, actor: User, **updates) -> User:
    target = await users_crud.get_by_id(db, target_id)
    if not target:
        raise AppError(404, "USER_NOT_FOUND", "User not found")

    is_self = actor.id == target.id
    is_admin = actor.role == "ADMIN"

    # Only the user themself or an Admin may touch an account at all.
    if not is_self and not is_admin:
        raise AppError(403, "FORBIDDEN", "You can only edit your own profile")

    # Privileged fields (role/status/department) are Admin-only — this is the
    # ONLY place roles are assigned (PS: no self-assigned roles).
    touched_privileged = _PRIVILEGED & set(updates)
    if touched_privileged and not is_admin:
        raise AppError(403, "FORBIDDEN", "Only an Admin can change role, status, or department")

    # An Admin cannot change their own role (no accidental self-demotion),
    # and cannot modify another Admin's account.
    if is_admin and is_self and updates.get("role") and updates["role"] != actor.role:
        raise AppError(403, "FORBIDDEN", "Admin cannot change their own role")
    if target.role == "ADMIN" and not is_self:
        raise AppError(403, "FORBIDDEN", "Cannot modify another Admin's account")

    # Non-admins are restricted to basic profile fields.
    if not is_admin:
        disallowed = set(updates) - _SELF_EDITABLE
        if disallowed:
            raise AppError(403, "FORBIDDEN", f"You cannot change: {', '.join(sorted(disallowed))}")

    if updates.get("role") == "ADMIN":
        raise AppError(403, "FORBIDDEN", "Cannot promote a user to Admin")

    return await users_crud.update(db, target, **updates)
