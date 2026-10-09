from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    title: str
    description: str
    issue_type: str
    severity: Optional[str] = "medium"
    latitude: float
    longitude: float
    address: Optional[str] = None
    image_url: Optional[str] = None


class ComplaintFeedbackCreate(BaseModel):
    rating: int
    feedback: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    title: str
    description: str
    issue_type: str
    severity: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: str
    image_url: Optional[str] = None
    ai_urgency_score: Optional[int] = 50
    ai_department: Optional[str] = None
    resolution_notes: Optional[str] = None
    citizen_rating: Optional[int] = None
    citizen_feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True