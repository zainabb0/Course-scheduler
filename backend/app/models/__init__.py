# ================================================================
#  models/__init__.py
#  Import all models here so SQLAlchemy and Alembic can detect them
# ================================================================

from app.models.base import Base, TimestampMixin
from app.models.department import Department
from app.models.study_year import StudyYear
from app.models.user import User, UserRole
from app.models.instructor import (
    Instructor,
    InstructorPreference,
    InstructorAvailability,
    PreferredTime,
    WeekDay,
)
from app.models.room import Room, RoomType
from app.models.course import Course
from app.models.section import Section
from app.models.course_assignment import CourseAssignment, SessionType
from app.models.time_slot import TimeSlot
from app.models.schedule import Schedule, ScheduleStatus
from app.models.schedule_entry import ScheduleEntry
from app.models.ai_log import AIGenerationLog
from app.models.student import Student
from app.models.enrollment import StudentEnrollment

__all__ = [
    "Base", "TimestampMixin",
    "Department",
    "StudyYear",
    "User", "UserRole",
    "Instructor", "InstructorPreference", "InstructorAvailability",
    "PreferredTime", "WeekDay",
    "Room", "RoomType",
    "Course",
    "Section",
    "CourseAssignment", "SessionType",
    "TimeSlot",
    "Schedule", "ScheduleStatus",
    "ScheduleEntry",
    "AIGenerationLog",
    "Student",
    "StudentEnrollment",
]