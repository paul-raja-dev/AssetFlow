"""Dashboard router — PS Screen 2: KPI cards + overdue/upcoming returns."""
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user
from app.models.allocation import Allocation
from app.models.asset import Asset
from app.models.booking import Booking
from app.models.maintenance_request import MaintenanceRequest
from app.models.transfer_request import TransferRequest

router = APIRouter()


async def _count(db: AsyncSession, query) -> int:
    return (await db.scalar(select(func.count()).select_from(query.subquery()))) or 0


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    today = date.today()
    now = datetime.now(timezone.utc)
    soon = today + timedelta(days=7)

    assets_available = await _count(db, select(Asset).where(Asset.status == "AVAILABLE"))
    assets_allocated = await _count(db, select(Asset).where(Asset.status == "ALLOCATED"))
    under_maintenance = await _count(db, select(Asset).where(Asset.status == "UNDER_MAINTENANCE"))
    total_assets = await _count(db, select(Asset).where(Asset.status != "DISPOSED"))

    open_maintenance = await _count(
        db, select(MaintenanceRequest).where(
            MaintenanceRequest.status.in_(("PENDING", "APPROVED", "IN_PROGRESS")))
    )
    pending_transfers = await _count(
        db, select(TransferRequest).where(TransferRequest.status == "PENDING")
    )
    active_bookings = await _count(
        db, select(Booking).where(
            Booking.cancelled_at.is_(None), Booking.end_time >= now)
    )
    overdue_returns = await _count(
        db, select(Allocation).where(
            Allocation.status == "ACTIVE",
            Allocation.expected_return_date.is_not(None),
            Allocation.expected_return_date < today)
    )
    upcoming_returns = await _count(
        db, select(Allocation).where(
            Allocation.status == "ACTIVE",
            Allocation.expected_return_date.is_not(None),
            Allocation.expected_return_date >= today,
            Allocation.expected_return_date <= soon)
    )

    # Assets by status breakdown (for the chart)
    rows = (await db.execute(
        select(Asset.status, func.count()).group_by(Asset.status)
    )).all()
    by_status = {status: count for status, count in rows}

    return ok(data={
        "assetsAvailable": assets_available,
        "assetsAllocated": assets_allocated,
        "underMaintenance": under_maintenance,
        "totalAssets": total_assets,
        "openMaintenance": open_maintenance,
        "pendingTransfers": pending_transfers,
        "activeBookings": active_bookings,
        "overdueReturns": overdue_returns,
        "upcomingReturns": upcoming_returns,
        "assetsByStatus": by_status,
    })
