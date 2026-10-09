from sqlalchemy.orm import Session
from backend.app.database.connection import SessionLocal
from backend.app.models.user import User
from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.services.security import hash_password


def seed_database_if_empty():
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        existing_users_count = db.query(User).count()
        if existing_users_count > 0:
            return

        print("--> Seeding CivicAI database with demo users and realistic civic data...")

        # Create Demo Users
        admin_user = User(
            name="Municipal Commissioner",
            email="admin@civicai.org",
            password_hash=hash_password("admin123"),
            role="admin",
            department="City Administration HQ",
            phone="+91 98765 43210"
        )

        officer_water = User(
            name="Er. Alok Sharma",
            email="officer.sharma@civicai.org",
            password_hash=hash_password("officer123"),
            role="officer",
            department="Municipal Water & Sewerage Board",
            phone="+91 98765 11111"
        )

        officer_pwd = User(
            name="Insp. Rajesh Patel",
            email="officer.patel@civicai.org",
            password_hash=hash_password("officer123"),
            role="officer",
            department="Public Works & Road Maintenance (PWD)",
            phone="+91 98765 22222"
        )

        officer_waste = User(
            name="Officer Sunita Singh",
            email="officer.singh@civicai.org",
            password_hash=hash_password("officer123"),
            role="officer",
            department="Solid Waste Management Division",
            phone="+91 98765 33333"
        )

        citizen_user = User(
            name="Priya Verma",
            email="citizen@civicai.org",
            password_hash=hash_password("citizen123"),
            role="citizen",
            department="Citizen",
            phone="+91 98765 44444"
        )

        db.add_all([admin_user, officer_water, officer_pwd, officer_waste, citizen_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(officer_water)
        db.refresh(officer_pwd)
        db.refresh(officer_waste)
        db.refresh(citizen_user)

        # Seed sample complaints
        sample_complaints = [
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=officer_water.id,
                title="Severe Main Pipeline Burst & Drinking Water Contamination",
                description="The primary water pipeline on 4th Cross Road cracked open this morning. Muddy water is entering residential lines, causing extreme pressure drop and hygiene risk for over 80 households.",
                issue_type="water",
                severity="high",
                latitude=26.8524,
                longitude=80.9412,
                address="4th Cross Road, Sector 5, Civic Colony",
                status="in_progress",
                ai_urgency_score=88,
                ai_department="Municipal Water & Sewerage Board",
                resolution_notes="Maintenance team dispatched with hydraulic pipe clamps. Excavation in progress."
            ),
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=officer_pwd.id,
                title="Hazardous Deep Pothole Near St. Mary Public School",
                description="Massive crater-sized pothole right outside school main gate. Two two-wheelers skidded yesterday during rain. Urgent asphalt leveling needed before school opening on Monday.",
                issue_type="road",
                severity="high",
                latitude=26.8489,
                longitude=80.9531,
                address="Outside Gate 2, St. Mary School, Ring Road",
                status="assigned",
                ai_urgency_score=84,
                ai_department="Public Works & Road Maintenance (PWD)"
            ),
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=officer_waste.id,
                title="Overflowing Garbage Dumpster and Stray Animal Hazard",
                description="Community trash bins have not been cleared for past 4 days. Waste is spilling over pedestrian walkway emitting foul stench and attracting stray cattle.",
                issue_type="garbage",
                severity="medium",
                latitude=26.8398,
                longitude=80.9324,
                address="Near Block C Market Square, Green Park",
                status="in_progress",
                ai_urgency_score=62,
                ai_department="Solid Waste Management Division",
                resolution_notes="Garbage compactors en route for complete clearance and disinfectant spraying."
            ),
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=None,
                title="Open Manhole Cover on Pedestrian Footpath",
                description="Heavy iron drainage lid is missing at the corner of 12th Avenue. Pedestrians and elderly walking in the dark can suffer fatal falls.",
                issue_type="drainage",
                severity="high",
                latitude=26.8612,
                longitude=80.9255,
                address="12th Avenue, Corner of Metro Pillar 42",
                status="pending",
                ai_urgency_score=94,
                ai_department="Stormwater Drainage & Sanitation Dept"
            ),
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=officer_pwd.id,
                title="Faulty LED Streetlights Causing Dark Corridor on Highway Link",
                description="6 consecutive street lights are completely unlit from junction to bridge. Causes dangerous blind spots for vehicles at night.",
                issue_type="street_light",
                severity="medium",
                latitude=26.8341,
                longitude=80.9622,
                address="NH-24 Bypass Flyover Service Road",
                status="resolved",
                ai_urgency_score=55,
                ai_department="Urban Electrical & Lighting Authority",
                resolution_notes="Replaced blown capacitor fuses and installed high-efficiency 90W LED fixtures.",
                citizen_rating=5,
                citizen_feedback="Fixed within 24 hours! Street is bright and safe now. Great response from CivicAI!"
            ),
            Complaint(
                user_id=citizen_user.id,
                assigned_officer_id=None,
                title="Low Voltage Fluctuations Damaging Household Appliances",
                description="Substation feeder 3 experiencing frequent spikes and drops between 140V and 280V. Risk of appliance burnout.",
                issue_type="electricity",
                severity="medium",
                latitude=26.8588,
                longitude=80.9488,
                address="Model Town, Phase 2, Grid Substation 3",
                status="pending",
                ai_urgency_score=58,
                ai_department="City Power Distribution Corp"
            )
        ]

        db.add_all(sample_complaints)
        db.commit()

        # Seed initial history logs
        for comp in sample_complaints:
            db.refresh(comp)
            h1 = ComplaintHistory(
                complaint_id=comp.id,
                changed_by_user_id=citizen_user.id,
                old_status=None,
                new_status="pending",
                notes="Complaint logged via CivicAI Citizen Portal.",
                changed_at=comp.created_at
            )
            db.add(h1)

            if comp.status in ("assigned", "in_progress", "resolved"):
                h2 = ComplaintHistory(
                    complaint_id=comp.id,
                    changed_by_user_id=admin_user.id,
                    old_status="pending",
                    new_status="assigned",
                    notes=f"Auto-routed and assigned to department officer by municipal admin."
                )
                db.add(h2)

            if comp.status in ("in_progress", "resolved"):
                h3 = ComplaintHistory(
                    complaint_id=comp.id,
                    changed_by_user_id=comp.assigned_officer_id or officer_water.id,
                    old_status="assigned",
                    new_status="in_progress",
                    notes="Field inspection team initiated ground operations."
                )
                db.add(h3)

            if comp.status == "resolved":
                h4 = ComplaintHistory(
                    complaint_id=comp.id,
                    changed_by_user_id=comp.assigned_officer_id or officer_pwd.id,
                    old_status="in_progress",
                    new_status="resolved",
                    notes="Issue resolved and verified on-site. Proof updated."
                )
                db.add(h4)

        db.commit()
        print("--> Seeded successfully!")
    except Exception as e:
        print("Error during database seed:", e)
        db.rollback()
    finally:
        db.close()
