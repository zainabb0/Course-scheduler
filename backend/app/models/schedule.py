# ================================================================
#  models/schedule.py — Schedule (one row per AI generation run)
# ================================================================

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.schedule_entry import ScheduleEntry
    from app.models.ai_log import AIGenerationLog


class ScheduleStatus(str, enum.Enum):
    pending    = "pending"
    running    = "running"
    completed  = "completed"
    failed     = "failed"


class Schedule(Base, TimestampMixin):
    __tablename__ = "schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    department_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Use the existing PostgreSQL enum type "schedule_status"
    status: Mapped[ScheduleStatus] = mapped_column(
        Enum(ScheduleStatus, name="schedule_status", create_type=False),
        default=ScheduleStatus.pending,
        nullable=False
    )

    # AI params
    generations: Mapped[int] = mapped_column(Integer, default=100)
    population_size: Mapped[int] = mapped_column(Integer, default=50)
    mutation_rate: Mapped[float] = mapped_column(Float, default=0.02)
    crossover_rate: Mapped[float] = mapped_column(Float, default=0.8)

    # Result metrics
    fitness_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    conflicts_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    runtime_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    entries: Mapped[list["ScheduleEntry"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )
    generation_logs: Mapped[list["AIGenerationLog"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Schedule {self.academic_year} [{self.status}]>"