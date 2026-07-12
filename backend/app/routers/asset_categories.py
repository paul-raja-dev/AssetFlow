"""Asset Categories router — E13-E15: list, create, update."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user, require_roles
from app.schemas.asset_category import (
    AssetCategoryCreate,
    AssetCategoryResponse,
    AssetCategoryUpdate,
)
from app.services import category_service

router = APIRouter()


@router.get("")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List all asset categories — any authenticated user."""
    cats = await category_service.list_categories(db)
    return ok(
        data=[
            AssetCategoryResponse.model_validate(c).model_dump(by_alias=True)
            for c in cats
        ],
    )


@router.post("", status_code=201)
async def create_category(
    body: AssetCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Create an asset category — ADMIN / ASSET_MANAGER only."""
    # Convert Pydantic CustomFieldDef objects to dicts for JSON storage
    custom_fields = [f.model_dump() for f in body.custom_fields]
    cat = await category_service.create_category(
        db,
        name=body.name,
        description=body.description,
        custom_fields=custom_fields,
    )
    return ok(
        data=AssetCategoryResponse.model_validate(cat).model_dump(by_alias=True),
        message="Category created",
    )


@router.patch("/{cat_id}")
async def update_category(
    cat_id: str,
    body: AssetCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
):
    """Update an asset category — ADMIN / ASSET_MANAGER only."""
    updates = body.model_dump(exclude_none=True)
    # Convert Pydantic CustomFieldDef objects to dicts for JSON storage
    if "custom_fields" in updates:
        updates["custom_fields"] = [
            f.model_dump() if hasattr(f, "model_dump") else f
            for f in updates["custom_fields"]
        ]
    cat = await category_service.update_category(db, cat_id, **updates)
    return ok(
        data=AssetCategoryResponse.model_validate(cat).model_dump(by_alias=True),
        message="Category updated",
    )
