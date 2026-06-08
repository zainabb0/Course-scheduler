# ================================================================
#  backend/app/schemas/instructor.py
# ================================================================

from pydantic import BaseModel, EmailStr, Field
from app.models.instructor import PreferredTime, WeekDay


# ── Create Instructor (Admin creates account) ────────────────────
class InstructorCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    department_id: str
    title: str | None = Field(None, max_length=50)
    max_hours_week: int = Field(20, ge=1, le=40)


class InstructorUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    title: str | None = Field(None, max_length=50)
    max_hours_week: int | None = Field(None, ge=1, le=40)
    is_active: bool | None = None


# ── Preferences (Instructor fills themselves) ────────────────────
class PreferencesUpdate(BaseModel):
    preferred_time: PreferredTime | None = None
    max_consecutive_hrs: int | None = Field(None, ge=1, le=6)
    preferred_days_off: list[WeekDay] | None = None
    notes: str | None = None


class PreferencesResponse(BaseModel):
    instructor_id: str
    preferred_time: PreferredTime
    max_consecutive_hrs: int
    preferred_days_off: list[str]
    notes: str | None
    model_config = {"from_attributes": True}


# ── Availability (Instructor fills themselves) ───────────────────
class AvailabilitySlotUpdate(BaseModel):
    day: WeekDay
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    is_available: bool


class AvailabilityResponse(BaseModel):
    id: str
    instructor_id: str
    day: WeekDay
    start_time: str
    end_time: str
    is_available: bool
    model_config = {"from_attributes": True}


# ── Full Instructor Response ─────────────────────────────────────
class InstructorResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    title: str | None
    max_hours_week: int
    is_active: bool
    department_id: str
    preferences: PreferencesResponse | None = None
    model_config = {"from_attributes": True}