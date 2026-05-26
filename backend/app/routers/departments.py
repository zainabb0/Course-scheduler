# ================================================================
#  backend/app/routers/departments.py
#
#  GET    /departments            → list all
#  POST   /departments            → create
#  GET    /departments/{id}       → get one (with study_years)
#  PUT    /departments/{id}       → update
#  DELETE /departments/{id}       → delete
#
#  GET    /departments/{id}/study-years        → list years
#  POST   /departments/{id}/study-years        → add year
#  PUT    /departments/{id}/study-years/{yr_id}→ update year
#  DELETE /departments/{id}/study-years/{yr_id}→ delete year
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.department import Department
from app.models.study_year import StudyYear
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    DepartmentDetailResponse, StudyYearCreate, StudyYearUpdate,
    StudyYearResponse,
)

router = APIRouter()


# ── Departments CRUD ─────────────────────────────────────────────

@router.get("", response_model=list[DepartmentResponse])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    body: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Check code uniqueness
    exists = await db.execute(
        select(Department).where(Department.code == body.code.upper())
    )
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists")

    dept = Department(name=body.name, code=body.code.upper())
    db.add(dept)
    await db.flush()
    await db.refresh(dept)
    return dept


@router.get("/{dept_id}", response_model=DepartmentDetailResponse)
async def get_department(dept_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Department)
        .options(selectinload(Department.study_years))
        .where(Department.id == dept_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: str,
    body: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if body.name is not None:
        dept.name = body.name
    if body.code is not None:
        dept.code = body.code.upper()

    await db.flush()
    await db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    dept_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)


# ── Study Years ──────────────────────────────────────────────────

@router.get("/{dept_id}/study-years", response_model=list[StudyYearResponse])
async def list_study_years(dept_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudyYear)
        .where(StudyYear.department_id == dept_id)
        .order_by(StudyYear.year_number)
    )
    return result.scalars().all()


@router.post("/{dept_id}/study-years", response_model=StudyYearResponse,
             status_code=status.HTTP_201_CREATED)
async def add_study_year(
    dept_id: str,
    body: StudyYearCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    year = StudyYear(
        department_id=dept_id,
        year_number=body.year_number,
        label=body.label,
    )
    db.add(year)
    await db.flush()
    await db.refresh(year)
    return year


@router.put("/{dept_id}/study-years/{yr_id}", response_model=StudyYearResponse)
async def update_study_year(
    dept_id: str,
    yr_id: str,
    body: StudyYearUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(StudyYear).where(
            StudyYear.id == yr_id,
            StudyYear.department_id == dept_id,
        )
    )
    year = result.scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Study year not found")

    if body.label is not None:
        year.label = body.label

    await db.flush()
    await db.refresh(year)
    return year


@router.delete("/{dept_id}/study-years/{yr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study_year(
    dept_id: str,
    yr_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(StudyYear).where(
            StudyYear.id == yr_id,
            StudyYear.department_id == dept_id,
        )
    )
    year = result.scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Study year not found")
    await db.delete(year)