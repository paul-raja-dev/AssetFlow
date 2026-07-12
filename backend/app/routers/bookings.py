from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user
from app.dependencies.pagination import Pagination, paginate
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.services import booking_service

router = APIRouter()


@router.get("")
async def list_bookings(
    asset_id: str | None = Query(None, alias="assetId"),
    booked_by_id: str | None = Query(None, alias="bookedById"),
    pagination: Pagination = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = await booking_service.list_bookings(db, asset_id=asset_id, booked_by_id=booked_by_id)
    result = await paginate(query, db, pagination)
    result["items"] = [BookingResponse.model_validate(b).model_dump(by_alias=True) for b in result["items"]]
    return ok(data=result)


@router.post("", status_code=201)
async def create_booking(
    body: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = await booking_service.create_booking(
        db,
        asset_id=body.asset_id,
        booked_by_id=current_user.id,
        start_time=body.start_time,
        end_time=body.end_time,
        purpose=body.purpose,
    )
    return ok(data=BookingResponse.model_validate(booking).model_dump(by_alias=True), message="Booking created")


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    booking = await booking_service.get_booking(db, booking_id)
    return ok(data=BookingResponse.model_validate(booking).model_dump(by_alias=True))


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: str,
    body: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)
    booking = await booking_service.update_booking(db, booking_id, actor_id=current_user.id, **updates)
    return ok(data=BookingResponse.model_validate(booking).model_dump(by_alias=True), message="Booking updated")


@router.delete("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = await booking_service.cancel_booking(db, booking_id, actor_id=current_user.id)
    return ok(data=BookingResponse.model_validate(booking).model_dump(by_alias=True), message="Booking cancelled")
