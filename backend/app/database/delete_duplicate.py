from backend.app.database.connection import SessionLocal
from backend.app.models.complaint_history import ComplaintHistory

db = SessionLocal()

try:
    record = db.query(ComplaintHistory).filter(
        ComplaintHistory.id == 9,
        ComplaintHistory.complaint_id == 9
    ).first()

    if record:
        db.delete(record)
        db.commit()
        print("Duplicate history ID 9 deleted successfully.")
    else:
        print("History ID 9 not found.")

finally:
    db.close()