import uuid

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.departments as dept_crud
import app.crud.users as users_crud
from app.exceptions import AppError
from app.models.department import Department


async def list_departments(db: AsyncSession) -> list[Department]:
    return await dept_crud.list_all(db)


async def create_department(
    db: AsyncSession,
    name: str,
    description: str | None = None,
    parent_department_id: str | None = None,
    head_id: str | None = None,
) -> Department:
    # Unique name check
    if await dept_crud.get_by_name(db, name):
        raise AppError(409, "DEPARTMENT_NAME_EXISTS", f"A department named '{name}' already exists")

    # head must be ASSET_MANAGER or ADMIN
    if head_id:
        head = await users_crud.get_by_id(db, head_id)
        if not head or head.role not in ("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"):
            raise AppError(400, "INVALID_HEAD_ROLE", "Department head must be an Admin, Asset Manager, or Department Head")

    return await dept_crud.create(
        db,
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        parent_department_id=parent_department_id,
        head_id=head_id,
    )


async def update_department(db: AsyncSession, dept_id: str, **updates) -> Department:
    dept = await dept_crud.get_by_id(db, dept_id)
    if not dept:
        raise AppError(404, "DEPARTMENT_NOT_FOUND", "Department not found")

    # Self-parent guard
    if updates.get("parent_department_id") == dept_id:
        raise AppError(400, "SELF_PARENT", "A department cannot be its own parent")

    # Name uniqueness (only if name is being changed)
    if "name" in updates and updates["name"].lower() != dept.name.lower():
        if await dept_crud.get_by_name(db, updates["name"]):
            raise AppError(409, "DEPARTMENT_NAME_EXISTS", f"A department named '{updates['name']}' already exists")

    # head role validation
    if "head_id" in updates and updates["head_id"]:
        head = await users_crud.get_by_id(db, updates["head_id"])
        if not head or head.role not in ("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"):
            raise AppError(400, "INVALID_HEAD_ROLE", "Department head must be an Admin, Asset Manager, or Department Head")

    return await dept_crud.update(db, dept, **updates)


async def delete_department(db: AsyncSession, dept_id: str) -> None:
    dept = await dept_crud.get_by_id(db, dept_id)
    if not dept:
        raise AppError(404, "DEPARTMENT_NOT_FOUND", "Department not found")
    await dept_crud.delete(db, dept)
