from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database.connection import Base, engine
from backend.app.database.seed import seed_database_if_empty

from backend.app.api.complaints import router as complaints_router
from backend.app.api.users import router as users_router
from backend.app.api.auth import router as auth_router
from backend.app.api.rbac_test import router as rbac_test_router
from backend.app.api.officer import router as officer_router
from backend.app.api.admin import router as admin_router
from backend.app.api.ai import router as ai_router

from backend.app.models.complaint import Complaint
from backend.app.models.user import User
from backend.app.models.complaint_history import ComplaintHistory


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
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "CivicAI Backend",
        "version": "2.0.0"
    }


app.include_router(complaints_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(rbac_test_router)
app.include_router(officer_router)
app.include_router(admin_router)
app.include_router(ai_router)