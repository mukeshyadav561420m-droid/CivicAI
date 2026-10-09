from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.complaint import Complaint
from backend.app.ai.analyzer import analyze_civic_text
from backend.app.ai.duplicate_detector import find_potential_duplicates

router = APIRouter(
    prefix="/ai",
    tags=["AI Engine"]
)


class AIAnalysisRequest(BaseModel):
    title: str
    description: str
    issue_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.post("/analyze")
def analyze_complaint(
    payload: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Performs real-time AI NLP classification, urgency scoring,
    department routing, and spatial duplicate detection.
    """
    analysis = analyze_civic_text(
        payload.title,
        payload.description,
        payload.issue_type
    )

    duplicates = []
    if payload.latitude is not None and payload.longitude is not None:
        recent_complaints = db.query(Complaint).limit(100).all()
        duplicates = find_potential_duplicates(
            payload.title,
            payload.description,
            payload.latitude,
            payload.longitude,
            analysis["category"],
            recent_complaints
        )

    return {
        "analysis": analysis,
        "duplicate_warning": len(duplicates) > 0,
        "potential_duplicates": duplicates
    }


@router.get("/status")
def ai_status():
    return {
        "status": "online",
        "engine": "CivicAI NLP & Spatial Intelligence v2.4",
        "capabilities": [
            "Automatic Civic Category Classification",
            "Urgency & Hazard Scoring (0-100)",
            "Automated Municipal Department Routing",
            "SLA Estimation",
            "Haversine Geolocation Duplicate Filtering"
        ]
    }
