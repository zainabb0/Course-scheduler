# ================================================================
#  backend/app/schemas/classroom.py
# ================================================================

from pydantic import BaseModel, Field
from app.models.room import RoomType


class ClassroomCreate(BaseModel):
    department_id: str | None = None
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    capacity: int = Field(..., ge=1, le=500)
    room_type: RoomType
    has_projector: bool = True
    has_computers: bool = False
    is_shared: bool = False


class ClassroomUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    capacity: int | None = Field(None, ge=1, le=500)
    room_type: RoomType | None = None
    has_projector: bool | None = None
    has_computers: bool | None = None
    is_active: bool | None = None
    is_shared: bool | None = None


class ClassroomResponse(BaseModel):
    id: str
    department_id: str | None = None
    name: str
    code: str
    capacity: int
    room_type: RoomType
    has_projector: bool
    has_computers: bool
    is_active: bool
    is_shared: bool = False
    model_config = {"from_attributes": True}