# ================================================================
#  backend/app/schemas/student.py
# ================================================================

from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    department_id: str
    study_year_id: str
    enrollment_year: int | None = None


class StudentUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    study_year_id: str | None = None
    enrollment_year: int | None = None
    is_active: bool | None = None


class StudentResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    study_year_id: str | None
    enrollment_year: int | None
    is_active: bool
    model_config = {"from_attributes": True}


class StudentSummaryYear(BaseModel):
    study_year_id: str
    label: str
    student_count: int


class StudentSummaryResponse(BaseModel):
    total: int
    counts: list[StudentSummaryYear]


# ── Enrollment ───────────────────────────────────────────────────
class EnrollmentCreate(BaseModel):
    student_id: str
    section_id: str


class EnrollmentResponse(BaseModel):
    id: str
    student_id: str
    section_id: str
    model_config = {"from_attributes": True}