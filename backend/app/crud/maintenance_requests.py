from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance_request import MaintenanceRequest


async def get_by_id(db: AsyncSession, req_id: str) -> MaintenanceRequest | None:
    result = await db.execute(select(MaintenanceRequest).where(MaintenanceRequest.id == req_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> MaintenanceRequest:
    req = MaintenanceRequest(**kwargs)
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


async def update(db: AsyncSession, req: MaintenanceRequest, **kwargs) -> MaintenanceRequest:
    for key, value in kwargs.items():
        setattr(req, key, value)
    await db.commit()
    await db.refresh(req)
    return req


async def delete(db: AsyncSession, req: MaintenanceRequest) -> None:
    await db.delete(req)
    await db.commit()


def build_list_query(
    asset_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    requested_by_id: str | None = None,
):
    query = select(MaintenanceRequest)
    if asset_id:
        query = query.where(MaintenanceRequest.asset_id == asset_id)
    if status:
        query = query.where(MaintenanceRequest.status == status)
    if priority:
        query = query.where(MaintenanceRequest.priority == priority)
    if requested_by_id:
        query = query.where(MaintenanceRequest.requested_by_id == requested_by_id)
    return query.order_by(MaintenanceRequest.created_at.desc())
