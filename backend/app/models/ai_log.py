# ================================================================
#  models/ai_log.py — AI Generation Log (fitness per generation)
#  Used by FitnessChart in the frontend
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, new_uuid

if TYPE_CHECKING:
    from app.models.schedule import Schedule


class AIGenerationLog(Base):
    __tablename__ = "ai_generation_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    schedule_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("schedules.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    generation_number: Mapped[int] = mapped_column(Integer, nullable=False)
    best_fitness: Mapped[float] = mapped_column(Float, nullable=False)
    avg_fitness: Mapped[float] = mapped_column(Float, nullable=False)
    conflicts_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    schedule: Mapped["Schedule"] = relationship(back_populates="generation_logs")