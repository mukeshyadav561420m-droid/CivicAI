# 🏛️ CivicAI - Real-Time AI Civic Issue Resolution & Smart Governance Platform

**CivicAI** is an AI-powered municipal issue resolution system designed to bridge the gap between citizens, field officers, and city administrators. It features real-time NLP classification, spatial duplicate filtering, interactive GIS OpenStreetMap integration, automated departmental dispatch, and lifecycle audit tracking.

---

## 🌟 Key Features

### 1. 🤖 CivicAI Intelligent Triage Engine
- **Automated NLP Classification**: Categorizes complaints into *Water Supply, Drainage & Sewage, Roads & Potholes, Electricity, Street Lighting, Solid Waste, or Public Safety*.
- **AI Urgency & Risk Scoring (0–100)**: Analyzes hazard indicators (e.g. sparking wires, school zones, hospital vicinity, contamination) to assign urgency scores and estimated resolution SLAs.
- **Automated Departmental Routing**: Maps issues directly to the responsible civic agency (PWD, Water Board, Electricity Board, Sanitation Cell).
- **Spatial Duplicate Detection**: Uses Haversine geographical proximity (within 250m) and text similarity to alert citizens if a nearby duplicate issue is already active, preventing duplicate municipal work.

### 2. 🗺️ Interactive GIS Heatmap & Pin Drop
- Real-time OpenStreetMap integration via Leaflet.
- Color-coded severity pins with clickable inspection modals.
- Interactive location picker with **"🎯 Locate Me"** GPS auto-detection.

### 3. 👥 Multi-Role Enterprise Workflows
- **Citizen Portal**: Report issues, track live status through a 4-stage lifecycle stepper, attach photos, and provide 1–5 star ratings upon resolution.
- **Field Officer Board**: Dedicated workspace for municipal inspectors to view assigned tasks, update progress to *In Progress* or *Resolved*, and submit operational proof notes.
- **City Administrator Command Center**: Municipal KPI dashboards, SLA performance, department breakdown charts, officer workload management, and CSV report export.

---

## ⚡ Quick Demo Accounts (One-Click Login Supported)

| Role | Email | Password | Name / Department |
| :--- | :--- | :--- | :--- |
| **👑 City Admin** | `admin@civicai.org` | `admin123` | Municipal Commissioner |
| **👮 Water Officer** | `officer.sharma@civicai.org` | `officer123` | Er. Alok Sharma (Water & Sewage) |
| **🚧 PWD Officer** | `officer.patel@civicai.org` | `officer123` | Insp. Rajesh Patel (Roads & PWD) |
| **👤 Citizen** | `citizen@civicai.org` | `citizen123` | Priya Verma |

*(The login screen also provides one-click quick demo buttons for immediate testing).*

---

## 🚀 Running the Project

### 1. Backend Server (FastAPI)
```powershell
# From project root:
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8001 --host 127.0.0.1
```
- **Live API**: http://127.0.0.1:8001/
- **Interactive Swagger Docs**: http://127.0.0.1:8001/docs
- **AI Status Endpoint**: http://127.0.0.1:8001/ai/status

### 2. Frontend Application (React + Vite)
```powershell
# In frontend directory:
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Web Interface**: http://127.0.0.1:5173/

---

## 🏗️ Architecture

```
CivicAI/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── analyzer.py            # NLP semantic classifier & urgency scorer
│   │   │   └── duplicate_detector.py  # Spatial Haversine duplicate filtering
│   │   ├── api/
│   │   │   ├── ai.py                  # Real-time AI triage endpoints
│   │   │   ├── admin.py               # Municipal KPIs & assignment APIs
│   │   │   ├── officer.py             # Field officer dashboard & status endpoints
│   │   │   ├── complaints.py          # Complaint CRUD, audit logs & feedback
│   │   │   ├── users.py               # Authentication & registration
│   │   │   └── auth.py                # Profile & JWT verification
│   │   ├── database/
│   │   │   ├── connection.py          # SQLite / PostgreSQL engine setup
│   │   │   └── seed.py                # Auto-seeder with realistic demo data
│   │   ├── models/                    # SQLAlchemy models (User, Complaint, ComplaintHistory)
│   │   ├── schemas/                   # Pydantic validation schemas
│   │   └── services/                  # Passwords, JWT, and RBAC
│   └── main.py                        # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CivicMap.jsx           # Interactive Leaflet GIS map & pin drop
│   │   │   ├── ComplaintDetailModal.jsx # Lifecycle stepper, audit timeline, rating
│   │   │   └── AdminAnalyticsView.jsx # SVG charts, leaderboard & CSV export
│   │   ├── api.js                     # Unified backend API service
│   │   ├── App.jsx                    # Primary multi-role dashboard application
│   │   └── App.css                    # Modern civic tech design system
│   └── package.json
└── README.md
```
