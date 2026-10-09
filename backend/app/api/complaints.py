from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintFeedbackCreate
from backend.app.schemas.complaint_status import ComplaintStatusUpdate
from backend.app.services.roles import require_roles
from backend.app.services.auth import get_current_user
from backend.app.ai.analyzer import analyze_civic_text

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)


@router.get("/", response_model=list[ComplaintResponse])
def get_complaints(
    status: Optional[str] = Query(None, description="Filter by status"),
    issue_type: Optional[str] = Query(None, description="Filter by issue type"),
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    if current_user["role"] == "citizen":
        query = query.filter(Complaint.user_id == current_user["user_id"])

    if status and status != "all":
        query = query.filter(Complaint.status == status)

    if issue_type and issue_type != "all":
        query = query.filter(Complaint.issue_type == issue_type)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Complaint.title.ilike(search_fmt)) |
            (Complaint.description.ilike(search_fmt)) |
            (Complaint.address.ilike(search_fmt))
        )

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    return complaint


@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Run AI analysis to enrich complaint with urgency score and department
    ai_result = analyze_civic_text(
        complaint_data.title,
        complaint_data.description,
        complaint_data.issue_type
    )

    complaint = Complaint(
        user_id=current_user["user_id"],
        title=complaint_data.title,
        description=complaint_data.description,
        issue_type=complaint_data.issue_type or ai_result["category"],
        severity=complaint_data.severity or ai_result["severity"],
        latitude=complaint_data.latitude,
        longitude=complaint_data.longitude,
        address=complaint_data.address,
        image_url=complaint_data.image_url,
        ai_urgency_score=ai_result["urgency_score"],
        ai_department=ai_result["department"],
        status="pending"
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Record initial history
    history = ComplaintHistory(
        complaint_id=complaint.id,
        changed_by_user_id=current_user["user_id"],
        old_status=None,
        new_status="pending",
        notes="Complaint submitted by citizen and queued for municipal triage."
    )
    db.add(history)
    db.commit()

    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_data: ComplaintStatusUpdate,
    current_user: dict = Depends(require_roles("officer", "admin")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    old_status = complaint.status
    complaint.status = status_data.status.value

    if status_data.notes:
        complaint.resolution_notes = status_data.notes

    # Add audit log
    history = ComplaintHistory(
        complaint_id=complaint.id,
        changed_by_user_id=current_user["user_id"],
        old_status=old_status,
        new_status=status_data.status.value,
        notes=status_data.notes or f"Status changed from {old_status} to {status_data.status.value}."
    )
    db.add(history)

    db.commit()
    db.refresh(complaint)

    return complaint


@router.post("/{complaint_id}/feedback")
def submit_complaint_feedback(
    complaint_id: int,
    feedback_data: ComplaintFeedbackCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.user_id != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You can only submit feedback for your own complaints")

    complaint.citizen_rating = feedback_data.rating
    complaint.citizen_feedback = feedback_data.feedback
    db.commit()
    db.refresh(complaint)

    return {
        "message": "Citizen feedback saved successfully",
        "rating": complaint.citizen_rating,
        "feedback": complaint.citizen_feedback
    }


@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    current_user: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # Delete history entries first
    db.query(ComplaintHistory).filter(ComplaintHistory.complaint_id == complaint_id).delete()
    db.delete(complaint)
    db.commit()

    return {
        "message": "Complaint deleted successfully",
        "complaint_id": complaint_id
    }


@router.get("/{complaint_id}/history")
def get_complaint_history(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    history = (
        db.query(ComplaintHistory)
        .filter(ComplaintHistory.complaint_id == complaint_id)
        .order_by(ComplaintHistory.changed_at.asc())
        .all()
    )

    return {
        "complaint_id": complaint_id,
        "total_history": len(history),
        "history": [
            {
                "id": item.id,
                "changed_by_user_id": item.changed_by_user_id,
                "old_status": item.old_status,
                "new_status": item.new_status,
                "notes": item.notes,
                "changed_at": item.changed_at
            }
            for item in history
        ]
    }