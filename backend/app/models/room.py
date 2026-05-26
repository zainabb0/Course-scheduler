# ================================================================
#  models/room.py
# ================================================================

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.schedule_entry import ScheduleEntry


class RoomType(str, enum.Enum):
    lecture = "lecture"
    lab     = "lab"
    both    = "both"


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    department_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType), nullable=False)
    has_projector: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_computers: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ────────────────────────────────────────────
    department: Mapped["Department | None"] = relationship(back_populates="rooms")
    schedule_entries: Mapped[list["ScheduleEntry"]] = relationship(
        back_populates="room"
    )

    def __repr__(self) -> str:
        shared = " [shared]" if self.is_shared else ""
        return f"<Room {self.code} [{self.room_type}] cap={self.capacity}{shared}>"