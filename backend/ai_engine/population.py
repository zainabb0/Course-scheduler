# ================================================================
#  backend/ai_engine/population.py
#
#  Chromosome Encoding + Initial Population Generation
#
#  Chromosome = list[ScheduleSlot]
#    One ScheduleSlot per session → assigns it to a (time_slot, room)
#    Length = number of sessions in ProblemData
#
#  Population = list[Chromosome]
#    A set of candidate schedules that the GA will evolve.
# ================================================================

import random
import logging
from copy import deepcopy

from ai_engine.models import ProblemData, ScheduleSlot, SessionData
from ai_engine.utils import random_slot_room, get_available_slots, get_compatible_rooms
from ai_engine.fitness import calculate_fitness, FitnessWeights

logger = logging.getLogger(__name__)

# Type alias for clarity
Chromosome = list[ScheduleSlot]


# ── Chromosome Generation ─────────────────────────────────────────

def generate_chromosome(
    data: ProblemData,
    seed: Chromosome | None = None,
) -> Chromosome:
    """
    Generate one random-ish chromosome (candidate schedule).

    If seed is provided (from CSP), start from it and only randomize
    the unassigned sessions. This gives the GA a strong starting point.

    Args:
        data : full problem data
        seed : optional CSP solution to build upon

    Returns:
        Chromosome — one ScheduleSlot per session (some may be missing
        if no valid slot was found for a session)
    """
    chromosome: Chromosome = []

    # Start from seed if available
    if seed:
        chromosome = deepcopy(seed)
        assigned_session_ids = {s.session_id for s in chromosome}
        remaining = [s for s in data.sessions if s.id not in assigned_session_ids]
    else:
        remaining = list(data.sessions)

    # Shuffle to get variety between chromosomes
    random.shuffle(remaining)

    for session in remaining:
        slot = random_slot_room(session, data, chromosome)
        if slot:
            chromosome.append(slot)
        # If no valid slot found, session is left unassigned (penalized by fitness)

    return chromosome


def generate_population(
    size: int,
    data: ProblemData,
    seed: Chromosome | None = None,
) -> list[Chromosome]:
    """
    Generate initial population of `size` chromosomes.

    Strategy:
    - Chromosome 0: exact CSP seed (if available)
    - Chromosomes 1-9: slight mutations of the seed
    - Remaining: fully random
    This mix gives diversity while leveraging the CSP solution.

    Args:
        size : population size (e.g. 50)
        data : problem data
        seed : optional CSP solution

    Returns:
        list of Chromosome
    """
    population: list[Chromosome] = []

    # Include the CSP seed as-is (best known starting point)
    if seed:
        population.append(deepcopy(seed))

    # Fill the rest
    while len(population) < size:
        # First 20% use seed as base, rest are fully random
        use_seed = seed and len(population) < max(1, size // 5)
        chrom = generate_chromosome(data, seed=seed if use_seed else None)
        population.append(chrom)

    logger.debug(f"Population generated: {len(population)} chromosomes")
    return population


# ── Chromosome Operations ─────────────────────────────────────────

def get_session_slot(chromosome: Chromosome, session_id: str) -> ScheduleSlot | None:
    """Find the ScheduleSlot for a given session in a chromosome."""
    for slot in chromosome:
        if slot.session_id == session_id:
            return slot
    return None


def chromosome_to_dict(chromosome: Chromosome) -> dict[str, ScheduleSlot]:
    """Convert chromosome list to dict keyed by session_id for fast lookup."""
    return {s.session_id: s for s in chromosome}


def repair_chromosome(chromosome: Chromosome, data: ProblemData) -> Chromosome:
    """
    Try to fix a chromosome by re-assigning sessions that cause
    hard constraint violations.
    Used after crossover to fix broken chromosomes quickly.
    """
    from ai_engine.constraints import (
        hc_no_room_double_booking,
        hc_no_instructor_double_booking,
        hc_no_section_double_booking,
        hc_same_year_no_overlap,
    )

    # Find conflicting sessions
    slot_room_seen:     dict[tuple, str] = {}
    slot_inst_seen:     dict[tuple, str] = {}
    slot_sec_seen:      dict[tuple, str] = {}
    slot_year_seen:     dict[tuple, str] = {}
    session_to_section = {s.id: s.section_id for s in data.sessions}
    session_to_year    = {s.id: s.study_year_id for s in data.sessions}

    bad_session_ids: set[str] = set()

    for slot in chromosome:
        room_key = (slot.room_id,       slot.time_slot_id)
        inst_key = (slot.instructor_id, slot.time_slot_id)
        sec_id   = session_to_section.get(slot.session_id, "")
        year_id  = session_to_year.get(slot.session_id, "")
        sec_key  = (sec_id,  slot.time_slot_id)
        year_key = (year_id, slot.time_slot_id)

        if room_key in slot_room_seen:
            bad_session_ids.add(slot.session_id)
            bad_session_ids.add(slot_room_seen[room_key])
        else:
            slot_room_seen[room_key] = slot.session_id

        if inst_key in slot_inst_seen:
            bad_session_ids.add(slot.session_id)
            bad_session_ids.add(slot_inst_seen[inst_key])
        else:
            slot_inst_seen[inst_key] = slot.session_id

        if sec_key in slot_sec_seen:
            bad_session_ids.add(slot.session_id)
            bad_session_ids.add(slot_sec_seen[sec_key])
        else:
            slot_sec_seen[sec_key] = slot.session_id

        if year_key in slot_year_seen:
            bad_session_ids.add(slot.session_id)
            bad_session_ids.add(slot_year_seen[year_key])
        else:
            slot_year_seen[year_key] = slot.session_id

    if not bad_session_ids:
        return chromosome  # no conflicts

    # Remove bad slots and try to re-assign
    repaired = [s for s in chromosome if s.session_id not in bad_session_ids]

    for session in data.sessions:
        if session.id not in bad_session_ids:
            continue
        new_slot = random_slot_room(session, data, repaired)
        if new_slot:
            repaired.append(new_slot)

    return repaired