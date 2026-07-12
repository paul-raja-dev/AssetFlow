from app.schemas.base import CamelModel


class AssetsByStatus(CamelModel):
    available: int = 0
    allocated: int = 0
    under_maintenance: int = 0
    disposed: int = 0
    lost: int = 0


class AssetsByCategory(CamelModel):
    category_id: str
    category_name: str
    count: int


class DashboardResponse(CamelModel):
    total_assets: int
    total_users: int
    total_departments: int
    assets_by_status: AssetsByStatus
    assets_by_category: list[AssetsByCategory]
    overdue_allocations: int
    open_maintenance_requests: int
    active_bookings: int
