"""Departments router — E09-E12: list, create, update, delete."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services import department_service

router = APIRouter()


@router.get("")
async def list_departments(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List all departments — any authenticated user."""
    depts = await department_service.list_departments(db)
    return ok(
        data=[
            DepartmentResponse.model_validate(d).model_dump(by_alias=True)
            for d in depts
        ],
    )


@router.post("", status_code=201)
async def create_department(
    body: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Create a department — ADMIN / ASSET_MANAGER only."""
    dept = await department_service.create_department(
        db,
        name=body.name,
        description=body.description,
        parent_department_id=body.parent_department_id,
        head_id=body.head_id,
    )
    return ok(
        data=DepartmentResponse.model_validate(dept).model_dump(by_alias=True),
        message="Department created",
    )


@router.patch("/{dept_id}")
async def update_department(
    dept_id: str,
    body: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Update a department — ADMIN / ASSET_MANAGER only."""
    updates = body.model_dump(exclude_none=True)
    dept = await department_service.update_department(db, dept_id, **updates)
    return ok(
        data=DepartmentResponse.model_validate(dept).model_dump(by_alias=True),
        message="Department updated",
    )


@router.delete("/{dept_id}")
async def delete_department(
    dept_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    """Delete a department — ADMIN only."""
    await department_service.delete_department(db, dept_id)
    return ok(message="Department deleted")
