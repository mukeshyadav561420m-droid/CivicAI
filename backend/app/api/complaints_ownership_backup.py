from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.complaint import Complaint
from backend.app.schemas.complaint import ComplaintCreate, ComplaintResponse
from backend.app.schemas.complaint_status import ComplaintStatusUpdate
from backend.app.services.roles import require_roles

from backend.app.services.auth import get_current_user

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)


@router.get("/", response_model=list[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).all()
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
    complaint = Complaint(
        user_id=current_user["user_id"],
        title=complaint_data.title,
        description=complaint_data.description,
        issue_type=complaint_data.issue_type,
        severity=complaint_data.severity,
        latitude=complaint_data.latitude,
        longitude=complaint_data.longitude
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

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

    complaint.status = status_data.status

    db.commit()
    db.refresh(complaint)

    return complaint


@router.delete("/{complaint_id}")
def delete_complaint(
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

    db.delete(complaint)
    db.commit()

    return {
        "message": "Complaint deleted successfully",
        "complaint_id": complaint_id
    }