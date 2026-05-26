# ================================================================
#  backend/app/routers/students.py
#
#  GET    /students               → list (filter: year)
#  POST   /students               → create (admin creates account)
#  GET    /students/{id}          → get one
#  PUT    /students/{id}          → update
#  DELETE /students/{id}          → delete
#
#  GET    /students/{id}/enrollments       → list enrollments
#  POST   /students/{id}/enrollments       → enroll in section
#  DELETE /students/{id}/enrollments/{enr} → remove enrollment
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.student import Student
from app.models.enrollment import StudentEnrollment
from app.models.user import User, UserRole
from app.schemas.student import (
    StudentCreate, StudentUpdate, StudentResponse,
    EnrollmentCreate, EnrollmentResponse,
)

router = APIRouter()


@router.get("", response_model=list[StudentResponse])
async def list_students(
    study_year_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = select(Student).join(User).options(selectinload(Student.user))
    if study_year_id:
        q = q.where(Student.study_year_id == study_year_id)
    q = q.order_by(User.full_name)
    result = await db.execute(q)
    return [_flatten_student(s) for s in result.scalars().all()]


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.student,
        department_id=body.department_id,
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        study_year_id=body.study_year_id,
        enrollment_year=body.enrollment_year,
    )
    db.add(student)
    await db.flush()
    await db.refresh(student)
    return _flatten_student(student, user)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(Student).options(selectinload(Student.user)).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _flatten_student(student)


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    body: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(Student).options(selectinload(Student.user)).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if body.full_name is not None:
        student.user.full_name = body.full_name
    if body.study_year_id is not None:
        student.study_year_id = body.study_year_id
    if body.enrollment_year is not None:
        student.enrollment_year = body.enrollment_year
    if body.is_active is not None:
        student.user.is_active = body.is_active

    await db.flush()
    return _flatten_student(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(Student).options(selectinload(Student.user)).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.delete(student.user)


# ── Enrollments ──────────────────────────────────────────────────

@router.get("/{student_id}/enrollments", response_model=list[EnrollmentResponse])
async def list_enrollments(
    student_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudentEnrollment).where(StudentEnrollment.student_id == student_id)
    )
    return result.scalars().all()


@router.post("/{student_id}/enrollments", response_model=EnrollmentResponse,
             status_code=status.HTTP_201_CREATED)
async def enroll_student(
    student_id: str,
    body: EnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Check already enrolled
    exists = await db.execute(
        select(StudentEnrollment).where(
            StudentEnrollment.student_id == student_id,
            StudentEnrollment.section_id == body.section_id,
        )
    )
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled in this section")

    enrollment = StudentEnrollment(student_id=student_id, section_id=body.section_id)
    db.add(enrollment)
    await db.flush()
    await db.refresh(enrollment)
    return enrollment


@router.delete("/{student_id}/enrollments/{enrollment_id}",
               status_code=status.HTTP_204_NO_CONTENT)
async def remove_enrollment(
    student_id: str,
    enrollment_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(StudentEnrollment).where(
            StudentEnrollment.id == enrollment_id,
            StudentEnrollment.student_id == student_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    await db.delete(enrollment)


# ── Helper ───────────────────────────────────────────────────────

def _flatten_student(student: Student, user: User | None = None):
    u = user or student.user
    return {
        "id": student.id,
        "user_id": student.user_id,
        "full_name": u.full_name,
        "email": u.email,
        "study_year_id": student.study_year_id,
        "enrollment_year": student.enrollment_year,
        "is_active": u.is_active,
    }