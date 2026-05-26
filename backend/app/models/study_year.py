# ================================================================
#  models/study_year.py
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.course import Course
    from app.models.section import Section
    from app.models.student import Student


class StudyYear(Base, TimestampMixin):
    __tablename__ = "study_years"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    department_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    year_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-6
    label: Mapped[str] = mapped_column(String(60), nullable=False)     # "First Year"

    # ── Relationships ────────────────────────────────────────────
    department: Mapped["Department"] = relationship(back_populates="study_years")
    courses: Mapped[list["Course"]] = relationship(back_populates="study_year")
    sections: Mapped[list["Section"]] = relationship(back_populates="study_year")
    students: Mapped[list["Student"]] = relationship(back_populates="study_year")

    def __repr__(self) -> str:
        return f"<StudyYear {self.label}>"