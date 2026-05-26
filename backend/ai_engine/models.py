# ================================================================
#  backend/ai_engine/models.py
# ================================================================

from dataclasses import dataclass, field


@dataclass
class SlotData:
    """One time slot (e.g. Sunday 08:00–09:30)."""
    id: str
    day: str          # "sunday" … "thursday"
    start_time: str   # "08:00"
    end_time: str     # "09:30"
    slot_number: int  # 1-5 per day


@dataclass
class RoomData:
    """A classroom or lab."""
    id: str
    code: str
    capacity: int
    room_type: str    # "lecture" | "lab" | "both"
    has_computers: bool
    is_shared: bool = False  # True = shared across all departments


@dataclass
class InstructorData:
    """An instructor with their constraints."""
    id: str
    name: str
    max_hours_week: int
    blocked_slots: set = field(default_factory=set)
    preferred_time: str = "no_preference"
    preferred_days_off: list = field(default_factory=list)
    max_consecutive_hrs: int = 3


@dataclass
class SessionData:
    """One session to be scheduled."""
    id: str
    assignment_id: str
    section_id: str
    course_id: str
    course_code: str
    course_name: str
    instructor_id: str
    session_type: str
    study_year_id: str
    student_count: int
    hours_per_week: int
    required_room_type: str


@dataclass
class ScheduleSlot:
    """A fully assigned slot: session → (time_slot, room)."""
    session_id: str
    time_slot_id: str
    room_id: str
    day: str
    start_time: str
    instructor_id: str


@dataclass
class ProblemData:
    """Complete input to the AI engine."""
    schedule_id: str
    academic_year: str
    sessions: list[SessionData] = field(default_factory=list)
    slots: list[SlotData] = field(default_factory=list)
    rooms: list[RoomData] = field(default_factory=list)
    instructors: dict[str, InstructorData] = field(default_factory=dict)
    blocked_room_slots: set[tuple[str, str]] = field(default_factory=set)