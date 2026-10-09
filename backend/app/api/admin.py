from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.services.roles import require_roles

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(
    current_user: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_citizens = db.query(User).filter(User.role == "citizen").count()
    total_officers = db.query(User).filter(User.role == "officer").count()
    total_complaints = db.query(Complaint).count()

    pending = db.query(Complaint).filter(Complaint.status == "pending").count()
    assigned = db.query(Complaint).filter(Complaint.status == "assigned").count()
    in_progress = db.query(Complaint).filter(Complaint.status == "in_progress").count()
    resolved = db.query(Complaint).filter(Complaint.status == "resolved").count()
    rejected = db.query(Complaint).filter(Complaint.status == "rejected").count()

    resolution_rate = round((resolved / total_complaints * 100) if total_complaints > 0 else 0, 1)

    # Categories breakdown
    categories = ["water", "drainage", "road", "electricity", "street_light", "garbage", "public_safety", "other"]
    category_counts = {}
    for cat in categories:
        category_counts[cat] = db.query(Complaint).filter(Complaint.issue_type == cat).count()

    # Severity breakdown
    severities = {
        "critical": db.query(Complaint).filter(Complaint.ai_urgency_score >= 80).count(),
        "high": db.query(Complaint).filter(Complaint.severity == "high").count(),
        "medium": db.query(Complaint).filter(Complaint.severity == "medium").count(),
        "low": db.query(Complaint).filter(Complaint.severity == "low").count()
    }

    # Officers leaderboard
    officers = db.query(User).filter(User.role == "officer").all()
    officer_stats = []
    for off in officers:
        assigned_c = db.query(Complaint).filter(Complaint.assigned_officer_id == off.id).count()
        resolved_c = db.query(Complaint).filter(
            Complaint.assigned_officer_id == off.id,
            Complaint.status == "resolved"
        ).count()
        rate = round((resolved_c / assigned_c * 100) if assigned_c > 0 else 0, 1)
        officer_stats.append({
            "id": off.id,
            "name": off.name,
            "email": off.email,
            "department": off.department or "Municipal Operations",
            "assigned_count": assigned_c,
            "resolved_count": resolved_c,
            "resolution_rate": rate
        })

    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    complaint_list = []

    for complaint in complaints:
        officer = None
        if complaint.assigned_officer_id:
            officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()

        complaint_list.append({
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
            "assigned_officer": (
                {
                    "id": officer.id,
                    "name": officer.name,
                    "email": officer.email,
                    "department": officer.department
                }
                if officer else None
            ),
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "created_at": complaint.created_at
        })

    return {
        "message": "Admin dashboard data",
        "admin": current_user,
        "statistics": {
            "total_users": total_users,
            "total_citizens": total_citizens,
            "total_officers": total_officers,
            "total_complaints": total_complaints,
            "pending": pending,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "rejected": rejected,
            "resolution_rate": resolution_rate,
            "category_counts": category_counts,
            "severities": severities
        },
        "officers": officer_stats,
        "complaints": complaint_list
    }


@router.get("/officers")
def get_all_officers(
    current_user: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    officers = db.query(User).filter(User.role == "officer").order_by(User.name).all()

    return {
        "message": "Officers list",
        "total_officers": len(officers),
        "officers": [
            {
                "id": officer.id,
                "name": officer.name,
                "email": officer.email,
                "department": officer.department or "Municipal Operations",
                "phone": officer.phone,
                "assigned_count": db.query(Complaint).filter(Complaint.assigned_officer_id == officer.id).count()
            }
            for officer in officers
        ]
    }


@router.patch("/complaints/{complaint_id}/assign")
def admin_assign_complaint(
    complaint_id: int,
    officer_id: int,
    current_user: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer = db.query(User).filter(User.id == officer_id, User.role == "officer").first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    old_status = complaint.status
    complaint.assigned_officer_id = officer.id

    if complaint.status == "pending":
        complaint.status = "assigned"

    # Add audit log
    history = ComplaintHistory(
        complaint_id=complaint.id,
        changed_by_user_id=current_user["user_id"],
        old_status=old_status,
        new_status=complaint.status,
        notes=f"Admin assigned case to {officer.name} ({officer.department or 'Operations'})."
    )
    db.add(history)

    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint assigned successfully by admin",
        "complaint_id": complaint.id,
        "assigned_officer": {
            "id": officer.id,
            "name": officer.name,
            "email": officer.email,
            "department": officer.department
        },
        "status": complaint.status
    }