from math import ceil

from fastapi import Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size


async def paginate(query, session: AsyncSession, pagination: Pagination) -> dict:
    """Run a count + slice query and return the pagination envelope."""
    total = await session.scalar(
        select(func.count()).select_from(query.subquery())
    )
    items = (
        await session.execute(
            query.offset((pagination.page - 1) * pagination.page_size)
                 .limit(pagination.page_size)
        )
    ).scalars().all()

    return {
        "items": items,
        "page": pagination.page,
        "pageSize": pagination.page_size,
        "totalItems": total,
        "totalPages": ceil(total / pagination.page_size) if total else 1,
    }
