import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.exceptions import AppError, app_error_handler, validation_error_handler
from app.routers import auth, users, departments, asset_categories, assets, allocations, transfer_requests, bookings, maintenance_requests

app = FastAPI(
    title="AssetFlow API",
    description="IT Asset Management System",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    os.makedirs(settings.upload_dir, exist_ok=True)


# ── Static file serving ───────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.upload_dir, check_dir=False), name="uploads")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health():
    return JSONResponse(content={"success": True, "message": "AssetFlow API is running"})


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(asset_categories.router, prefix="/api/asset-categories", tags=["Asset Categories"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(allocations.router, prefix="/api/allocations", tags=["Allocations"])
app.include_router(transfer_requests.router, prefix="/api/transfer-requests", tags=["Transfer Requests"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(maintenance_requests.router, prefix="/api/maintenance-requests", tags=["Maintenance"])
