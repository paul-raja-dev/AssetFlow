from datetime import datetime
from typing import Optional

from app.schemas.base import CamelModel


class ActivityLogResponse(CamelModel):
    id: str
    actor_id: str
    actor_name: Optional[str] = None   # resolved join
    action: str                        # e.g. "ASSET_CREATED", "ALLOCATION_RETURNED"
    entity_type: str                   # e.g. "ASSET", "ALLOCATION"
    entity_id: str
    description: str
    created_at: datetime
