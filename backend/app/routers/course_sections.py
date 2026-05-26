# ================================================================
#  backend/app/routers/course_sections.py  (Course Sections page)
#
#  Sections:
#  GET    /course-sections/sections              → list (filter: course, year)
#  POST   /course-sections/sections              → create
#  PUT    /course-sections/sections/{id}         → update
#  DELETE /course-sections/sections/{id}         → delete
#
#  Assignments (instructor → course):
#  GET    /course-sections/assignments           → list (filter: year)
#  POST   /course-sections/assignments           → create
#  PUT    /course-sections/assignments/{id}      → update instructor
#  DELETE /course-sections/assignments/{id}      → delete
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.section import Section
from app.models.course_assignment import CourseAssignment
from app.models.course import Course
from app.models.instructor import Instructor
from app.models.user import User
from app.schemas.section import (
    SectionCreate, SectionUpdate, SectionResponse,
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
)

router = APIRouter()


# ── Sections ─────────────────────────────────────────────────────

@router.get("/sections", response_model=list[SectionResponse])
async def list_sections(
    course_id: str | None = Query(None),
    study_year_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Section)
    if course_id:
        q = q.where(Section.course_id == course_id)
    if study_year_id:
        q = q.where(Section.study_year_id == study_year_id)
    q = q.order_by(Section.course_id, Section.name)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/sections", response_model=SectionResponse,
             status_code=status.HTTP_201_CREATED)
async def create_section(
    body: SectionCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    section = Section(**body.model_dump())
    db.add(section)
    await db.flush()
    await db.refresh(section)
    return section


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: str,
    body: SectionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(section, field, value)

    await db.flush()
    await db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    await db.delete(section)


# ── Assignments ──────────────────────────────────────────────────

@router.get("/assignments", response_model=list[AssignmentResponse])
async def list_assignments(
    academic_year: str | None = Query(None),
    course_id: str | None = Query(None),
    instructor_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(CourseAssignment)
        .options(
            selectinload(CourseAssignment.course),
            selectinload(CourseAssignment.instructor)
            .selectinload(Instructor.user),
        )
    )
    if academic_year:
        q = q.where(CourseAssignment.academic_year == academic_year)
    if course_id:
        q = q.where(CourseAssignment.course_id == course_id)
    if instructor_id:
        q = q.where(CourseAssignment.instructor_id == instructor_id)

    result = await db.execute(q)
    assignments = result.scalars().all()
    return [_flatten_assignment(a) for a in assignments]


@router.post("/assignments", response_model=AssignmentResponse,
             status_code=status.HTTP_201_CREATED)
async def create_assignment(
    body: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Check uniqueness: one instructor per course per session_type per year
    exists = await db.execute(
        select(CourseAssignment).where(
            CourseAssignment.course_id == body.course_id,
            CourseAssignment.session_type == body.session_type,
            CourseAssignment.academic_year == body.academic_year,
        )
    )
    if exists.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Assignment already exists for this course/{body.session_type}/{body.academic_year}"
        )

    assignment = CourseAssignment(**body.model_dump())
    db.add(assignment)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(CourseAssignment)
        .options(
            selectinload(CourseAssignment.course),
            selectinload(CourseAssignment.instructor).selectinload(Instructor.user),
        )
        .where(CourseAssignment.id == assignment.id)
    )
    return _flatten_assignment(result.scalar_one())


@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    body: AssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(CourseAssignment)
        .options(
            selectinload(CourseAssignment.course),
            selectinload(CourseAssignment.instructor).selectinload(Instructor.user),
        )
        .where(CourseAssignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if body.instructor_id is not None:
        assignment.instructor_id = body.instructor_id

    await db.flush()
    await db.refresh(assignment)
    return _flatten_assignment(assignment)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(CourseAssignment).where(CourseAssignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)


# ── Helper ───────────────────────────────────────────────────────

def _flatten_assignment(a: CourseAssignment):
    return {
        "id": a.id,
        "course_id": a.course_id,
        "instructor_id": a.instructor_id,
        "session_type": a.session_type,
        "academic_year": a.academic_year,
        "course_name": a.course.name if a.course else None,
        "course_code": a.course.code if a.course else None,
        "instructor_name": a.instructor.user.full_name if a.instructor and a.instructor.user else None,
    }