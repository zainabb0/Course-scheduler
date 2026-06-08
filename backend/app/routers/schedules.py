# ================================================================
#  backend/app/routers/schedules.py
#
#  GET    /schedules              → list schedules (filter: dept, year)
#  GET    /schedules/{id}         → get schedule + status
#  DELETE /schedules/{id}         → delete schedule + all entries
#
#  GET    /schedules/{id}/entries → get full timetable (joined)
#  PUT    /schedules/{id}/entries/{entry_id} → manual edit (drag&drop)
#
#  GET    /schedules/{id}/logs    → generation logs (for FitnessChart)
# ================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin
from app.database import get_db
from app.models.schedule import Schedule, ScheduleStatus
from app.models.schedule_entry import ScheduleEntry
from app.models.ai_log import AIGenerationLog
from app.models.course_assignment import CourseAssignment
from app.models.section import Section
from app.models.room import Room
from app.models.time_slot import TimeSlot
from app.models.instructor import Instructor
from app.models.course import Course
from app.models.user import User
from app.schemas.schedule import (
    ScheduleResponse, ScheduleEntryResponse,
    EntryManualEdit, GenerationLogResponse,
)
from app.models.user import UserRole

router = APIRouter()


# ── List / Get ───────────────────────────────────────────────────

@router.get("", response_model=list[ScheduleResponse])
async def list_schedules(
    department_id: str | None = Query(None),
    academic_year: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Schedule).order_by(Schedule.created_at.desc())
    if department_id:
        q = q.where(Schedule.department_id == department_id)
    if academic_year:
        q = q.where(Schedule.academic_year == academic_year)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(Schedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(Schedule).where(Schedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    await db.delete(schedule)


# ── Timetable Entries ────────────────────────────────────────────

@router.get("/{schedule_id}/entries", response_model=list[ScheduleEntryResponse])
async def get_schedule_entries(
    schedule_id: str,
    study_year_id: str | None = Query(None),
    instructor_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns full timetable entries with all display fields joined.
    Supports filtering by study_year_id (for Year 1/2/3/4 view)
    or instructor_id (for instructor's personal schedule).
    """
    q = (
        select(ScheduleEntry)
        .options(
            selectinload(ScheduleEntry.course_assignment)
            .selectinload(CourseAssignment.course),
            selectinload(ScheduleEntry.section),
            selectinload(ScheduleEntry.room),
            selectinload(ScheduleEntry.time_slot),
            selectinload(ScheduleEntry.instructor)
            .selectinload(Instructor.user),
        )
        .where(ScheduleEntry.schedule_id == schedule_id)
    )

    if study_year_id:
        q = q.join(Section, ScheduleEntry.section_id == Section.id).where(
            Section.study_year_id == study_year_id
        )
    if instructor_id:
        q = q.where(ScheduleEntry.instructor_id == instructor_id)

    # Students only see their own entries
    if current_user.role == UserRole.student:
        if current_user.student_profile:
            q = q.join(Section, ScheduleEntry.section_id == Section.id).where(
                Section.study_year_id == current_user.student_profile.study_year_id
            )

    result = await db.execute(q)
    entries = result.scalars().all()

    return [_flatten_entry(e) for e in entries]


@router.put(
    "/{schedule_id}/entries/{entry_id}",
    response_model=ScheduleEntryResponse,
)
async def manual_edit_entry(
    schedule_id: str,
    entry_id: str,
    body: EntryManualEdit,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Manual drag & drop edit — move a session to a new (slot, room).
    Marks entry as is_manually_edited=True.
    Does NOT re-validate constraints (frontend highlights conflicts).
    """
    result = await db.execute(
        select(ScheduleEntry)
        .options(
            selectinload(ScheduleEntry.course_assignment)
            .selectinload(CourseAssignment.course),
            selectinload(ScheduleEntry.section),
            selectinload(ScheduleEntry.room),
            selectinload(ScheduleEntry.time_slot),
            selectinload(ScheduleEntry.instructor)
            .selectinload(Instructor.user),
        )
        .where(
            ScheduleEntry.id == entry_id,
            ScheduleEntry.schedule_id == schedule_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.time_slot_id      = body.time_slot_id
    entry.room_id           = body.room_id
    entry.is_manually_edited = True

    await db.flush()
    await db.refresh(entry)
    return _flatten_entry(entry)


# ── Generation Logs (FitnessChart) ───────────────────────────────

@router.get("/{schedule_id}/logs", response_model=list[GenerationLogResponse])
async def get_generation_logs(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns GA fitness per generation — used by FitnessChart in frontend."""
    result = await db.execute(
        select(AIGenerationLog)
        .where(AIGenerationLog.schedule_id == schedule_id)
        .order_by(AIGenerationLog.generation_number)
    )
    return result.scalars().all()


# ── Helper ───────────────────────────────────────────────────────

def _flatten_entry(e: ScheduleEntry) -> dict:
    """Flatten ScheduleEntry + all joined models into response dict."""
    assignment = e.course_assignment
    course     = assignment.course if assignment else None
    section    = e.section
    room       = e.room
    ts         = e.time_slot
    instructor = e.instructor

    return {
        "id":                   e.id,
        "schedule_id":          e.schedule_id,
        "course_assignment_id": e.course_assignment_id,
        "section_id":           e.section_id,
        "room_id":              e.room_id,
        "time_slot_id":         e.time_slot_id,
        "instructor_id":        e.instructor_id,
        "has_conflict":         e.has_conflict,
        "is_manually_edited":   e.is_manually_edited,
        # Display fields
        "course_code":          course.code          if course     else None,
        "course_name":          course.name          if course     else None,
        "section_name":         section.name         if section    else None,
        "room_code":            room.code            if room       else None,
        "instructor_name":      instructor.user.full_name
                                if instructor and instructor.user else None,
        "day":                  ts.day.value         if ts         else None,
        "start_time": ts.start_time.strftime("%H:%M") if ts else None,
        "end_time":   ts.end_time.strftime("%H:%M")   if ts else None,
        "session_type":         assignment.session_type.value
                                if assignment else None,
    }