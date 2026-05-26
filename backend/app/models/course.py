# ================================================================
#  models/course.py
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.study_year import StudyYear
    from app.models.section import Section
    from app.models.course_assignment import CourseAssignment


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    department_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    study_year_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("study_years.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    credit_hours: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Session config
    has_lab: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    lecture_hours_week: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    lab_hours_week: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Section config
    has_sections: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    min_capacity: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    department: Mapped["Department"] = relationship(back_populates="courses")
    study_year: Mapped["StudyYear"] = relationship(back_populates="courses")
    sections: Mapped[list["Section"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    course_assignments: Mapped[list["CourseAssignment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Course {self.code} — {self.name}>"