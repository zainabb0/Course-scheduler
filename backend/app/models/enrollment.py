# ================================================================
#  models/enrollment.py — Student ↔ Section mapping
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.section import Section


class StudentEnrollment(Base, TimestampMixin):
    __tablename__ = "student_enrollments"

    __table_args__ = (
        UniqueConstraint("student_id", "section_id", name="uix_student_section"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    student_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )

    # ── Relationships ────────────────────────────────────────────
    student: Mapped["Student"] = relationship(back_populates="enrollments")
    section: Mapped["Section"] = relationship(back_populates="enrollments")