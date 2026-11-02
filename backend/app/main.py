import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.database.connection import Base, engine
from app.database.seed import seed_database_if_empty

from app.api.complaints import router as complaints_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.rbac_test import router as rbac_test_router
from app.api.officer import router as officer_router
from app.api.admin import router as admin_router
from app.api.ai import router as ai_router

from app.models.complaint import Complaint
from app.models.user import User
from app.models.complaint_history import ComplaintHistory


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all database tables on startup
    Base.metadata.create_all(bind=engine)

    # Seed default municipal accounts and complaints if database is empty
    seed_database_if_empty()

    yield


app = FastAPI(
    title="CivicAI API",
    description="Real-Time AI-Powered Civic Issue Resolution Platform",
    version="2.0.0",
    lifespan=lifespan
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "CivicAI Backend",
        "version": "2.0.0"
    }


@app.get("/api")
def api_status():
    return {
        "message": "CivicAI Backend Engine is active and operational",
        "version": "2.0.0",
        "status": "success",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "ai_status": "/ai/status"
        }
    }


app.include_router(complaints_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(rbac_test_router)
app.include_router(officer_router)
app.include_router(admin_router)
app.include_router(ai_router)

# Serve Frontend static assets and SPA routing
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(static_dir, "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    def home():
        return {
            "message": "CivicAI Backend Engine is active and operational",
            "version": "2.0.0",
            "status": "success",
            "endpoints": {
                "docs": "/docs",
                "health": "/health",
                "ai_status": "/ai/status"
            }
        }

