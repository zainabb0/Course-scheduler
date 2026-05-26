# ================================================================
#  backend/ai_engine/constraints.py
# ================================================================

from collections import defaultdict
from datetime import datetime, time

from ai_engine.models import ProblemData, ScheduleSlot


# ================================================================
#  HARD CONSTRAINTS
# ================================================================

def hc_no_room_double_booking(slots: list[ScheduleSlot], _: ProblemData) -> int:
    """
    HC-1: A room cannot have two sessions at the same time slot.
    This covers both department rooms AND shared rooms across all departments.
    """
    seen: set[tuple] = set()
    violations = 0
    for s in slots:
        key = (s.room_id, s.time_slot_id)
        if key in seen:
            violations += 1
        else:
            seen.add(key)
    return violations


def hc_no_instructor_double_booking(slots: list[ScheduleSlot], _: ProblemData) -> int:
    """
    HC-2: An instructor cannot teach two sessions at the same time slot.
    """
    seen: set[tuple] = set()
    violations = 0
    for s in slots:
        key = (s.instructor_id, s.time_slot_id)
        if key in seen:
            violations += 1
        else:
            seen.add(key)
    return violations


def hc_no_section_double_booking(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-3: A section cannot have two sessions at the same time slot.
    """
    session_to_section = {s.id: s.section_id for s in data.sessions}
    seen: set[tuple] = set()
    violations = 0
    for slot in slots:
        section_id = session_to_section.get(slot.session_id)
        if not section_id:
            continue
        key = (section_id, slot.time_slot_id)
        if key in seen:
            violations += 1
        else:
            seen.add(key)
    return violations


def hc_instructor_availability(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-4: Sessions must not be placed in an instructor's blocked slots.
    """
    violations = 0
    for slot in slots:
        instructor = data.instructors.get(slot.instructor_id)
        if not instructor:
            continue
        if (slot.day, slot.start_time) in instructor.blocked_slots:
            violations += 1
    return violations


def hc_room_type_match(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-5: Lecture sessions go to lecture/both rooms.
           Lab sessions go to lab/both rooms.
    """
    session_map = {s.id: s for s in data.sessions}
    room_map    = {r.id: r for r in data.rooms}
    violations  = 0

    for slot in slots:
        session = session_map.get(slot.session_id)
        room    = room_map.get(slot.room_id)
        if not session or not room:
            continue

        if session.required_room_type == "lecture":
            if room.room_type not in ("lecture", "both"):
                violations += 1
        elif session.required_room_type == "lab":
            if room.room_type not in ("lab", "both"):
                violations += 1
    return violations


def hc_room_capacity(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-6: Room capacity must be >= section student count.
    """
    session_map = {s.id: s for s in data.sessions}
    room_map    = {r.id: r for r in data.rooms}
    violations  = 0

    for slot in slots:
        session = session_map.get(slot.session_id)
        room    = room_map.get(slot.room_id)
        if not session or not room:
            continue
        if room.capacity < session.student_count:
            violations += 1
    return violations


def hc_shared_room_conflicts(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-7: A shared room cannot be assigned if it is already booked in another completed schedule.
    """
    blocked = getattr(data, 'blocked_room_slots', set())
    violations = 0
    for slot in slots:
        if (slot.room_id, slot.time_slot_id) in blocked:
            violations += 1
    return violations


def hc_same_year_no_overlap(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    HC-7: Sessions for the same study year must not overlap in the same time slot.
    """
    session_map = {s.id: s for s in data.sessions}
    seen: set[tuple] = set()
    violations = 0

    for slot in slots:
        session = session_map.get(slot.session_id)
        if not session:
            continue
        key = (session.study_year_id, slot.time_slot_id)
        if key in seen:
            violations += 1
        else:
            seen.add(key)
    return violations


# ================================================================
#  SOFT CONSTRAINTS
# ================================================================

def sc_instructor_preferred_time(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    SC-1: Sessions should match instructor's preferred time.
    """
    penalty = 0
    noon = time(12, 0)
    for slot in slots:
        instructor = data.instructors.get(slot.instructor_id)
        if not instructor or instructor.preferred_time == "no_preference":
            continue
        is_morning = slot.start_time < noon
        if instructor.preferred_time == "morning" and not is_morning:
            penalty += 1
        elif instructor.preferred_time == "afternoon" and is_morning:
            penalty += 1
    return penalty


def sc_instructor_days_off(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    SC-2: Sessions should not be placed on instructor's preferred days off.
    """
    penalty = 0
    for slot in slots:
        instructor = data.instructors.get(slot.instructor_id)
        if not instructor:
            continue
        if slot.day in instructor.preferred_days_off:
            penalty += 1
    return penalty


def sc_no_consecutive_overload(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    SC-3: Instructor should not have more than max_consecutive_hrs back-to-back.
    """
    slot_num_map = {s.id: (s.day, s.slot_number) for s in data.slots}
    by_instructor_day: dict[tuple, list[int]] = defaultdict(list)
    for slot in slots:
        instructor = data.instructors.get(slot.instructor_id)
        if not instructor:
            continue
        day_slot = slot_num_map.get(slot.time_slot_id)
        if not day_slot:
            continue
        day, slot_num = day_slot
        by_instructor_day[(slot.instructor_id, day)].append(slot_num)

    penalty = 0
    for (inst_id, _), slot_nums in by_instructor_day.items():
        instructor = data.instructors[inst_id]
        sorted_nums = sorted(slot_nums)
        run = 1
        for i in range(1, len(sorted_nums)):
            if sorted_nums[i] == sorted_nums[i-1] + 1:
                run += 1
                max_slots = instructor.max_consecutive_hrs / 1.5
                if run > max_slots:
                    penalty += 1
            else:
                run = 1
    return penalty


def sc_spread_sessions(slots: list[ScheduleSlot], data: ProblemData) -> int:
    """
    SC-4: Sessions for the same course should be spread across different days.
    """
    session_map = {s.id: s for s in data.sessions}
    course_days: dict[str, set] = defaultdict(set)
    course_slots: dict[str, int] = defaultdict(int)

    for slot in slots:
        session = session_map.get(slot.session_id)
        if not session:
            continue
        course_days[session.course_id].add(slot.day)
        course_slots[session.course_id] += 1

    penalty = 0
    for course_id, count in course_slots.items():
        days_used = len(course_days[course_id])
        if count > 1 and days_used == 1:
            penalty += count - 1
    return penalty


# ================================================================
#  AGGREGATE FUNCTIONS
# ================================================================

HARD_CONSTRAINTS = [
    hc_no_room_double_booking,        # HC-1: covers shared rooms too
    hc_no_instructor_double_booking,  # HC-2
    hc_no_section_double_booking,     # HC-3
    hc_instructor_availability,       # HC-4
    hc_room_type_match,               # HC-5
    hc_room_capacity,                 # HC-6
    hc_shared_room_conflicts,         # HC-7
    hc_same_year_no_overlap,          # HC-8
]

SOFT_CONSTRAINTS = [
    sc_instructor_preferred_time,
    sc_instructor_days_off,
    sc_no_consecutive_overload,
    sc_spread_sessions,
]


def count_hard_violations(slots: list[ScheduleSlot], data: ProblemData) -> int:
    return sum(fn(slots, data) for fn in HARD_CONSTRAINTS)


def count_soft_violations(slots: list[ScheduleSlot], data: ProblemData) -> dict[str, int]:
    return {
        fn.__name__: fn(slots, data)
        for fn in SOFT_CONSTRAINTS
    }