from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ComplaintStatus(str, Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    notes: Optional[str] = None
