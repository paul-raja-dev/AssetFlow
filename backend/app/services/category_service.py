import uuid

from sqlalchemy.ext.asyncio import AsyncSession

import app.crud.asset_categories as cat_crud
from app.exceptions import AppError
from app.models.asset_category import AssetCategory


def _check_unique_field_names(custom_fields: list[dict]) -> None:
    names = [f["name"].lower() for f in custom_fields]
    if len(names) != len(set(names)):
        raise AppError(400, "DUPLICATE_FIELD_NAMES", "Custom field names must be unique within a category")


async def list_categories(db: AsyncSession) -> list[AssetCategory]:
    return await cat_crud.list_all(db)


async def create_category(
    db: AsyncSession,
    name: str,
    description: str | None = None,
    custom_fields: list[dict] | None = None,
) -> AssetCategory:
    if await cat_crud.get_by_name(db, name):
        raise AppError(409, "CATEGORY_NAME_EXISTS", f"A category named '{name}' already exists")

    fields = custom_fields or []
    _check_unique_field_names(fields)

    return await cat_crud.create(
        db,
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        custom_fields=fields,
    )


async def update_category(db: AsyncSession, cat_id: str, **updates) -> AssetCategory:
    cat = await cat_crud.get_by_id(db, cat_id)
    if not cat:
        raise AppError(404, "CATEGORY_NOT_FOUND", "Asset category not found")

    # Name uniqueness (only if changing)
    if "name" in updates and updates["name"].lower() != cat.name.lower():
        if await cat_crud.get_by_name(db, updates["name"]):
            raise AppError(409, "CATEGORY_NAME_EXISTS", f"A category named '{updates['name']}' already exists")

    # Dedup custom field names
    if "custom_fields" in updates:
        _check_unique_field_names(updates["custom_fields"])

    return await cat_crud.update(db, cat, **updates)
