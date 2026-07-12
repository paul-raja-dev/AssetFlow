from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.dependencies.pagination import Pagination, paginate
from app.schemas.maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestResponse,
    MaintenanceRequestUpdate,
)
from app.services import maintenance_service

router = APIRouter()


@router.get("")
async def list_maintenance_requests(
    asset_id: str | None = Query(None, alias="assetId"),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    requested_by_id: str | None = Query(None, alias="requestedById"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = await maintenance_service.list_maintenance_requests(
        db, asset_id=asset_id, status=status, priority=priority, requested_by_id=requested_by_id
    )
    result = await paginate(query, db, pagination)
    result["items"] = [MaintenanceRequestResponse.model_validate(r).model_dump(by_alias=True) for r in result["items"]]
    return ok(data=result)


@router.post("", status_code=201)
async def create_maintenance_request(
    body: MaintenanceRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    req = await maintenance_service.create_maintenance_request(
        db,
        asset_id=body.asset_id,
        requested_by_id=current_user.id,
        description=body.description,
        priority=body.priority,
    )
    return ok(data=MaintenanceRequestResponse.model_validate(req).model_dump(by_alias=True), message="Maintenance request created")


@router.get("/{req_id}")
async def get_maintenance_request(
    req_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    req = await maintenance_service.get_maintenance_request(db, req_id)
    return ok(data=MaintenanceRequestResponse.model_validate(req).model_dump(by_alias=True))


@router.patch("/{req_id}/status")
async def update_maintenance_status(
    req_id: str,
    body: MaintenanceRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    req = await maintenance_service.update_maintenance_status(
        db,
        req_id=req_id,
        new_status=body.status,
        technician_notes=body.technician_notes,
        resolution_date=body.resolution_date,
    )
    return ok(data=MaintenanceRequestResponse.model_validate(req).model_dump(by_alias=True), message="Status updated")


@router.delete("/{req_id}", status_code=204)
async def delete_maintenance_request(
    req_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    await maintenance_service.delete_maintenance_request(db, req_id)
