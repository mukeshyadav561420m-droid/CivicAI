from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from backend.app.database.connection import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_officer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    issue_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)

    status = Column(
        String(50),
        default="pending",
        nullable=False
    )

    image_url = Column(Text, nullable=True)
    ai_urgency_score = Column(Integer, default=50, nullable=True)
    ai_department = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    citizen_rating = Column(Integer, nullable=True)
    citizen_feedback = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )