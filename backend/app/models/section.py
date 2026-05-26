# ================================================================
#  models/section.py
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.study_year import StudyYear
    from app.models.schedule_entry import ScheduleEntry
    from app.models.enrollment import StudentEnrollment


class Section(Base, TimestampMixin):
    __tablename__ = "sections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    course_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    # Denormalized from course (v1.1) — avoids extra join in AI engine
    study_year_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("study_years.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(20), nullable=False)  # "Main" / "A" / "B"
    student_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    course: Mapped["Course"] = relationship(back_populates="sections")
    study_year: Mapped["StudyYear"] = relationship(back_populates="sections")
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship(
        back_populates="section"
    )
    enrollments: Mapped[list["StudentEnrollment"]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Section {self.name} — course {self.course_id}>"