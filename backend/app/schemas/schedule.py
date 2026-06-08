# ================================================================
#  backend/app/schemas/schedule.py
# ================================================================

from pydantic import BaseModel, Field
from app.models.schedule import ScheduleStatus


class ScheduleCreate(BaseModel):
    department_id:  str
    academic_year:  str = Field(..., pattern=r"^\d{4}-\d{4}$")
    semester:       str = Field(..., pattern=r"^(fall|spring)$")
    name:           str | None = None
    generations:    int   = Field(100, ge=10,  le=500)
    population_size:int   = Field(50,  ge=10,  le=200)
    mutation_rate:  float = Field(0.02,ge=0.001,le=0.5)
    crossover_rate: float = Field(0.8, ge=0.3,  le=1.0)


class ScheduleResponse(BaseModel):
    id:              str
    department_id:   str
    academic_year:   str
    semester:        str
    name:            str | None
    status:          ScheduleStatus
    generations:     int
    population_size: int
    mutation_rate:   float
    crossover_rate:  float
    fitness_score:   float | None
    conflicts_count: int   | None
    runtime_seconds: float | None
    model_config = {"from_attributes": True}


class ScheduleEntryResponse(BaseModel):
    id:                   str
    schedule_id:          str
    course_assignment_id: str
    section_id:           str
    room_id:              str
    time_slot_id:         str
    instructor_id:        str
    has_conflict:         bool
    is_manually_edited:   bool
    course_code:          str | None = None
    course_name:          str | None = None
    section_name:         str | None = None
    room_code:            str | None = None
    instructor_name:      str | None = None
    day:                  str | None = None
    start_time:           str | None = None
    end_time:             str | None = None
    session_type:         str | None = None
    model_config = {"from_attributes": True}


class EntryManualEdit(BaseModel):
    time_slot_id: str
    room_id:      str


class GenerationLogResponse(BaseModel):
    generation_number: int
    best_fitness:      float
    avg_fitness:       float
    conflicts_count:   int
    model_config = {"from_attributes": True}


class AIGenerateRequest(BaseModel):
    department_id:  str
    academic_year:  str = Field(..., pattern=r"^\d{4}-\d{4}$")
    semester:       str = Field("fall", pattern=r"^(fall|spring)$")
    name:           str | None = None
    generations:    int   = Field(100, ge=10,  le=500)
    population_size:int   = Field(50,  ge=10,  le=200)
    mutation_rate:  float = Field(0.02,ge=0.001,le=0.5)
    crossover_rate: float = Field(0.8, ge=0.3,  le=1.0)
    weight_preferred_time:       float = Field(2.0, ge=0.0, le=10.0)
    weight_days_off:             float = Field(2.0, ge=0.0, le=10.0)
    weight_consecutive_overload: float = Field(1.5, ge=0.0, le=10.0)
    weight_spread_sessions:      float = Field(1.0, ge=0.0, le=10.0)


class AIStatusResponse(BaseModel):
    schedule_id:     str
    status:          ScheduleStatus
    progress_pct:    int
    current_gen:     int
    total_gen:       int
    best_fitness:    float | None
    hard_violations: int   | None
    message:         str