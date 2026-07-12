from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer_request import TransferRequest


async def get_by_id(db: AsyncSession, tr_id: str) -> TransferRequest | None:
    result = await db.execute(select(TransferRequest).where(TransferRequest.id == tr_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> TransferRequest:
    tr = TransferRequest(**kwargs)
    db.add(tr)
    await db.commit()
    await db.refresh(tr)
    return tr


async def update(db: AsyncSession, tr: TransferRequest, **kwargs) -> TransferRequest:
    for key, value in kwargs.items():
        setattr(tr, key, value)
    await db.commit()
    await db.refresh(tr)
    return tr


def build_list_query(
    asset_id: str | None = None,
    requested_by_id: str | None = None,
    status: str | None = None,
    type_: str | None = None,
):
    query = select(TransferRequest)
    if asset_id:
        query = query.where(TransferRequest.asset_id == asset_id)
    if requested_by_id:
        query = query.where(TransferRequest.requested_by_id == requested_by_id)
    if status:
        query = query.where(TransferRequest.status == status)
    if type_:
        query = query.where(TransferRequest.type == type_)
    return query.order_by(TransferRequest.created_at.desc())
