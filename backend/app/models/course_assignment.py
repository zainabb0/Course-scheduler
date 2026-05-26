# ================================================================
#  models/course_assignment.py
#  Links Instructor → Course → session_type
# ================================================================

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.instructor import Instructor
    from app.models.schedule_entry import ScheduleEntry


class SessionType(str, enum.Enum):
    lecture = "lecture"
    lab     = "lab"


class CourseAssignment(Base, TimestampMixin):
    __tablename__ = "course_assignments"

    __table_args__ = (
        # v1.2: semester added to unique constraint
        UniqueConstraint(
            "course_id", "session_type", "academic_year", "semester",
            name="uix_course_session_year_semester"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    course_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    instructor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False
    )
    session_type: Mapped[SessionType] = mapped_column(
        Enum(SessionType, name="session_type"), nullable=False
    )
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    # v1.2: added semester — 'fall' or 'spring'
    semester: Mapped[str] = mapped_column(
        String(10), nullable=False, default="fall"
    )

    # ── Relationships ────────────────────────────────────────────
    course: Mapped["Course"] = relationship(back_populates="course_assignments")
    instructor: Mapped["Instructor"] = relationship(back_populates="course_assignments")
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship(
        back_populates="course_assignment"
    )

    def __repr__(self) -> str:
        return f"<Assignment course={self.course_id} [{self.session_type}] {self.semester}>"