from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.dependencies.pagination import Pagination, paginate
from app.schemas.user import UserResponse, UserUpdate
from app.services import user_service

router = APIRouter()


@router.get("")
async def list_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    status: str | None = Query(None),
    department_id: str | None = Query(None, alias="departmentId"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    from app.crud import users as users_crud
    query = await users_crud.list_users(db, search=search, role=role, status=status, department_id=department_id)
    result = await paginate(query, db, pagination)
    result["items"] = [UserResponse.model_validate(u).model_dump(by_alias=True) for u in result["items"]]
    return ok(data=result)


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    user = await user_service.get_user(db, user_id)
    return ok(data=UserResponse.model_validate(user).model_dump(by_alias=True))


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)
    user = await user_service.update_user(db, user_id, actor=current_user, **updates)
    return ok(data=UserResponse.model_validate(user).model_dump(by_alias=True), message="User updated")
