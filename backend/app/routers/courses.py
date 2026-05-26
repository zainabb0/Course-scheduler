# ================================================================
#  backend/app/routers/courses.py
#
#  GET    /courses                → list (filter: dept, year, active)
#  POST   /courses                → create
#  GET    /courses/{id}           → get one
#  PUT    /courses/{id}           → update
#  DELETE /courses/{id}           → delete
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse

router = APIRouter()


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    department_id: str | None = Query(None),
    study_year_id: str | None = Query(None),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    q = select(Course)
    if department_id:
        q = q.where(Course.department_id == department_id)
    if study_year_id:
        q = q.where(Course.study_year_id == study_year_id)
    if active_only:
        q = q.where(Course.is_active == True)
    q = q.order_by(Course.code)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    exists = await db.execute(select(Course).where(Course.code == body.code.upper()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Course code already exists")

    course = Course(**body.model_dump())
    course.code = course.code.upper()
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    body: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(course, field, value)

    await db.flush()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)