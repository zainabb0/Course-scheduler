# ================================================================
#  backend/app/routers/classrooms.py
#
#  GET    /classrooms             → list (filter: dept, type, active, shared)
#  POST   /classrooms             → create
#  GET    /classrooms/{id}        → get one
#  PUT    /classrooms/{id}        → update
#  DELETE /classrooms/{id}        → delete
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.room import Room, RoomType
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomResponse

router = APIRouter()


@router.get("", response_model=list[ClassroomResponse])
async def list_classrooms(
    department_id: str | None = Query(None),
    room_type: RoomType | None = Query(None),
    active_only: bool = Query(True),
    include_shared: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    q = select(Room)

    if department_id:
        if include_shared:
            # Return rooms for this department OR shared rooms
            q = q.where(
                or_(
                    Room.department_id == department_id,
                    Room.is_shared == True,
                )
            )
        else:
            q = q.where(Room.department_id == department_id)

    if room_type:
        q = q.where(Room.room_type == room_type)
    if active_only:
        q = q.where(Room.is_active == True)
    q = q.order_by(Room.code)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    body: ClassroomCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    exists = await db.execute(select(Room).where(Room.code == body.code.upper()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Room code already exists")

    room = Room(**body.model_dump())
    room.code = room.code.upper()

    if room.is_shared:
        room.department_id = None
    elif not room.department_id:
        raise HTTPException(status_code=400, detail="Department is required for non-shared rooms")

    db.add(room)
    await db.flush()
    await db.refresh(room)
    return room


@router.get("/{room_id}", response_model=ClassroomResponse)
async def get_classroom(room_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return room


@router.put("/{room_id}", response_model=ClassroomResponse)
async def update_classroom(
    room_id: str,
    body: ClassroomUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(room, field, value)

    # If marked as shared, remove department association
    if room.is_shared:
        room.department_id = None
    elif room.department_id is None:
        raise HTTPException(status_code=400, detail="Department is required for non-shared rooms")

    await db.flush()
    await db.refresh(room)
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    await db.delete(room)