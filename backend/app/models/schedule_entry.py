# ================================================================
#  models/schedule_entry.py — Actual timetable entries
#  Each row = one session (lecture or lab) placed in a slot + room
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid
from app.models.course_assignment import SessionType

if TYPE_CHECKING:
    from app.models.schedule import Schedule
    from app.models.course_assignment import CourseAssignment
    from app.models.section import Section
    from app.models.room import Room
    from app.models.time_slot import TimeSlot
    from app.models.instructor import Instructor


class ScheduleEntry(Base, TimestampMixin):
    __tablename__ = "schedule_entries"

    __table_args__ = (
        # Hard constraint indexes (prevent double-booking)
        # Room can't have two sessions at the same time
        UniqueConstraint(
            "schedule_id", "room_id", "time_slot_id",
            name="uix_room_timeslot"
        ),
        # Section can't have two sessions at the same time (no conflict)
        Index(
            "uix_section_timeslot",
            "schedule_id", "section_id", "time_slot_id",
            unique=True,
            postgresql_where="has_conflict = FALSE",
        ),
        # Instructor can't have two sessions at the same time (no conflict)
        Index(
            "uix_instructor_timeslot",
            "schedule_id", "instructor_id", "time_slot_id",
            unique=True,
            postgresql_where="has_conflict = FALSE",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)

    schedule_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False
    )
    course_assignment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("course_assignments.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    time_slot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False
    )
    # Denormalized for fast queries — instructor_id from course_assignment
    instructor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False
    )
    session_type: Mapped[SessionType] = mapped_column(
        Enum(SessionType, name="session_type"), nullable=False
    )

    has_conflict: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_manually_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    schedule: Mapped["Schedule"] = relationship(back_populates="entries")
    course_assignment: Mapped["CourseAssignment"] = relationship(back_populates="schedule_entries")
    section: Mapped["Section"] = relationship(back_populates="schedule_entries")
    room: Mapped["Room"] = relationship(back_populates="schedule_entries")
    time_slot: Mapped["TimeSlot"] = relationship(back_populates="schedule_entries")
    instructor: Mapped["Instructor"] = relationship()

    def __repr__(self) -> str:
        return f"<Entry section={self.section_id} slot={self.time_slot_id}>"