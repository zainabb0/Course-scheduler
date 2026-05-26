# ================================================================
#  models/department.py
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.study_year import StudyYear
    from app.models.user import User
    from app.models.room import Room
    from app.models.course import Course


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=new_uuid
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    study_years: Mapped[list["StudyYear"]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="department"
    )
    rooms: Mapped[list["Room"]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )
    courses: Mapped[list["Course"]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Department {self.code}>"