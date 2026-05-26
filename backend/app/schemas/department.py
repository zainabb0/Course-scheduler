# ================================================================
#  backend/app/schemas/department.py
# ================================================================

from pydantic import BaseModel, Field


# ── Department ───────────────────────────────────────────────────
class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=1, max_length=20)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=120)
    code: str | None = Field(None, min_length=1, max_length=20)


class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    model_config = {"from_attributes": True}


# ── StudyYear ────────────────────────────────────────────────────
class StudyYearCreate(BaseModel):
    department_id: str
    year_number: int = Field(..., ge=1, le=6)
    label: str = Field(..., min_length=2, max_length=60)


class StudyYearUpdate(BaseModel):
    label: str | None = Field(None, min_length=2, max_length=60)


class StudyYearResponse(BaseModel):
    id: str
    department_id: str
    year_number: int
    label: str
    model_config = {"from_attributes": True}


class DepartmentDetailResponse(DepartmentResponse):
    study_years: list[StudyYearResponse] = []