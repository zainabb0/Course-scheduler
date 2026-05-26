# ================================================================
#  backend/ai_engine/utils.py
#  Helper functions used by both CSP and GA
# ================================================================

import random
from ai_engine.models import (
    ProblemData, SessionData, SlotData, RoomData, ScheduleSlot
)


def get_compatible_rooms(session: SessionData, rooms: list[RoomData]) -> list[RoomData]:
    """
    Returns rooms that match the session's required room type
    and have enough capacity.
    """
    compatible = []
    for room in rooms:
        # Type check
        if session.required_room_type == "lecture":
            if room.room_type not in ("lecture", "both"):
                continue
        elif session.required_room_type == "lab":
            if room.room_type not in ("lab", "both"):
                continue
        # Capacity check
        if room.capacity < session.student_count:
            continue
        compatible.append(room)
    return compatible


def get_available_slots(
    session: SessionData,
    all_slots: list[SlotData],
    data: ProblemData,
) -> list[SlotData]:
    """
    Returns time slots where the instructor is available (not blocked).
    """
    instructor = data.instructors.get(session.instructor_id)
    if not instructor:
        return all_slots

    available = []
    for slot in all_slots:
        if (slot.day, slot.start_time) not in instructor.blocked_slots:
            available.append(slot)
    return available


def is_slot_free(
    slot_id: str,
    room_id: str,
    instructor_id: str,
    section_id: str,
    study_year_id: str,
    assigned: list[ScheduleSlot],
    data: ProblemData,
) -> bool:
    """
    Quick Hard-Constraint check before assigning a slot.
    Returns True if this (slot, room) combination is conflict-free.
    """
    session_to_section = {s.id: s.section_id for s in data.sessions}
    session_to_year    = {s.id: s.study_year_id for s in data.sessions}

    for existing in assigned:
        if existing.time_slot_id != slot_id:
            continue
        # HC-1: Room double booking
        if existing.room_id == room_id:
            return False
        # HC-2: Instructor double booking
        if existing.instructor_id == instructor_id:
            return False
        # HC-3: Section double booking
        if session_to_section.get(existing.session_id) == section_id:
            return False
        # HC-7: Same study year overlap
        if session_to_year.get(existing.session_id) == study_year_id:
            return False
    return True


def random_slot_room(
    session: SessionData,
    data: ProblemData,
    assigned: list[ScheduleSlot],
) -> ScheduleSlot | None:
    """
    Randomly picks a valid (time_slot, room) for a session.
    Returns None if no valid combination found after max tries.
    Used by GA to generate initial population.
    """
    available_slots = get_available_slots(session, data.slots, data)
    compatible_rooms = get_compatible_rooms(session, data.rooms)

    if not available_slots or not compatible_rooms:
        return None

    # Shuffle for randomness
    slots_shuffled = available_slots.copy()
    rooms_shuffled = compatible_rooms.copy()
    random.shuffle(slots_shuffled)
    random.shuffle(rooms_shuffled)

    for slot in slots_shuffled:
        for room in rooms_shuffled:
            if is_slot_free(
                slot.id, room.id,
                session.instructor_id,
                # We need section_id from the session
                session.section_id,
                session.study_year_id,
                assigned,
                data,
            ):
                # Build slot object with day info
                return ScheduleSlot(
                    session_id=session.id,
                    time_slot_id=slot.id,
                    room_id=room.id,
                    day=slot.day,
                    start_time=slot.start_time,
                    instructor_id=session.instructor_id,
                )
    return None


def slots_to_dict(schedule: list[ScheduleSlot]) -> dict[str, ScheduleSlot]:
    """Convert list of ScheduleSlot to dict keyed by session_id."""
    return {s.session_id: s for s in schedule}