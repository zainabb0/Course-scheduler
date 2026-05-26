# ================================================================
#  backend/ai_engine/csp_solver.py
#
#  CSP (Constraint Satisfaction Problem) Solver
#  Algorithm: Backtracking Search + Forward Checking
#
#  Role in the pipeline:
#    1. CSP tries to find a VALID initial schedule (0 hard violations)
#    2. If successful → passes it to GA as the seed chromosome
#    3. If CSP can't solve completely → GA starts from partial solution
#
#  Variables  : sessions (each needs a time_slot + room)
#  Domains    : all valid (time_slot, room) pairs per session
#  Constraints: all 7 Hard Constraints
# ================================================================

import logging
from copy import deepcopy

from ai_engine.models import ProblemData, SessionData, ScheduleSlot, SlotData, RoomData
from ai_engine.utils import get_available_slots, get_compatible_rooms, is_slot_free
from ai_engine.constraints import count_hard_violations

logger = logging.getLogger(__name__)


class CSPSolver:
    """
    Backtracking CSP solver with:
    - Forward Checking: prune domains after each assignment
    - MRV heuristic: pick the session with fewest valid options first
    - Fail-first: detect dead ends early
    """

    def __init__(self, data: ProblemData, max_backtracks: int = 5000):
        self.data          = data
        self.max_backtracks = max_backtracks
        self.backtracks    = 0

        # Build domains: session_id → list of (slot, room) pairs
        self.domains: dict[str, list[tuple[SlotData, RoomData]]] = {}
        self._build_domains()

    # ── Domain Building ──────────────────────────────────────────

    def _build_domains(self):
        """
        For each session, compute all (slot, room) pairs that satisfy
        the basic per-session constraints (room type, capacity, instructor availability).
        """
        for session in self.data.sessions:
            available_slots = get_available_slots(session, self.data.slots, self.data)
            compatible_rooms = get_compatible_rooms(session, self.data.rooms)

            pairs = [
                (slot, room)
                for slot in available_slots
                for room in compatible_rooms
            ]
            self.domains[session.id] = pairs

        logger.debug(
            f"CSP domains built: {len(self.data.sessions)} sessions, "
            f"avg domain size = {self._avg_domain_size():.1f}"
        )

    def _avg_domain_size(self) -> float:
        if not self.domains:
            return 0.0
        return sum(len(v) for v in self.domains.values()) / len(self.domains)

    # ── MRV Heuristic ────────────────────────────────────────────

    def _select_unassigned(
        self,
        assigned: dict[str, ScheduleSlot],
        remaining_domains: dict[str, list],
    ) -> SessionData | None:
        """
        Minimum Remaining Values (MRV):
        Pick the session with the fewest valid (slot, room) pairs.
        This catches dead ends early.
        """
        unassigned = [
            s for s in self.data.sessions
            if s.id not in assigned
        ]
        if not unassigned:
            return None

        return min(
            unassigned,
            key=lambda s: len(remaining_domains.get(s.id, []))
        )

    # ── Forward Checking ─────────────────────────────────────────

    def _forward_check(
        self,
        assigned_slot: ScheduleSlot,
        session: SessionData,
        remaining_domains: dict[str, list],
        assigned: dict[str, ScheduleSlot],
    ) -> bool:
        """
        After assigning a slot to a session, prune domains of unassigned sessions.
        Returns False if any domain becomes empty (dead end → backtrack).
        """
        session_to_section  = {s.id: s.section_id for s in self.data.sessions}
        session_to_year     = {s.id: s.study_year_id for s in self.data.sessions}

        for other in self.data.sessions:
            if other.id in assigned or other.id == session.id:
                continue

            pruned = []
            for (slot, room) in remaining_domains.get(other.id, []):
                if slot.id != assigned_slot.time_slot_id:
                    pruned.append((slot, room))
                    continue

                # Would this cause a conflict?
                conflict = False

                # HC-1: Same room same slot
                if room.id == assigned_slot.room_id:
                    conflict = True

                # HC-2: Same instructor same slot
                elif other.instructor_id == assigned_slot.instructor_id:
                    conflict = True

                # HC-3: Same section same slot
                elif session_to_section.get(other.id) == session_to_section.get(session.id):
                    conflict = True

                # HC-7: Same study year same slot
                elif session_to_year.get(other.id) == session_to_year.get(session.id):
                    conflict = True

                if not conflict:
                    pruned.append((slot, room))

            remaining_domains[other.id] = pruned

            # Dead end: no valid options left for this session
            if not pruned:
                return False

        return True

    # ── Backtracking Search ──────────────────────────────────────

    def _backtrack(
        self,
        assigned: dict[str, ScheduleSlot],
        remaining_domains: dict[str, list],
    ) -> dict[str, ScheduleSlot] | None:
        """
        Recursive backtracking.
        Returns assignment dict if solution found, None if no solution.
        """
        # All sessions assigned → solution found
        if len(assigned) == len(self.data.sessions):
            return assigned

        # Safety: stop if too many backtracks (hand off to GA)
        if self.backtracks >= self.max_backtracks:
            logger.warning(f"CSP hit backtrack limit ({self.max_backtracks})")
            return None

        # MRV: pick hardest session first
        session = self._select_unassigned(assigned, remaining_domains)
        if session is None:
            return assigned

        domain = remaining_domains.get(session.id, [])

        for (slot, room) in domain:
            # Check hard constraints against current assignment
            if not is_slot_free(
                slot.id, room.id,
                session.instructor_id,
                session.section_id,
                session.study_year_id,
                list(assigned.values()),
                self.data,
            ):
                continue

            # Build the schedule slot
            schedule_slot = ScheduleSlot(
                session_id=session.id,
                time_slot_id=slot.id,
                room_id=room.id,
                day=slot.day,
                start_time=slot.start_time,
                instructor_id=session.instructor_id,
            )

            # Assign
            assigned[session.id] = schedule_slot

            # Forward checking — prune other domains
            saved_domains = deepcopy(remaining_domains)
            if self._forward_check(schedule_slot, session, remaining_domains, assigned):
                result = self._backtrack(assigned, remaining_domains)
                if result is not None:
                    return result

            # Backtrack
            del assigned[session.id]
            remaining_domains = saved_domains
            self.backtracks += 1

        return None  # No valid assignment found for this session

    # ── Public API ───────────────────────────────────────────────

    def solve(self) -> tuple[list[ScheduleSlot], bool]:
        """
        Run the CSP solver.

        Returns:
            (schedule, is_complete)
            schedule     : list of ScheduleSlot (may be partial if incomplete)
            is_complete  : True if all sessions assigned with 0 hard violations
        """
        logger.info(
            f"CSP starting: {len(self.data.sessions)} sessions, "
            f"{len(self.data.slots)} slots, {len(self.data.rooms)} rooms"
        )

        remaining_domains = deepcopy(self.domains)
        result = self._backtrack({}, remaining_domains)

        if result is not None:
            schedule = list(result.values())
            violations = count_hard_violations(schedule, self.data)
            is_complete = violations == 0 and len(schedule) == len(self.data.sessions)
            logger.info(
                f"CSP finished: {len(schedule)}/{len(self.data.sessions)} sessions assigned, "
                f"{violations} hard violations, {self.backtracks} backtracks"
            )
            return schedule, is_complete
        else:
            logger.warning(
                f"CSP failed after {self.backtracks} backtracks — "
                "GA will start from random population"
            )
            return [], False