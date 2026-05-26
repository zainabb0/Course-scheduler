# ================================================================
#  models/time_slot.py
#  Sun–Thu, 08:00–14:30, 90-min slots (break 12:30–13:00)
# ================================================================

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, new_uuid
from app.models.instructor import WeekDay

if TYPE_CHECKING:
    from app.models.schedule_entry import ScheduleEntry


class TimeSlot(Base):
    __tablename__ = "time_slots"

    __table_args__ = (
        UniqueConstraint("day", "start_time", name="uix_day_start"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    day: Mapped[WeekDay] = mapped_column(Enum(WeekDay), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)  # "08:00"
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)    # "09:30"
    slot_number: Mapped[int] = mapped_column(Integer, nullable=False)   # 1-5 per day
    is_break: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Relationships ────────────────────────────────────────────
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship(
        back_populates="time_slot"
    )

    def __repr__(self) -> str:
        return f"<TimeSlot {self.day} {self.start_time}–{self.end_time}>"