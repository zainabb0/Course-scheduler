# ================================================================
#  backend/ai_engine/fitness.py
#
#  Fitness Function for the Genetic Algorithm.
#
#  Score = 1000 - (hard_penalty + soft_penalty)
#  Higher = better schedule.
#
#  Hard violations are penalized heavily (×100) so the GA
#  strongly prefers valid schedules over soft-constraint wins.
#
#  Soft violations use configurable weights so the admin can
#  tune what matters most via the Constraints page.
# ================================================================

from dataclasses import dataclass
import numpy as np
from ai_engine.models import ProblemData, ScheduleSlot
from ai_engine.constraints import (
    count_hard_violations,
    count_soft_violations,
    HARD_CONSTRAINTS,
)


@dataclass
class FitnessWeights:
    """
    Weights for soft constraints.
    Admin can tune these via the Constraints page (stored in DB later).
    All default to 1.0 — increase to make that constraint matter more.
    """
    preferred_time:       float = 2.0   # instructor preferred morning/afternoon
    days_off:             float = 2.0   # instructor preferred days off
    consecutive_overload: float = 1.5   # no back-to-back overload
    spread_sessions:      float = 1.0   # spread sessions across days

    # Penalty per hard violation (should be >> soft weights)
    hard_violation_penalty: float = 100.0

    @classmethod
    def from_dict(cls, d: dict) -> "FitnessWeights":
        return cls(**{k: v for k, v in d.items() if hasattr(cls, k)})


# Default weights instance
DEFAULT_WEIGHTS = FitnessWeights()

# Map soft constraint function names to weight attribute names
_SOFT_WEIGHT_MAP = {
    "sc_instructor_preferred_time": "preferred_time",
    "sc_instructor_days_off":       "days_off",
    "sc_no_consecutive_overload":   "consecutive_overload",
    "sc_spread_sessions":           "spread_sessions",
}


def calculate_fitness(
    schedule: list[ScheduleSlot],
    data: ProblemData,
    weights: FitnessWeights = DEFAULT_WEIGHTS,
) -> float:
    """
    Calculate fitness score for a schedule chromosome.

    Returns:
        float — higher is better, max is 1000.0
        A schedule with 0 violations scores exactly 1000.0.
    """
    if not schedule:
        return 0.0

    # ── Hard violations ──────────────────────────────────────────
    hard_total = count_hard_violations(schedule, data)
    hard_penalty = hard_total * weights.hard_violation_penalty

    # ── Soft violations ──────────────────────────────────────────
    soft_counts = count_soft_violations(schedule, data)
    soft_penalty = sum(
        count * getattr(weights, _SOFT_WEIGHT_MAP[name], 1.0)
        for name, count in soft_counts.items()
        if name in _SOFT_WEIGHT_MAP
    )

    # ── Coverage bonus ───────────────────────────────────────────
    # Reward assigning more sessions (partial schedules score lower)
    coverage_ratio = float(np.divide(len(schedule), max(len(data.sessions), 1)))
    coverage_bonus = (1 - coverage_ratio) * weights.hard_violation_penalty * 2

    score = 1000.0 - hard_penalty - soft_penalty - coverage_bonus
    return max(score, 0.0)


def fitness_breakdown(
    schedule: list[ScheduleSlot],
    data: ProblemData,
    weights: FitnessWeights = DEFAULT_WEIGHTS,
) -> dict:
    """
    Detailed fitness breakdown for logging and the FitnessChart.
    Returns all scores and violation counts.
    """
    hard_total  = count_hard_violations(schedule, data)
    soft_counts = count_soft_violations(schedule, data)
    score       = calculate_fitness(schedule, data, weights)

    return {
        "fitness_score":    round(score, 2),
        "hard_violations":  hard_total,
        "soft_violations":  soft_counts,
        "sessions_assigned": len(schedule),
        "sessions_total":   len(data.sessions),
        "coverage_pct":     round(len(schedule) / max(len(data.sessions), 1) * 100, 1),
    }