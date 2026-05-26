# ================================================================
#  backend/app/schemas/course.py
# ================================================================

from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    department_id: str
    study_year_id: str
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=20)
    credit_hours: int = Field(3, ge=1, le=9)
    has_lab: bool = False
    lecture_hours_week: int = Field(2, ge=1, le=6)
    lab_hours_week: int = Field(0, ge=0, le=4)
    has_sections: bool = False
    min_capacity: int = Field(30, ge=1, le=500)
    description: str | None = None


class CourseUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    credit_hours: int | None = Field(None, ge=1, le=9)
    has_lab: bool | None = None
    lecture_hours_week: int | None = Field(None, ge=1, le=6)
    lab_hours_week: int | None = Field(None, ge=0, le=4)
    has_sections: bool | None = None
    min_capacity: int | None = Field(None, ge=1, le=500)
    description: str | None = None
    is_active: bool | None = None


class CourseResponse(BaseModel):
    id: str
    department_id: str
    study_year_id: str
    name: str
    code: str
    credit_hours: int
    has_lab: bool
    lecture_hours_week: int
    lab_hours_week: int
    has_sections: bool
    min_capacity: int
    description: str | None
    is_active: bool
    model_config = {"from_attributes": True}