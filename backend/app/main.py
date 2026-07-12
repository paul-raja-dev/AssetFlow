import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.exceptions import AppError, app_error_handler, validation_error_handler

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


# ── Routers (uncomment as each phase is built) ────────────────────────────────
# from app.routers import auth, users, departments, asset_categories
# from app.routers import assets, allocations, transfer_requests, bookings
# from app.routers import maintenance_requests, audit_cycles, audit_items
# from app.routers import notifications, activity_logs, dashboard, reports, files

# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
# app.include_router(asset_categories.router, prefix="/api/asset-categories", tags=["Asset Categories"])
# app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
# app.include_router(allocations.router, prefix="/api/allocations", tags=["Allocations"])
# app.include_router(transfer_requests.router, prefix="/api/transfer-requests", tags=["Transfer Requests"])
# app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
# app.include_router(maintenance_requests.router, prefix="/api/maintenance-requests", tags=["Maintenance"])
# app.include_router(audit_cycles.router, prefix="/api/audit-cycles", tags=["Audit Cycles"])
# app.include_router(audit_items.router, prefix="/api/audit-items", tags=["Audit Items"])
# app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
# app.include_router(activity_logs.router, prefix="/api/activity-logs", tags=["Activity Logs"])
# app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
# app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
# app.include_router(files.router, prefix="/api/files", tags=["Files"])
