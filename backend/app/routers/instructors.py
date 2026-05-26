# ================================================================
#  backend/app/routers/instructors.py
#
#  GET    /instructors                           → list all
#  POST   /instructors                           → create (admin creates account)
#  GET    /instructors/{id}                      → get one
#  PUT    /instructors/{id}                      → update (admin)
#  DELETE /instructors/{id}                      → delete
#
#  GET    /instructors/{id}/preferences          → get preferences
#  PUT    /instructors/{id}/preferences          → update preferences (instructor self)
#  GET    /instructors/{id}/availability         → get availability slots
#  PUT    /instructors/{id}/availability         → update a slot (instructor self)
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin, require_instructor
from app.core.security import hash_password
from app.database import get_db
from app.models.instructor import Instructor, InstructorPreference, InstructorAvailability
from app.models.user import User, UserRole
from app.schemas.instructor import (
    InstructorCreate, InstructorUpdate, InstructorResponse,
    PreferencesUpdate, PreferencesResponse,
    AvailabilitySlotUpdate, AvailabilityResponse,
)

router = APIRouter()


# ── Instructor CRUD ──────────────────────────────────────────────

@router.get("", response_model=list[InstructorResponse])
async def list_instructors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Instructor)
        .join(User)
        .options(selectinload(Instructor.user), selectinload(Instructor.preferences))
        .where(User.is_active == True)
        .order_by(User.full_name)
    )
    instructors = result.scalars().all()
    return [_flatten_instructor(i) for i in instructors]


@router.post("", response_model=InstructorResponse, status_code=status.HTTP_201_CREATED)
async def create_instructor(
    body: InstructorCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Check email uniqueness
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.instructor,
        department_id=body.department_id,
    )
    db.add(user)
    await db.flush()

    # Create instructor profile
    instructor = Instructor(
        user_id=user.id,
        title=body.title,
        max_hours_week=body.max_hours_week,
    )
    db.add(instructor)
    await db.flush()

    # Create default preferences
    prefs = InstructorPreference(instructor_id=instructor.id)
    db.add(prefs)
    await db.flush()

    await db.refresh(instructor)
    await db.refresh(user)
    return _flatten_instructor(instructor, user)


@router.get("/{instructor_id}", response_model=InstructorResponse)
async def get_instructor(instructor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Instructor)
        .options(selectinload(Instructor.user), selectinload(Instructor.preferences))
        .where(Instructor.id == instructor_id)
    )
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return _flatten_instructor(instructor)


@router.put("/{instructor_id}", response_model=InstructorResponse)
async def update_instructor(
    instructor_id: str,
    body: InstructorUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(Instructor)
        .options(selectinload(Instructor.user), selectinload(Instructor.preferences))
        .where(Instructor.id == instructor_id)
    )
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    if body.full_name is not None:
        instructor.user.full_name = body.full_name
    if body.title is not None:
        instructor.title = body.title
    if body.max_hours_week is not None:
        instructor.max_hours_week = body.max_hours_week
    if body.is_active is not None:
        instructor.user.is_active = body.is_active

    await db.flush()
    return _flatten_instructor(instructor)


@router.delete("/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_instructor(
    instructor_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(select(Instructor).where(Instructor.id == instructor_id))
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    # Remove instructor from course assignments first
    from sqlalchemy import update
    from app.models.course_assignment import CourseAssignment
    await db.execute(
        update(CourseAssignment)
        .where(CourseAssignment.instructor_id == instructor_id)
        .values(instructor_id=None)
    )

    # Deactivate user instead of hard delete (safer)
    user_result = await db.execute(select(User).where(User.id == instructor.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.is_active = False


# ── Preferences ──────────────────────────────────────────────────

@router.get("/{instructor_id}/preferences", response_model=PreferencesResponse)
async def get_preferences(
    instructor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_self_or_admin(current_user, instructor_id, db)
    result = await db.execute(
        select(InstructorPreference).where(
            InstructorPreference.instructor_id == instructor_id
        )
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not set yet")
    return prefs


@router.put("/{instructor_id}/preferences", response_model=PreferencesResponse)
async def update_preferences(
    instructor_id: str,
    body: PreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_self_or_admin(current_user, instructor_id, db)

    result = await db.execute(
        select(InstructorPreference).where(
            InstructorPreference.instructor_id == instructor_id
        )
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = InstructorPreference(instructor_id=instructor_id)
        db.add(prefs)

    for field, value in body.model_dump(exclude_none=True).items():
        if field == "preferred_days_off" and value is not None:
            setattr(prefs, field, [d.value for d in value])
        else:
            setattr(prefs, field, value)

    await db.flush()
    await db.refresh(prefs)
    return prefs


# ── Availability ─────────────────────────────────────────────────

@router.get("/{instructor_id}/availability", response_model=list[AvailabilityResponse])
async def get_availability(
    instructor_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InstructorAvailability)
        .where(InstructorAvailability.instructor_id == instructor_id)
        .order_by(InstructorAvailability.day, InstructorAvailability.start_time)
    )
    return result.scalars().all()


@router.put("/{instructor_id}/availability", response_model=AvailabilityResponse)
async def update_availability_slot(
    instructor_id: str,
    body: AvailabilitySlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_self_or_admin(current_user, instructor_id, db)

    result = await db.execute(
        select(InstructorAvailability).where(
            InstructorAvailability.instructor_id == instructor_id,
            InstructorAvailability.day == body.day,
            InstructorAvailability.start_time == body.start_time,
        )
    )
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.is_available = body.is_available
    await db.flush()
    await db.refresh(slot)
    return slot


# ── Helpers ──────────────────────────────────────────────────────

def _flatten_instructor(instructor: Instructor, user: User | None = None):
    """Merge Instructor + User into a flat dict for the response schema."""
    u = user or instructor.user
    return {
        "id": instructor.id,
        "user_id": instructor.user_id,
        "full_name": u.full_name,
        "email": u.email,
        "title": instructor.title,
        "max_hours_week": instructor.max_hours_week,
        "is_active": u.is_active,
        "preferences": instructor.preferences,
    }


async def _check_self_or_admin(current_user: User, instructor_id: str, db: AsyncSession):
    """Allow admin OR the instructor themselves."""
    if current_user.role.value == "admin":
        return
    # Find instructor profile for this user
    result = await db.execute(
        select(Instructor).where(Instructor.user_id == current_user.id)
    )
    instructor = result.scalar_one_or_none()
    if not instructor or instructor.id != instructor_id:
        raise HTTPException(status_code=403, detail="Access denied")