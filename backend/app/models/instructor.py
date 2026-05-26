# ================================================================
#  models/instructor.py
#  Instructor + InstructorPreference + InstructorAvailability
# ================================================================

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department
    from app.models.course_assignment import CourseAssignment


class PreferredTime(str, enum.Enum):
    morning        = "morning"
    afternoon      = "afternoon"
    no_preference  = "no_preference"


class WeekDay(str, enum.Enum):
    sunday    = "sunday"
    monday    = "monday"
    tuesday   = "tuesday"
    wednesday = "wednesday"
    thursday  = "thursday"


# ── Instructor ───────────────────────────────────────────────────
class Instructor(Base, TimestampMixin):
    __tablename__ = "instructors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False
    )
    # v1.2: added department_id
    department_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True
    )
    title: Mapped[str | None] = mapped_column(String(60), nullable=True)
    max_hours_week: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="instructor_profile")
    department: Mapped["Department | None"] = relationship()
    preferences: Mapped["InstructorPreference | None"] = relationship(
        back_populates="instructor", uselist=False, cascade="all, delete-orphan"
    )
    availability: Mapped[list["InstructorAvailability"]] = relationship(
        back_populates="instructor", cascade="all, delete-orphan"
    )
    course_assignments: Mapped[list["CourseAssignment"]] = relationship(
        back_populates="instructor"
    )

    def __repr__(self) -> str:
        return f"<Instructor {self.id}>"


# ── InstructorPreference ─────────────────────────────────────────
# Note: this table has only updated_at (no created_at) — do NOT use TimestampMixin
class InstructorPreference(Base):
    __tablename__ = "instructor_preferences"

    instructor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("instructors.id", ondelete="CASCADE"),
        primary_key=True
    )
    preferred_time: Mapped[PreferredTime] = mapped_column(
        Enum(PreferredTime), default=PreferredTime.no_preference, nullable=False
    )
    max_consecutive_hrs: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    preferred_days_off: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False, server_default="{}"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # ── Relationships ────────────────────────────────────────────
    instructor: Mapped["Instructor"] = relationship(back_populates="preferences")


# ── InstructorAvailability ───────────────────────────────────────
class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"

    __table_args__ = (
        UniqueConstraint("instructor_id", "day", "start_time",
                         name="uix_instructor_day_slot"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    instructor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False
    )
    day: Mapped[WeekDay] = mapped_column(Enum(WeekDay), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    instructor: Mapped["Instructor"] = relationship(back_populates="availability")

    def __repr__(self) -> str:
        status = "✓" if self.is_available else "✗"
        return f"<Availability {self.day} {self.start_time} {status}>"