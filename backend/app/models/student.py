# ================================================================
#  models/student.py
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department
    from app.models.study_year import StudyYear
    from app.models.enrollment import StudentEnrollment


class Student(Base, TimestampMixin):
    __tablename__ = "students"

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
    study_year_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("study_years.id", ondelete="SET NULL"),
        nullable=True
    )
    enrollment_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="student_profile")
    department: Mapped["Department | None"] = relationship()
    study_year: Mapped["StudyYear | None"] = relationship(back_populates="students")
    enrollments: Mapped[list["StudentEnrollment"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Student user={self.user_id}>"