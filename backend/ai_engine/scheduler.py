# ================================================================
#  backend/ai_engine/scheduler.py
# ================================================================

import logging
import time
from typing import Callable

from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ai_engine.models import (
    ProblemData, SessionData, SlotData, RoomData,
    InstructorData, ScheduleSlot,
)
from ai_engine.csp_solver import CSPSolver
from ai_engine.genetic_algorithm import GeneticAlgorithm, GAConfig, GenerationResult
from ai_engine.fitness import FitnessWeights, fitness_breakdown
from ai_engine.constraints import count_hard_violations
from app.models.user import User
from app.models.schedule import Schedule, ScheduleStatus
from app.models.schedule_entry import ScheduleEntry
from app.models.ai_log import AIGenerationLog
from app.models.course_assignment import CourseAssignment, SessionType
from app.models.section import Section
from app.models.time_slot import TimeSlot
from app.models.room import Room
from app.models.instructor import Instructor, InstructorAvailability
from app.models.course import Course

logger = logging.getLogger(__name__)


# ================================================================
#  STEP 1 — Load Problem Data from DB
# ================================================================

async def load_problem_data(
    schedule: Schedule,
    db: AsyncSession,
) -> ProblemData:

    # ── Time slots ───────────────────────────────────────────────
    slots_result = await db.execute(
        select(TimeSlot)
        .where(TimeSlot.is_break == False)
        .order_by(TimeSlot.day, TimeSlot.slot_number)
    )
    slots = [
        SlotData(
            id=ts.id,
            day=ts.day.value,
            start_time=ts.start_time,
            end_time=ts.end_time,
            slot_number=ts.slot_number,
        )
        for ts in slots_result.scalars().all()
    ]

    # ── Rooms — department rooms + shared rooms ──────────────────
    rooms_result = await db.execute(
        select(Room)
        .where(
            or_(
                Room.department_id == schedule.department_id,
                Room.is_shared == True,
            ),
            Room.is_active == True,
        )
    )
    rooms = [
        RoomData(
            id=r.id,
            code=r.code,
            capacity=r.capacity,
            room_type=r.room_type.value,
            has_computers=r.has_computers,
            is_shared=r.is_shared,
        )
        for r in rooms_result.scalars().all()
    ]

    # ── Already-booked shared room slots from other completed schedules ─
    blocked_result = await db.execute(
        select(ScheduleEntry.room_id, ScheduleEntry.time_slot_id)
        .join(Schedule)
        .join(Room)
        .where(
            Schedule.id != schedule.id,
            Schedule.academic_year == schedule.academic_year,
            Schedule.semester == schedule.semester,
            Schedule.status == ScheduleStatus.completed,
            Room.is_shared == True,
        )
    )
    blocked_room_slots = {
        (room_id, time_slot_id)
        for room_id, time_slot_id in blocked_result.all()
    }

    # ── Instructors + Availability ────────────────────────────────
    instr_result = await db.execute(
        select(Instructor)
        .options(
            selectinload(Instructor.user),
            selectinload(Instructor.preferences),
            selectinload(Instructor.availability),
        )
        .join(Instructor.user)
        .where(User.is_active == True)
    )
    instructors: dict[str, InstructorData] = {}
    for inst in instr_result.scalars().all():
        blocked = {
            (av.day.value, av.start_time)
            for av in inst.availability
            if not av.is_available
        }
        prefs = inst.preferences
        instructors[inst.id] = InstructorData(
            id=inst.id,
            name=inst.user.full_name,
            max_hours_week=inst.max_hours_week,
            blocked_slots=blocked,
            preferred_time=prefs.preferred_time.value if prefs else "no_preference",
            preferred_days_off=[d for d in (prefs.preferred_days_off or [])] if prefs else [],
            max_consecutive_hrs=prefs.max_consecutive_hrs if prefs else 3,
        )

    # ── Course Assignments → Sessions ────────────────────────────
    assign_result = await db.execute(
        select(CourseAssignment)
        .options(
            selectinload(CourseAssignment.course),
            selectinload(CourseAssignment.instructor),
        )
        .where(CourseAssignment.academic_year == schedule.academic_year)
    )
    assignments = assign_result.scalars().all()

    sessions: list[SessionData] = []
    for assignment in assignments:
        course = assignment.course

        sections_result = await db.execute(
            select(Section).where(Section.course_id == course.id)
        )
        course_sections = sections_result.scalars().all()

        if not course_sections:
            continue

        for section in course_sections:
            if assignment.session_type == SessionType.lecture:
                hours = course.lecture_hours_week
                required_room_type = "lecture"
            else:
                hours = course.lab_hours_week
                required_room_type = "lab"

            if hours == 0:
                continue

            session_id = f"{assignment.id}_{section.id}"
            sessions.append(
                SessionData(
                    id=session_id,
                    assignment_id=assignment.id,
                    section_id=section.id,
                    course_id=course.id,
                    course_code=course.code,
                    course_name=course.name,
                    instructor_id=assignment.instructor_id,
                    session_type=assignment.session_type.value,
                    study_year_id=section.study_year_id,
                    student_count=section.student_count,
                    hours_per_week=hours,
                    required_room_type=required_room_type,
                )
            )

    logger.info(
        f"ProblemData loaded: {len(sessions)} sessions, "
        f"{len(slots)} slots, {len(rooms)} rooms ({sum(1 for r in rooms if r.is_shared)} shared), "
        f"{len(instructors)} instructors"
    )

    return ProblemData(
        schedule_id=schedule.id,
        academic_year=schedule.academic_year,
        sessions=sessions,
        slots=slots,
        rooms=rooms,
        instructors=instructors,
        blocked_room_slots=blocked_room_slots,
    )


# ================================================================
#  STEP 2 — Run CSP + GA
# ================================================================

def run_scheduler(
    data: ProblemData,
    config: GAConfig,
    weights: FitnessWeights,
    on_progress: Callable[[GenerationResult], None] | None = None,
) -> tuple[list[ScheduleSlot], list[GenerationResult], dict]:
    start = time.time()

    logger.info("Phase 1: CSP Solver starting...")
    csp = CSPSolver(data, max_backtracks=3000)
    csp_result, csp_complete = csp.solve()

    if csp_complete:
        logger.info(f"CSP solved completely ({len(csp_result)} sessions)")
    else:
        logger.info(f"CSP partial solution ({len(csp_result)} sessions) — handing to GA")

    logger.info("Phase 2: Genetic Algorithm starting...")
    ga = GeneticAlgorithm(data, config, weights)
    best_schedule, logs = ga.run(
        seed=csp_result if csp_result else None,
        on_progress=on_progress,
    )

    elapsed = time.time() - start
    breakdown = fitness_breakdown(best_schedule, data, weights)
    breakdown["runtime_seconds"] = round(elapsed, 2)

    logger.info(
        f"Scheduler done in {elapsed:.1f}s — "
        f"fitness={breakdown['fitness_score']}, "
        f"violations={breakdown['hard_violations']}, "
        f"coverage={breakdown['coverage_pct']}%"
    )

    return best_schedule, logs, breakdown


# ================================================================
#  STEP 3 — Save Results to DB
# ================================================================

async def save_schedule_entries(
    schedule: Schedule,
    best_slots: list[ScheduleSlot],
    logs: list[GenerationResult],
    breakdown: dict,
    db: AsyncSession,
) -> None:
    schedule.status          = ScheduleStatus.completed
    schedule.fitness_score   = breakdown.get("fitness_score")
    schedule.conflicts_count = breakdown.get("hard_violations")
    schedule.runtime_seconds = breakdown.get("runtime_seconds")

    from sqlalchemy import delete
    await db.execute(
        delete(ScheduleEntry).where(ScheduleEntry.schedule_id == schedule.id)
    )

    assignment_ids = set()
    for slot in best_slots:
        parts = slot.session_id.rsplit("_", 1)
        if len(parts) != 2:
            continue
        assignment_ids.add(parts[0])

    assignments = {}
    if assignment_ids:
        result = await db.execute(
            select(CourseAssignment).where(CourseAssignment.id.in_(assignment_ids))
        )
        assignments = {a.id: a for a in result.scalars().all()}

    for slot in best_slots:
        parts = slot.session_id.rsplit("_", 1)
        if len(parts) != 2:
            continue
        assignment_id, section_id = parts
        assignment = assignments.get(assignment_id)
        if assignment is None:
            logger.warning(f"Missing CourseAssignment for session_id={slot.session_id}; skipping entry")
            continue

        entry = ScheduleEntry(
            schedule_id=schedule.id,
            course_assignment_id=assignment_id,
            section_id=section_id,
            room_id=slot.room_id,
            time_slot_id=slot.time_slot_id,
            instructor_id=slot.instructor_id,
            session_type=assignment.session_type,
            has_conflict=False,
        )
        db.add(entry)

    from sqlalchemy import delete as sa_delete
    await db.execute(
        sa_delete(AIGenerationLog).where(AIGenerationLog.schedule_id == schedule.id)
    )

    for log in logs:
        ai_log = AIGenerationLog(
            schedule_id=schedule.id,
            generation_number=log.generation,
            best_fitness=log.best_fitness,
            avg_fitness=log.avg_fitness,
            conflicts_count=log.hard_violations,
        )
        db.add(ai_log)

    await db.flush()
    logger.info(
        f"Saved {len(best_slots)} schedule entries + "
        f"{len(logs)} generation logs for schedule {schedule.id}"
    )


# ================================================================
#  FULL PIPELINE
# ================================================================

async def run_full_pipeline(
    schedule_id: str,
    db: AsyncSession,
    ga_config: GAConfig | None = None,
    weights: FitnessWeights | None = None,
    on_progress: Callable[[GenerationResult], None] | None = None,
) -> None:
    result = await db.execute(
        select(Schedule).where(Schedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        logger.error(f"Schedule {schedule_id} not found")
        return

    try:
        schedule.status = ScheduleStatus.running
        await db.flush()

        data = await load_problem_data(schedule, db)

        config = ga_config or GAConfig()
        w      = weights or FitnessWeights()
        best, logs, breakdown = run_scheduler(data, config, w, on_progress)

        await save_schedule_entries(schedule, best, logs, breakdown, db)
        await db.commit()

    except Exception as e:
        logger.error(f"Pipeline failed for schedule {schedule_id}: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            logger.warning("Rollback failed after pipeline error", exc_info=True)

        result = await db.execute(
            select(Schedule).where(Schedule.id == schedule_id)
        )
        failed_schedule = result.scalar_one_or_none()
        if failed_schedule is not None:
            failed_schedule.status = ScheduleStatus.failed
            await db.commit()
        return