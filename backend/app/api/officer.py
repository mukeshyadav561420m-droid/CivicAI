from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.user import User
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.services.roles import require_roles

router = APIRouter(
    prefix="/officer",
    tags=["Officer"]
)


@router.get("/dashboard")
def officer_dashboard(
    current_user: dict = Depends(require_roles("officer")),
    db: Session = Depends(get_db)
):
    officer_id = current_user["user_id"]
    officer_record = db.query(User).filter(User.id == officer_id).first()

    complaints = (
        db.query(Complaint)
        .filter(Complaint.assigned_officer_id == officer_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    assigned_count = sum(1 for c in complaints if c.status == "assigned")
    in_progress_count = sum(1 for c in complaints if c.status == "in_progress")
    resolved_count = sum(1 for c in complaints if c.status == "resolved")

    return {
        "message": "Officer access granted",
        "officer": {
            "id": officer_id,
            "name": officer_record.name if officer_record else current_user["email"],
            "email": current_user["email"],
            "role": current_user["role"],
            "department": officer_record.department if officer_record else "Municipal Field Operations"
        },
        "stats": {
            "total_assigned": len(complaints),
            "assigned": assigned_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count
        },
        "complaints": [
            {
                "id": complaint.id,
                "title": complaint.title,
                "description": complaint.description,
                "issue_type": complaint.issue_type,
                "severity": complaint.severity,
                "status": complaint.status,
                "address": complaint.address,
                "image_url": complaint.image_url,
                "ai_urgency_score": complaint.ai_urgency_score or 50,
                "ai_department": complaint.ai_department,
                "resolution_notes": complaint.resolution_notes,
                "citizen_rating": complaint.citizen_rating,
                "citizen_feedback": complaint.citizen_feedback,
                "latitude": complaint.latitude,
                "longitude": complaint.longitude,
                "created_at": complaint.created_at,
                "updated_at": complaint.updated_at
            }
            for complaint in complaints
        ]
    }


@router.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    new_status: str = Query(..., description="Target status"),
    notes: Optional[str] = Query(None, description="Resolution or operational notes"),
    current_user: dict = Depends(require_roles("officer")),
    db: Session = Depends(get_db)
):
    officer_id = current_user["user_id"]

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    if complaint.assigned_officer_id != officer_id:
        raise HTTPException(
            status_code=403,
            detail="This complaint is not assigned to you"
        )

    allowed_statuses = ["assigned", "in_progress", "resolved"]
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {allowed_statuses}"
        )

    old_status = complaint.status
    complaint.status = new_status
    if notes:
        complaint.resolution_notes = notes

    history = ComplaintHistory(
        complaint_id=complaint.id,
        changed_by_user_id=officer_id,
        old_status=old_status,
        new_status=new_status,
        notes=notes or f"Officer updated status from {old_status} to {new_status}."
    )

    db.add(history)
    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint status updated successfully",
        "complaint_id": complaint.id,
        "assigned_officer_id": complaint.assigned_officer_id,
        "status": complaint.status,
        "resolution_notes": complaint.resolution_notes
    }