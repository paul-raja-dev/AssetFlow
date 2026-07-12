from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.dependencies.pagination import Pagination, paginate
from app.schemas.asset import AssetCreate, AssetResponse, AssetStatusUpdate, AssetUpdate
from app.services import asset_service

router = APIRouter()


@router.get("")
async def list_assets(
    search: str | None = Query(None),
    status: str | None = Query(None),
    condition: str | None = Query(None),
    category_id: str | None = Query(None, alias="categoryId"),
    department_id: str | None = Query(None, alias="departmentId"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = await asset_service.list_assets(
        db, search=search, status=status, condition=condition,
        category_id=category_id, department_id=department_id,
    )
    result = await paginate(query, db, pagination)
    result["items"] = [AssetResponse.model_validate(a).model_dump(by_alias=True) for a in result["items"]]
    return ok(data=result)


@router.post("", status_code=201)
async def create_asset(
    body: AssetCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    asset = await asset_service.create_asset(
        db,
        name=body.name,
        category_id=body.category_id,
        serial_number=body.serial_number,
        department_id=body.department_id,
        condition=body.condition,
        purchase_date=body.purchase_date,
        purchase_cost=body.purchase_cost,
        warranty_expiry=body.warranty_expiry,
        location=body.location,
        notes=body.notes,
        custom_field_values=body.custom_field_values,
    )
    return ok(data=AssetResponse.model_validate(asset).model_dump(by_alias=True), message="Asset created")


@router.get("/{asset_id}")
async def get_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    asset, holder = await asset_service.get_asset(db, asset_id)
    data = AssetResponse.model_validate(asset).model_dump(by_alias=True)
    data["currentHolder"] = holder
    return ok(data=data)


@router.patch("/{asset_id}")
async def update_asset(
    asset_id: str,
    body: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    updates = body.model_dump(exclude_none=True)
    asset = await asset_service.update_asset(db, asset_id, **updates)
    return ok(data=AssetResponse.model_validate(asset).model_dump(by_alias=True), message="Asset updated")


@router.patch("/{asset_id}/status")
async def update_asset_status(
    asset_id: str,
    body: AssetStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    asset = await asset_service.update_asset_status(db, asset_id, new_status=body.status)
    return ok(data=AssetResponse.model_validate(asset).model_dump(by_alias=True), message="Asset status updated")


@router.delete("/{asset_id}", status_code=204)
async def delete_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    await asset_service.delete_asset(db, asset_id)
