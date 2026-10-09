import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv("backend/.env", override=True)
load_dotenv(".env", override=True)

# Default to SQLite for seamless zero-dependency local running, or use PostgreSQL if configured
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./civicai.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args
    )
except Exception:
    # Graceful fallback to SQLite
    DATABASE_URL = "sqlite:///./civicai.db"
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
