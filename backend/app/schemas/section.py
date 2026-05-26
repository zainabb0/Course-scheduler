# ================================================================
#  backend/app/schemas/section.py  (Course Sections page)
# ================================================================

from pydantic import BaseModel, Field
from app.models.course_assignment import SessionType


# ── Section ──────────────────────────────────────────────────────
class SectionCreate(BaseModel):
    course_id: str
    study_year_id: str
    name: str = Field(..., max_length=20)   # "Main" / "A" / "B"
    student_count: int = Field(0, ge=0)


class SectionUpdate(BaseModel):
    name: str | None = Field(None, max_length=20)
    student_count: int | None = Field(None, ge=0)


class SectionResponse(BaseModel):
    id: str
    course_id: str
    study_year_id: str
    name: str
    student_count: int
    model_config = {"from_attributes": True}


# ── Course Assignment (Instructor → Course) ──────────────────────
class AssignmentCreate(BaseModel):
    course_id: str
    instructor_id: str
    session_type: SessionType
    academic_year: str = Field(..., pattern=r"^\d{4}-\d{4}$")


class AssignmentUpdate(BaseModel):
    instructor_id: str | None = None


class AssignmentResponse(BaseModel):
    id: str
    course_id: str
    instructor_id: str | None = None
    session_type: SessionType
    academic_year: str
    # Nested info for display
    course_name: str | None = None
    course_code: str | None = None
    instructor_name: str | None = None
    model_config = {"from_attributes": True}