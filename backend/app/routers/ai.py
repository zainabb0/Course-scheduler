# ================================================================
#  backend/app/routers/ai.py
#
#  POST /ai/generate          → creates schedule row + starts BackgroundTask
#  GET  /ai/status/{id}       → polling endpoint (frontend polls every 2s)
#  GET  /ai/time-slots        → returns all time slots (for the timetable grid)
# ================================================================

import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.database import get_db, AsyncSessionLocal
from app.models.department import Department
from app.models.schedule import Schedule, ScheduleStatus
from app.models.time_slot import TimeSlot
from app.schemas.schedule import (
    AIGenerateRequest, AIStatusResponse, ScheduleResponse,
)
from ai_engine.scheduler import run_full_pipeline
from ai_engine.genetic_algorithm import GAConfig, GenerationResult
from ai_engine.fitness import FitnessWeights

router = APIRouter()

# In-memory progress store — maps schedule_id → latest GenerationResult
# (Simple approach; use Redis in production for multi-worker setups)
_progress_store: dict[str, GenerationResult] = {}


# ── POST /ai/generate ────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=ScheduleResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_schedule(
    body: AIGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Start AI schedule generation as a background task.

    Returns immediately with the schedule row (status=pending).
    Frontend polls GET /ai/status/{id} to track progress.
    """
    # Validate department exists before creating the schedule row
    result = await db.execute(
        select(Department).where(Department.id == body.department_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    schedule = Schedule(
        department_id=body.department_id,
        academic_year=body.academic_year,
        semester=body.semester,
        name=body.name or f"Schedule {body.academic_year} {body.semester}",
        status=ScheduleStatus.pending,
        generations=body.generations,
        population_size=body.population_size,
        mutation_rate=body.mutation_rate,
        crossover_rate=body.crossover_rate,
    )
    db.add(schedule)
    await db.flush()
    await db.refresh(schedule)
    schedule_id = schedule.id
    await db.commit()

    # Build GA config + weights from request
    ga_config = GAConfig(
        generations=body.generations,
        population_size=body.population_size,
        mutation_rate=body.mutation_rate,
        crossover_rate=body.crossover_rate,
    )
    weights = FitnessWeights(
        preferred_time=body.weight_preferred_time,
        days_off=body.weight_days_off,
        consecutive_overload=body.weight_consecutive_overload,
        spread_sessions=body.weight_spread_sessions,
    )

    # Progress callback — updates in-memory store
    def on_progress(result: GenerationResult):
        _progress_store[schedule_id] = result

    # Launch background task
    background_tasks.add_task(
        _run_pipeline_task,
        schedule_id=schedule_id,
        ga_config=ga_config,
        weights=weights,
        on_progress=on_progress,
    )

    return schedule


async def _run_pipeline_task(
    schedule_id: str,
    ga_config: GAConfig,
    weights: FitnessWeights,
    on_progress,
):
    """
    Wrapper that creates its own DB session for the background task.
    (FastAPI's request-scoped session is closed by the time this runs.)
    """
    async with AsyncSessionLocal() as db:
        await run_full_pipeline(
            schedule_id=schedule_id,
            db=db,
            ga_config=ga_config,
            weights=weights,
            on_progress=on_progress,
        )
    # Cleanup progress store after completion
    _progress_store.pop(schedule_id, None)


# ── GET /ai/status/{id} ──────────────────────────────────────────

@router.get("/status/{schedule_id}", response_model=AIStatusResponse)
async def get_ai_status(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Polling endpoint — frontend calls this every 2 seconds.

    Returns:
    - status:        pending | running | completed | failed
    - progress_pct:  0–100 based on current_gen / total_gen
    - best_fitness:  latest fitness score
    - hard_violations: current violation count
    """
    result = await db.execute(
        select(Schedule).where(Schedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Get latest progress from in-memory store
    latest = _progress_store.get(schedule_id)

    if schedule.status == ScheduleStatus.completed:
        return AIStatusResponse(
            schedule_id=schedule_id,
            status=ScheduleStatus.completed,
            progress_pct=100,
            current_gen=schedule.generations,
            total_gen=schedule.generations,
            best_fitness=schedule.fitness_score,
            hard_violations=schedule.conflicts_count,
            message=f"Done! Fitness: {schedule.fitness_score:.1f}, "
                    f"Violations: {schedule.conflicts_count}",
        )

    if schedule.status == ScheduleStatus.failed:
        return AIStatusResponse(
            schedule_id=schedule_id,
            status=ScheduleStatus.failed,
            progress_pct=0,
            current_gen=0,
            total_gen=schedule.generations,
            best_fitness=None,
            hard_violations=None,
            message="Generation failed — check server logs",
        )

    if latest:
        progress_pct = int((latest.generation / schedule.generations) * 100)
        return AIStatusResponse(
            schedule_id=schedule_id,
            status=ScheduleStatus.running,
            progress_pct=min(progress_pct, 99),  # 100 only when completed
            current_gen=latest.generation,
            total_gen=schedule.generations,
            best_fitness=latest.best_fitness,
            hard_violations=latest.hard_violations,
            message=f"Generation {latest.generation}/{schedule.generations} — "
                    f"Fitness: {latest.best_fitness:.1f}",
        )

    # pending or just started
    return AIStatusResponse(
        schedule_id=schedule_id,
        status=schedule.status,
        progress_pct=0,
        current_gen=0,
        total_gen=schedule.generations,
        best_fitness=None,
        hard_violations=None,
        message="Waiting to start..." if schedule.status == ScheduleStatus.pending
                else "Starting...",
    )


# ── GET /ai/time-slots ───────────────────────────────────────────

@router.get("/time-slots")
async def get_time_slots(db: AsyncSession = Depends(get_db)):
    """
    Returns all time slots ordered by day + slot_number.
    Used by the frontend to build the weekly timetable grid.
    """
    result = await db.execute(
        select(TimeSlot)
        .order_by(TimeSlot.day, TimeSlot.slot_number)
    )
    slots = result.scalars().all()
    return [
        {
            "id":          s.id,
            "day":         s.day.value,
            "start_time":  s.start_time,
            "end_time":    s.end_time,
            "slot_number": s.slot_number,
            "is_break":    s.is_break,
        }
        for s in slots
    ]