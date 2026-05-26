# ================================================================
#  main.py — FastAPI Application Entry Point
# ================================================================

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

from app.config import settings
from app.database import create_tables

# ── Import routers ───────────────────────────────────────────────
from app.routers import auth
from app.routers import departments, classrooms, courses
from app.routers import instructors, students, course_sections
from app.routers import schedules, ai
from app.core.exceptions import register_exception_handlers
# Force all models to register with Base.metadata
from app.models import (
    user, instructor, department, course,
    section, room, schedule, time_slot,
    student, study_year, schedule_entry,
    ai_log, course_assignment
)

# ── Lifespan ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown."""
    # Startup
    await create_tables()
    print(f"✅ Database tables ready")
    print(f"🚀 {settings.app_name} v{settings.app_version} started")
    yield
    # Shutdown
    print("👋 Shutting down...")


# ── Security scheme for Swagger UI ──────────────────────────────
bearer_scheme = HTTPBearer()


# ── App Instance ────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    AI-powered course schedule generation system.

    ## Features
    - 🤖 Hybrid CSP + Genetic Algorithm schedule generation
    - 👥 Role-based access (Admin / Instructor / Student)
    - 📅 Department-level scheduling with room & instructor constraints
    - 📊 Real-time generation progress tracking

    ## Authentication
    1. Call **POST /auth/login** with your email and password
    2. Copy the `access_token` from the response
    3. Click **Authorize** (top right) and paste the token in the **bearerAuth** field
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True},
    openapi_tags=[],
)

# ── Override OpenAPI to add HTTPBearer scheme ────────────────────
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Add bearerAuth (HTTPBearer) alongside the existing OAuth2 scheme
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }
    # Apply bearerAuth globally to all operations
    for path in schema.get("paths", {}).values():
        for operation in path.values():
            operation.setdefault("security", []).append({"bearerAuth": []})
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi


# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
register_exception_handlers(app)


# ── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/auth",             tags=["Auth"])
app.include_router(departments.router,     prefix="/departments",      tags=["Departments"])
app.include_router(classrooms.router,      prefix="/classrooms",       tags=["Classrooms"])
app.include_router(courses.router,         prefix="/courses",          tags=["Courses"])
app.include_router(instructors.router,     prefix="/instructors",      tags=["Instructors"])
app.include_router(students.router,        prefix="/students",         tags=["Students"])
app.include_router(course_sections.router, prefix="/course-sections",  tags=["Course Sections"])
app.include_router(schedules.router,       prefix="/schedules",        tags=["Schedules"])
app.include_router(ai.router,              prefix="/ai",               tags=["AI Engine"])


# ── Health Check ────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}