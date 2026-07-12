from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.dependencies.pagination import Pagination, paginate
from app.schemas.transfer_request import (
    TransferRequestCreate,
    TransferRequestResponse,
    TransferRequestUpdate,
)
from app.services import transfer_service

router = APIRouter()


@router.get("")
async def list_transfer_requests(
    asset_id: str | None = Query(None, alias="assetId"),
    requested_by_id: str | None = Query(None, alias="requestedById"),
    status: str | None = Query(None),
    type_: str | None = Query(None, alias="type"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = await transfer_service.list_transfer_requests(
        db, asset_id=asset_id, requested_by_id=requested_by_id, status=status, type_=type_
    )
    result = await paginate(query, db, pagination)
    result["items"] = [TransferRequestResponse.model_validate(t).model_dump(by_alias=True) for t in result["items"]]
    return ok(data=result)


@router.post("", status_code=201)
async def create_transfer_request(
    body: TransferRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    tr = await transfer_service.create_transfer_request(
        db,
        asset_id=body.asset_id,
        requested_by_id=current_user.id,
        type_=body.type,
        to_user_id=body.to_user_id,
        to_department_id=body.to_department_id,
        notes=body.notes,
    )
    return ok(data=TransferRequestResponse.model_validate(tr).model_dump(by_alias=True), message="Transfer request created")


@router.get("/{tr_id}")
async def get_transfer_request(
    tr_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    tr = await transfer_service.get_transfer_request(db, tr_id)
    return ok(data=TransferRequestResponse.model_validate(tr).model_dump(by_alias=True))


@router.patch("/{tr_id}/approve")
async def approve(
    tr_id: str,
    body: TransferRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD")),
):
    tr = await transfer_service.approve_transfer_request(db, tr_id, current_user.id, body.notes)
    return ok(data=TransferRequestResponse.model_validate(tr).model_dump(by_alias=True), message="Transfer request approved")


@router.patch("/{tr_id}/reject")
async def reject(
    tr_id: str,
    body: TransferRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD")),
):
    tr = await transfer_service.reject_transfer_request(db, tr_id, current_user.id, body.notes)
    return ok(data=TransferRequestResponse.model_validate(tr).model_dump(by_alias=True), message="Transfer request rejected")
