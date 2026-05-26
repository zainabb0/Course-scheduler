# ================================================================
#  backend/tests/test_csp.py
#  Run: pytest tests/test_csp.py -v
# ================================================================

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai_engine.models import (
    ProblemData, SessionData, SlotData, RoomData,
    InstructorData, ScheduleSlot,
)
from ai_engine.constraints import (
    hc_no_room_double_booking,
    hc_no_instructor_double_booking,
    hc_no_section_double_booking,
    hc_instructor_availability,
    hc_room_type_match,
    hc_room_capacity,
    hc_same_year_no_overlap,
    sc_instructor_preferred_time,
    sc_instructor_days_off,
    count_hard_violations,
)
from ai_engine.csp_solver import CSPSolver


# ── Fixtures ─────────────────────────────────────────────────────

def make_slot(id, day="sunday", start="08:00", end="09:30", num=1):
    return SlotData(id=id, day=day, start_time=start, end_time=end, slot_number=num)

def make_room(id, rtype="lecture", capacity=50, code="R1"):
    return RoomData(id=id, code=code, capacity=capacity, room_type=rtype, has_computers=False)

def make_instructor(id, blocked=None, preferred_time="no_preference", days_off=None):
    return InstructorData(
        id=id, name=f"Instructor {id}",
        max_hours_week=20,
        blocked_slots=set(blocked or []),
        preferred_time=preferred_time,
        preferred_days_off=days_off or [],
    )

def make_session(id, inst_id, section_id, year_id, rtype="lecture", students=30):
    return SessionData(
        id=id, assignment_id=f"a_{id}", section_id=section_id,
        course_id="c1", course_code="CS101", course_name="Intro",
        instructor_id=inst_id, session_type="lecture",
        study_year_id=year_id, student_count=students,
        hours_per_week=2, required_room_type=rtype,
    )

def make_assigned_slot(session_id, slot_id, room_id, instructor_id,
                        day="sunday", start="08:00"):
    return ScheduleSlot(
        session_id=session_id, time_slot_id=slot_id,
        room_id=room_id, day=day, start_time=start,
        instructor_id=instructor_id,
    )

def make_empty_data(sessions=None, slots=None, rooms=None, instructors=None):
    return ProblemData(
        schedule_id="s1", academic_year="2024-2025",
        sessions=sessions or [],
        slots=slots or [],
        rooms=rooms or [],
        instructors=instructors or {},
    )


# ── HC-1: Room double booking ─────────────────────────────────────

class TestHC1RoomDoubleBooking:
    def test_no_violation(self):
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot2", "room1", "i2"),  # different slot
        ]
        assert hc_no_room_double_booking(slots, None) == 0

    def test_violation(self):
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room1", "i2"),  # same slot + room
        ]
        assert hc_no_room_double_booking(slots, None) == 1

    def test_two_violations(self):
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room1", "i2"),
            make_assigned_slot("s3", "slot1", "room1", "i3"),
        ]
        assert hc_no_room_double_booking(slots, None) == 2


# ── HC-2: Instructor double booking ──────────────────────────────

class TestHC2InstructorDoubleBooking:
    def test_no_violation(self):
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i2"),  # different instructor
        ]
        assert hc_no_instructor_double_booking(slots, None) == 0

    def test_violation(self):
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i1"),  # same instructor same slot
        ]
        assert hc_no_instructor_double_booking(slots, None) == 1


# ── HC-3: Section double booking ─────────────────────────────────

class TestHC3SectionDoubleBooking:
    def test_no_violation(self):
        sessions = [
            make_session("s1", "i1", "sec_A", "y1"),
            make_session("s2", "i2", "sec_B", "y1"),
        ]
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i2"),  # different section
        ]
        data = make_empty_data(sessions=sessions)
        assert hc_no_section_double_booking(slots, data) == 0

    def test_violation(self):
        sessions = [
            make_session("s1", "i1", "sec_A", "y1"),
            make_session("s2", "i2", "sec_A", "y1"),  # same section
        ]
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i2"),
        ]
        data = make_empty_data(sessions=sessions)
        assert hc_no_section_double_booking(slots, data) == 1


# ── HC-4: Instructor availability ────────────────────────────────

class TestHC4InstructorAvailability:
    def test_no_violation(self):
        instructor = make_instructor("i1", blocked={("monday", "08:00")})
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1",
                                    day="sunday", start="08:00")]
        assert hc_instructor_availability(slots, data) == 0

    def test_violation(self):
        instructor = make_instructor("i1", blocked={("sunday", "08:00")})
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1",
                                    day="sunday", start="08:00")]
        assert hc_instructor_availability(slots, data) == 1


# ── HC-5: Room type match ─────────────────────────────────────────

class TestHC5RoomTypeMatch:
    def test_lecture_in_lecture_room_ok(self):
        sessions = [make_session("s1", "i1", "sec1", "y1", rtype="lecture")]
        rooms = [make_room("room1", rtype="lecture")]
        data = make_empty_data(sessions=sessions, rooms=rooms)
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1")]
        assert hc_room_type_match(slots, data) == 0

    def test_lecture_in_lab_room_violation(self):
        sessions = [make_session("s1", "i1", "sec1", "y1", rtype="lecture")]
        rooms = [make_room("room1", rtype="lab")]
        data = make_empty_data(sessions=sessions, rooms=rooms)
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1")]
        assert hc_room_type_match(slots, data) == 1

    def test_lab_in_both_room_ok(self):
        sessions = [make_session("s1", "i1", "sec1", "y1", rtype="lab")]
        rooms = [make_room("room1", rtype="both")]
        data = make_empty_data(sessions=sessions, rooms=rooms)
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1")]
        assert hc_room_type_match(slots, data) == 0


# ── HC-6: Room capacity ───────────────────────────────────────────

class TestHC6RoomCapacity:
    def test_ok(self):
        sessions = [make_session("s1", "i1", "sec1", "y1", students=30)]
        rooms = [make_room("room1", capacity=50)]
        data = make_empty_data(sessions=sessions, rooms=rooms)
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1")]
        assert hc_room_capacity(slots, data) == 0

    def test_violation(self):
        sessions = [make_session("s1", "i1", "sec1", "y1", students=60)]
        rooms = [make_room("room1", capacity=40)]
        data = make_empty_data(sessions=sessions, rooms=rooms)
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1")]
        assert hc_room_capacity(slots, data) == 1


# ── HC-7: Same year overlap ───────────────────────────────────────

class TestHC7SameYearOverlap:
    def test_no_violation_different_years(self):
        sessions = [
            make_session("s1", "i1", "sec1", "y1"),
            make_session("s2", "i2", "sec2", "y2"),  # different year
        ]
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i2"),
        ]
        data = make_empty_data(sessions=sessions)
        assert hc_same_year_no_overlap(slots, data) == 0

    def test_violation_same_year(self):
        sessions = [
            make_session("s1", "i1", "sec1", "y1"),
            make_session("s2", "i2", "sec2", "y1"),  # same year
        ]
        slots = [
            make_assigned_slot("s1", "slot1", "room1", "i1"),
            make_assigned_slot("s2", "slot1", "room2", "i2"),
        ]
        data = make_empty_data(sessions=sessions)
        assert hc_same_year_no_overlap(slots, data) == 1


# ── SC-1: Preferred time ──────────────────────────────────────────

class TestSC1PreferredTime:
    def test_morning_ok(self):
        instructor = make_instructor("i1", preferred_time="morning")
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1",
                                    start="08:00")]  # morning
        assert sc_instructor_preferred_time(slots, data) == 0

    def test_morning_violated(self):
        instructor = make_instructor("i1", preferred_time="morning")
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1",
                                    start="13:00")]  # afternoon
        assert sc_instructor_preferred_time(slots, data) == 1

    def test_no_preference_no_penalty(self):
        instructor = make_instructor("i1", preferred_time="no_preference")
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1",
                                    start="13:00")]
        assert sc_instructor_preferred_time(slots, data) == 0


# ── SC-2: Days off ────────────────────────────────────────────────

class TestSC2DaysOff:
    def test_no_penalty(self):
        instructor = make_instructor("i1", days_off=["thursday"])
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1", day="sunday")]
        assert sc_instructor_days_off(slots, data) == 0

    def test_penalty(self):
        instructor = make_instructor("i1", days_off=["thursday"])
        data = make_empty_data(instructors={"i1": instructor})
        slots = [make_assigned_slot("s1", "slot1", "room1", "i1", day="thursday")]
        assert sc_instructor_days_off(slots, data) == 1


# ── count_hard_violations (aggregate) ────────────────────────────

class TestCountHardViolations:
    def test_zero_violations_clean_schedule(self):
        sessions = [
            make_session("s1", "i1", "sec1", "y1"),
            make_session("s2", "i2", "sec2", "y2"),
        ]
        slots_data = [
            make_slot("slot1", day="sunday", start="08:00", num=1),
            make_slot("slot2", day="sunday", start="09:30", num=2),
        ]
        rooms = [
            make_room("room1", capacity=50),
            make_room("room2", capacity=50),
        ]
        instructors = {
            "i1": make_instructor("i1"),
            "i2": make_instructor("i2"),
        }
        data = make_empty_data(sessions=sessions, slots=slots_data,
                               rooms=rooms, instructors=instructors)
        assigned = [
            make_assigned_slot("s1", "slot1", "room1", "i1", day="sunday", start="08:00"),
            make_assigned_slot("s2", "slot2", "room2", "i2", day="sunday", start="09:30"),
        ]
        assert count_hard_violations(assigned, data) == 0


# ── CSP Solver ────────────────────────────────────────────────────

class TestCSPSolver:
    def _make_simple_problem(self):
        """2 sessions, 2 slots, 2 rooms — should solve easily."""
        sessions = [
            make_session("s1", "i1", "sec1", "y1"),
            make_session("s2", "i2", "sec2", "y2"),
        ]
        slots = [
            make_slot("slot1", day="sunday",  start="08:00", end="09:30", num=1),
            make_slot("slot2", day="sunday",  start="09:30", end="11:00", num=2),
            make_slot("slot3", day="monday",  start="08:00", end="09:30", num=1),
        ]
        rooms = [
            make_room("room1", rtype="lecture", capacity=50, code="A"),
            make_room("room2", rtype="lecture", capacity=50, code="B"),
        ]
        instructors = {
            "i1": make_instructor("i1"),
            "i2": make_instructor("i2"),
        }
        return ProblemData(
            schedule_id="test", academic_year="2024-2025",
            sessions=sessions, slots=slots,
            rooms=rooms, instructors=instructors,
        )

    def test_solves_simple_problem(self):
        data = self._make_simple_problem()
        solver = CSPSolver(data)
        schedule, is_complete = solver.solve()

        assert is_complete is True
        assert len(schedule) == 2
        assert count_hard_violations(schedule, data) == 0

    def test_no_room_conflicts_in_solution(self):
        data = self._make_simple_problem()
        solver = CSPSolver(data)
        schedule, _ = solver.solve()

        # No two sessions in same room at same time
        pairs = [(s.room_id, s.time_slot_id) for s in schedule]
        assert len(pairs) == len(set(pairs))

    def test_no_instructor_conflicts_in_solution(self):
        data = self._make_simple_problem()
        solver = CSPSolver(data)
        schedule, _ = solver.solve()

        pairs = [(s.instructor_id, s.time_slot_id) for s in schedule]
        assert len(pairs) == len(set(pairs))

    def test_impossible_problem_returns_empty(self):
        """1 session, 1 slot, 1 room — instructor has that slot blocked."""
        sessions = [make_session("s1", "i1", "sec1", "y1")]
        slots    = [make_slot("slot1", day="sunday", start="08:00")]
        rooms    = [make_room("room1")]
        instructors = {
            "i1": make_instructor("i1", blocked={("sunday", "08:00")})
        }
        data = ProblemData(
            schedule_id="test", academic_year="2024-2025",
            sessions=sessions, slots=slots,
            rooms=rooms, instructors=instructors,
        )
        solver = CSPSolver(data, max_backtracks=10)
        schedule, is_complete = solver.solve()
        assert is_complete is False