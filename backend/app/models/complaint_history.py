from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from backend.app.database.connection import Base


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(Integer, primary_key=True, index=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.id"),
        nullable=False
    )

    changed_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    old_status = Column(
        String(50),
        nullable=True
    )

    new_status = Column(
        String(50),
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )

    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )