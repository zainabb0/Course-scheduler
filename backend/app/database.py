# ================================================================
#  database.py — Async Database Engine & Session
# ================================================================

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ── Engine ──────────────────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,       # logs SQL in debug mode
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,        # reconnect if connection dropped
)


# ── Session Factory ─────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,    # keep objects usable after commit
    autocommit=False,
    autoflush=False,
)


# ── Base Model ──────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    All SQLAlchemy models inherit from this.
    Example:
        from app.database import Base
        class Course(Base):
            __tablename__ = "courses"
    """
    pass


# ── Dependency ──────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    FastAPI dependency — provides an async DB session per request.

    Usage in router:
        @router.get("/courses")
        async def get_courses(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── DB Init (for development) ────────────────────────────────────
async def create_tables():
    # Import all models so Base knows about them
    from app.models import (
        user, instructor, department, course,
        section, room, schedule, time_slot,
        student, study_year, schedule_entry,
        ai_log, course_assignment
    )
    from app.models.base import Base as AppBase
    async with engine.begin() as conn:
        await conn.run_sync(AppBase.metadata.create_all)
        await conn.execute(
            text(
                "ALTER TABLE study_years ADD COLUMN IF NOT EXISTS student_count INTEGER DEFAULT 0"
            )
        )


async def drop_tables():
    """Drop all tables — use with caution, development only."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)