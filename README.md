# 🏛️ CivicAI - Real-Time AI Civic Issue Resolution & Smart Governance Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.141-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg?logo=react)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet_1.9-199900.svg?logo=leaflet)](https://leafletjs.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB.svg?logo=python)](https://python.org)
[![Author](https://img.shields.io/badge/Author-Mukesh_Yadav-blue.svg)](https://github.com/mukeshyadav561420m-droid)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CivicAI** is an enterprise-grade municipal governance and civic problem resolution platform designed to seamlessly connect **Citizens**, **Municipal Field Officers**, and **City Administrators**. Powered by natural language processing (NLP) and geospatial intelligence, CivicAI automates issue triage, flags municipal duplicates, dynamically scores emergency hazards, and dispatches field teams with end-to-end resolution tracking.

---

## 📌 Table of Contents
1. [Project Overview & Problem Statement](#-project-overview--problem-statement)
2. [Step-by-Step Architecture & How It Works](#-step-by-step-architecture--how-it-works)
3. [Technologies & Libraries Used (A to Z)](#-technologies--libraries-used-a-to-z)
4. [Core Modules & Innovative Features](#-core-modules--innovative-features)
5. [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
6. [Step-by-Step Setup & Installation Guide](#-step-by-step-setup--installation-guide)
7. [Role-by-Role Workflow Walkthrough](#-role-by-role-workflow-walkthrough)
8. [Complete REST API Reference](#-complete-rest-api-reference)
9. [Project Directory Structure](#-project-directory-structure)
10. [Author & Acknowledgments](#-author--acknowledgments)

---

## 🎯 Project Overview & Problem Statement

### The Problem
* **Manual Bottlenecks**: Citizens report complaints through antiquated forms or phone lines, causing administrative queues that take days or weeks to process.
* **Redundant Duplicate Tickets**: When a major issue occurs (e.g. water pipeline burst or traffic light blackout), dozens of residents submit the same ticket, overwhelming field teams.
* **Lack of Urgency Prioritization**: High-risk safety hazards (e.g. open manholes, live sparking electrical wires) sit in identical queues as routine cosmetic maintenance.
* **Zero Transparency**: Citizens have no visibility into who is working on their ticket or how long it will take.

### The CivicAI Solution
1. **Real-Time NLP AI Classifier**: Automatically interprets unstructured citizen text and categorizes it (*Water, Drainage, Road, Electricity, Street Light, Garbage, Public Safety*).
2. **Dynamic AI Urgency & Risk Scorer (0–100)**: Analyzes life-safety triggers (*"sparking"*, *"school zone"*, *"contamination"*, *"accident"*) to set dynamic SLAs (e.g. 6–12h emergency response vs 5–7 days routine).
3. **Haversine Geospatial Duplicate Detection**: Identifies whether another active incident has been reported within **250 meters**, alerting citizens in real-time.
4. **Interactive GIS Heatmap**: Pinned with color-coded severity markers on live OpenStreetMap tiles via Leaflet.
5. **Complete Audit Trail & Feedback Loop**: Every status transition is timestamped with officer proof notes, followed by citizen 1–5 star reviews.

---

## 🔄 Step-by-Step Architecture & How It Works

```
[ Citizen Portal ]
       │
       ▼ (Submits Title, Description, Photo & Coordinates)
[ Real-Time NLP & Spatial Engine ]
       │
       ├─► 1. Semantic Category Classifier (Water / Road / Power / Sanitation)
       ├─► 2. Hazard & Urgency Scorer (0 - 100 Risk Rating)
       ├─► 3. Haversine Spatial Duplicate Detector (250m Proximity Check)
       └─► 4. Department Router & Estimated SLA Calculation
       │
       ▼ (Stores enriched incident with audit log)
[ FastAPI Backend + SQLAlchemy ORM (SQLite / PostgreSQL) ]
       │
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ Citizen Portal ]            [ Field Officer Board ]         [ Admin Command Center ]
• Live 4-Step Stepper         • Kanban Operational Board      • Real-Time City KPIs
• Incident History Log        • "Start Work" Action           • Department Bar Charts
• 1-5 Star Review Rating      • "Mark Resolved" + Proof       • Officer Leaderboard & CSV
```

---

## 🛠️ Technologies & Libraries Used (A to Z)

### 1. Backend Stack
* **Python 3.13+**: Core programming language.
* **FastAPI (v0.141)**: Modern, high-performance asynchronous REST API web framework.
* **Uvicorn (v0.53)**: Lightning-fast ASGI web server implementation.
* **SQLAlchemy 2.0**: Enterprise ORM for database modeling and relationship mapping.
* **SQLite / PostgreSQL (psycopg3)**: Dual database compatibility with zero-lag SQLite fallback and production PostgreSQL ready.
* **Pydantic v2**: High-performance data validation and response schemas.
* **Python-Jose**: Cryptographic JWT (JSON Web Tokens) creation, encoding, and verification.
* **Passlib & Bcrypt**: Industry-standard password hashing using salted Blowfish cryptographic algorithms.
* **Python-Dotenv**: Secure environment variable loading from `.env`.

### 2. Frontend Stack
* **React 19**: Modern component architecture utilizing hooks (`useState`, `useEffect`, `useRef`).
* **Vite 8**: Next-generation frontend build tooling and development server.
* **Leaflet (v1.9)**: Interactive GIS mapping library rendering OpenStreetMap tiles.
* **Vanilla CSS3 Design System**: Custom enterprise UI featuring glassmorphism, responsive CSS grid, flexbox layouts, micro-animations, and dynamic status badges (zero heavy bloated UI dependencies).

### 3. AI & Spatial Algorithms
* **Lexical & Semantic NLP Scorer**: Multi-dictionary token matching with context-weighted trigger expansion.
* **Haversine Great-Circle Formula**: High-accuracy geographic distance calculation between coordinates in meters ($R = 6,371,000 \text{ m}$).
* **Jaccard Token-Overlap Text Metric**: Computes semantic text intersection over union for nearby duplicate verification.

---

## 🌟 Core Modules & Innovative Features

### 1. 🤖 Intelligent Incident Assistant
* As the citizen types their complaint, the assistant triggers a debounced live preview that predicts the category, severity level, responsible civic department, and resolution SLA.
* If another resident has already reported a similar issue within 250 meters, a **"Potential Duplicate Detected"** alert surfaces with the existing incident ID.

### 2. 🗺️ Interactive GIS Map & Pin-Drop
* OpenStreetMap integration featuring color-coded custom emoji pin markers:
  - 🔴 **Red**: High / Critical Urgency ($Score \ge 80$)
  - 🟡 **Amber**: Medium Priority ($Score \ge 40$)
  - 🟢 **Green**: Resolved Incidents
* **"🎯 Locate Me"**: Utilizes HTML5 Geolocation API (`navigator.geolocation`) to automatically position the map and pinpoint exact latitude/longitude coordinates.

### 3. 👥 Multi-Role Enterprise Workflows
* **Citizen**: Report incidents, view interactive GIS pins, track status progress on a 4-stage stepper, and submit star ratings with satisfaction remarks.
* **Field Officer**: Dedicated dashboard displaying assigned municipal tasks, allowing officers to transition cases from *Assigned* ➔ *In Progress* ➔ *Resolved* with field proof remarks.
* **City Administrator**: Comprehensive municipal command center featuring:
  - Incident status KPI counters (*Pending, In Progress, Resolved, Critical*)
  - Category distribution visual bar charts
  - Officer leaderboard tracking resolution efficiency rates (%)
  - Manual officer case re-allocation tool
  - **📥 Export Municipal CSV Report** generating instantaneous audit spreadsheets.

---

## ⚡ Pre-Configured Demo Accounts

For immediate evaluation, the login screen provides **one-click demo login buttons**:

| Role | Email | Password | Name / Department |
| :--- | :--- | :--- | :--- |
| **👑 City Admin** | `admin@civicai.org` | `admin123` | Municipal Commissioner |
| **👮 Water Officer** | `officer.sharma@civicai.org` | `officer123` | Er. Alok Sharma (Water & Sewage) |
| **🚧 PWD Officer** | `officer.patel@civicai.org` | `officer123` | Insp. Rajesh Patel (Roads & PWD) |
| **👤 Citizen** | `citizen@civicai.org` | `citizen123` | Priya Verma |

---

## 🚀 Step-by-Step Setup & Installation Guide

### Step 1: Clone the Repository
```powershell
git clone https://github.com/mukeshyadav561420m-droid/CivicAI.git
cd CivicAI
```

### Step 2: Set Up & Run the Backend
```powershell
# 1. Activate the Python virtual environment
.\backend\.venv\Scripts\Activate.ps1

# 2. Install dependencies (if setting up fresh)
pip install -r backend/requirements.txt

# 3. Start the FastAPI server on port 8001
python -m uvicorn backend.app.main:app --port 8001 --host 127.0.0.1
```
* **Live API**: [http://127.0.0.1:8001/](http://127.0.0.1:8001/)
* **Interactive Swagger Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
* **AI Engine Status**: [http://127.0.0.1:8001/ai/status](http://127.0.0.1:8001/ai/status)

### Step 3: Set Up & Run the Frontend
```powershell
# Open a new terminal window:
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
* **Web Application UI**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🔄 Role-by-Role Workflow Walkthrough

### 1. Citizen Journey
1. Log in with `citizen@civicai.org`.
2. Go to **🚨 Report Issue**.
3. Type: *"Main drinking water pipe burst on 4th Avenue, dirty water leaking onto road"*.
4. Notice how the **AI Assistant** immediately identifies `Water Supply`, predicts high urgency, routes to `Municipal Water Board`, and checks nearby coordinates for duplicates.
5. Drop your pin on the map or click **🎯 Locate Me**.
6. Submit the complaint and monitor its real-time 4-stage lifecycle under **📝 Civic Issues Hub**.
7. Once resolved, submit a 1–5 star rating and feedback review.

### 2. Field Officer Journey
1. Log in with `officer.sharma@civicai.org`.
2. Go to **👮 Officer Field Board** to view assigned cases.
3. Click **🔄 Start Work** to update status to *In Progress*.
4. Once repairs are completed on-site, click **✅ Mark Resolved**, enter field proof remarks, and confirm.

### 3. City Administrator Journey
1. Log in with `admin@civicai.org`.
2. Access the **👑 Command Center**.
3. Inspect city-wide KPI metrics, SLA breaches, and category distribution charts.
4. Assign unassigned civic complaints to available field officers.
5. Download an official audit spreadsheet via **📥 Export Municipal CSV Report**.

---

## 📡 Complete REST API Reference

| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/users/register` | Register a new user account with role & department | Public |
| `POST` | `/users/login` | Authenticate user credentials and return JWT bearer token | Public |
| `GET` | `/auth/me` | Fetch active user profile from authorization token | Authenticated |
| `GET` | `/ai/status` | Health check for AI classification and spatial engines | Public |
| `POST` | `/ai/analyze` | Real-time NLP category, urgency scoring & duplicate scan | Public / All |
| `GET` | `/complaints/` | List complaints with category, status, and search filters | Authenticated |
| `POST` | `/complaints/` | Submit a new complaint with AI enrichment & coordinates | Citizen |
| `GET` | `/complaints/{id}` | Retrieve comprehensive single complaint details | Authenticated |
| `GET` | `/complaints/{id}/history` | Retrieve full chronological status audit trail | Authenticated |
| `POST` | `/complaints/{id}/feedback`| Submit citizen satisfaction rating (1–5 stars) & review | Citizen |
| `GET` | `/officer/dashboard` | Get officer's assigned tasks and workload metrics | Officer |
| `PATCH`| `/officer/complaints/{id}/status` | Update task status (*in_progress* / *resolved*) with notes | Officer |
| `GET` | `/admin/dashboard` | Get city-wide analytics, category charts & officer stats | Admin |
| `GET` | `/admin/officers` | List all registered municipal field officers | Admin |
| `PATCH`| `/admin/complaints/{id}/assign` | Assign or reallocate a complaint to an officer | Admin |

---

## 📂 Project Directory Structure

```
CivicAI/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── analyzer.py            # NLP semantic classifier & urgency scorer
│   │   │   └── duplicate_detector.py  # Spatial Haversine duplicate filtering
│   │   ├── api/
│   │   │   ├── ai.py                  # Real-time AI triage & diagnostic endpoints
│   │   │   ├── admin.py               # Municipal KPIs & assignment APIs
│   │   │   ├── officer.py             # Field officer dashboard & status endpoints
│   │   │   ├── complaints.py          # Complaint CRUD, audit logs & feedback
│   │   │   ├── users.py               # User authentication & registration
│   │   │   └── auth.py                # Profile & JWT verification
│   │   ├── database/
│   │   │   ├── connection.py          # SQLite / PostgreSQL engine configuration
│   │   │   └── seed.py                # Database auto-seeder with realistic demo data
│   │   ├── models/                    # SQLAlchemy models (User, Complaint, ComplaintHistory)
│   │   ├── schemas/                   # Pydantic schemas for request/response validation
│   │   └── services/                  # Passwords, JWT, and RBAC authorization
│   ├── requirements.txt               # Backend Python dependencies
│   └── main.py                        # FastAPI entry point & lifespan handler
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CivicMap.jsx           # Interactive Leaflet GIS map & pin drop
│   │   │   ├── ComplaintDetailModal.jsx # Lifecycle stepper, audit timeline, rating
│   │   │   └── AdminAnalyticsView.jsx # SVG charts, leaderboard & CSV export
│   │   ├── api.js                     # Unified backend API service client
│   │   ├── App.jsx                    # Primary multi-role dashboard application
│   │   ├── App.css                    # Modern civic tech design system & responsive styling
│   │   └── main.jsx                   # React 19 application entry point
│   ├── package.json                   # Frontend dependencies & scripts
│   └── vite.config.js                 # Vite configuration
├── civicai.db                         # SQLite local database
├── docker-compose.yml                 # Optional PostGIS PostgreSQL container config
└── README.md                          # Comprehensive project documentation
```

---

## 👨‍💻 Author & Acknowledgments

* **Lead Developer & Creator**: **Mukesh Yadav**
* **GitHub**: [@mukeshyadav561420m-droid](https://github.com/mukeshyadav561420m-droid)
* **Project Repository**: [https://github.com/mukeshyadav561420m-droid/CivicAI](https://github.com/mukeshyadav561420m-droid/CivicAI)

---

*CivicAI - Empowering citizens and municipal authorities with modern artificial intelligence and transparent governance.*
