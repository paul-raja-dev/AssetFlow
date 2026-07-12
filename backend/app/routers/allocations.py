from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.dependencies.pagination import Pagination, paginate
from app.schemas.allocation import AllocationCreate, AllocationResponse
from app.services import allocation_service

router = APIRouter()


@router.get("")
async def list_allocations(
    asset_id: str | None = Query(None, alias="assetId"),
    user_id: str | None = Query(None, alias="userId"),
    department_id: str | None = Query(None, alias="departmentId"),
    status: str | None = Query(None),
    overdue_only: bool = Query(False, alias="overdueOnly"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    query = await allocation_service.list_allocations(
        db, asset_id=asset_id, user_id=user_id,
        department_id=department_id, status=status, overdue_only=overdue_only,
    )
    result = await paginate(query, db, pagination)
    result["items"] = [AllocationResponse.model_validate(a).model_dump(by_alias=True) for a in result["items"]]
    return ok(data=result)


@router.post("", status_code=201)
async def allocate_asset(
    body: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    alloc = await allocation_service.allocate_asset(
        db,
        asset_id=body.asset_id,
        allocated_by_id=current_user.id,
        allocated_to_user_id=body.allocated_to_user_id,
        allocated_to_department_id=body.allocated_to_department_id,
        expected_return_date=body.expected_return_date,
        notes=body.notes,
    )
    return ok(data=AllocationResponse.model_validate(alloc).model_dump(by_alias=True), message="Asset allocated")


@router.get("/{alloc_id}")
async def get_allocation(
    alloc_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    alloc = await allocation_service.get_allocation(db, alloc_id)
    return ok(data=AllocationResponse.model_validate(alloc).model_dump(by_alias=True))


@router.patch("/{alloc_id}/return")
async def return_asset(
    alloc_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    alloc = await allocation_service.return_asset(db, alloc_id)
    return ok(data=AllocationResponse.model_validate(alloc).model_dump(by_alias=True), message="Asset returned")


@router.get("/asset/{asset_id}/history")
async def get_asset_allocation_history(
    asset_id: str,
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = await allocation_service.get_asset_allocation_history(db, asset_id)
    result = await paginate(query, db, pagination)
    result["items"] = [AllocationResponse.model_validate(a).model_dump(by_alias=True) for a in result["items"]]
    return ok(data=result)
