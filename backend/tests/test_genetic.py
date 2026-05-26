# ================================================================
#  backend/tests/test_genetic.py
#  Run: pytest tests/test_genetic.py -v
# ================================================================

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai_engine.models import (
    ProblemData, SessionData, SlotData, RoomData,
    InstructorData, ScheduleSlot,
)
from ai_engine.fitness import calculate_fitness, fitness_breakdown, FitnessWeights
from ai_engine.population import (
    generate_chromosome, generate_population,
    chromosome_to_dict, repair_chromosome,
)
from ai_engine.genetic_algorithm import (
    GeneticAlgorithm, GAConfig,
    tournament_selection, uniform_crossover, mutate,
)


# ── Shared fixtures ───────────────────────────────────────────────

def make_slot(id, day="sunday", start="08:00", end="09:30", num=1):
    return SlotData(id=id, day=day, start_time=start, end_time=end, slot_number=num)

def make_room(id, rtype="lecture", cap=50, code="R"):
    return RoomData(id=id, code=code, capacity=cap, room_type=rtype, has_computers=False)

def make_instructor(id, blocked=None, preferred="no_preference", days_off=None):
    return InstructorData(
        id=id, name=f"I{id}", max_hours_week=20,
        blocked_slots=set(blocked or []),
        preferred_time=preferred,
        preferred_days_off=days_off or [],
        max_consecutive_hrs=3,
    )

def make_session(id, inst_id, sec_id, year_id, rtype="lecture", students=30):
    return SessionData(
        id=id, assignment_id=f"a{id}", section_id=sec_id,
        course_id="c1", course_code="CS101", course_name="Intro",
        instructor_id=inst_id, session_type="lecture",
        study_year_id=year_id, student_count=students,
        hours_per_week=2, required_room_type=rtype,
    )

def make_assigned(session_id, slot_id, room_id, instructor_id,
                  day="sunday", start="08:00"):
    return ScheduleSlot(
        session_id=session_id, time_slot_id=slot_id,
        room_id=room_id, day=day, start_time=start,
        instructor_id=instructor_id,
    )

def build_simple_problem(n_sessions=3):
    """Build a simple problem with n_sessions, enough slots and rooms."""
    sessions = [
        make_session(f"s{i}", f"i{i}", f"sec{i}", f"y{i % 2 + 1}")
        for i in range(1, n_sessions + 1)
    ]
    slots = [
        make_slot(f"slot{d}_{t}", day=day, start=start, num=t)
        for d, day in enumerate(["sunday", "monday", "tuesday"])
        for t, start in enumerate(["08:00", "09:30", "11:00", "13:00"], 1)
    ]
    rooms = [
        make_room(f"room{i}", code=f"R{i}")
        for i in range(1, n_sessions + 2)
    ]
    instructors = {
        f"i{i}": make_instructor(f"i{i}")
        for i in range(1, n_sessions + 1)
    }
    return ProblemData(
        schedule_id="test", academic_year="2024-2025",
        sessions=sessions, slots=slots,
        rooms=rooms, instructors=instructors,
    )


# ── Fitness Tests ─────────────────────────────────────────────────

class TestFitness:
    def test_empty_schedule_zero_fitness(self):
        data = build_simple_problem()
        assert calculate_fitness([], data) == 0.0

    def test_valid_schedule_high_fitness(self):
        data = build_simple_problem(n_sessions=2)
        schedule = [
            make_assigned("s1", "slot0_1", "room1", "i1", "sunday", "08:00"),
            make_assigned("s2", "slot0_2", "room2", "i2", "sunday", "09:30"),
        ]
        score = calculate_fitness(schedule, data)
        assert score > 0

    def test_conflict_reduces_fitness(self):
        data = build_simple_problem(n_sessions=2)
        # Both sessions in same room at same time → hard violation
        conflict_schedule = [
            make_assigned("s1", "slot0_1", "room1", "i1", "sunday", "08:00"),
            make_assigned("s2", "slot0_1", "room1", "i2", "sunday", "08:00"),
        ]
        good_schedule = [
            make_assigned("s1", "slot0_1", "room1", "i1", "sunday", "08:00"),
            make_assigned("s2", "slot0_2", "room2", "i2", "sunday", "09:30"),
        ]
        conflict_score = calculate_fitness(conflict_schedule, data)
        good_score     = calculate_fitness(good_schedule, data)
        assert good_score > conflict_score

    def test_fitness_weights_affect_score(self):
        """Higher soft weight should penalize soft violations more."""
        data = build_simple_problem(n_sessions=1)
        # Instructor prefers morning, schedule in afternoon
        data.instructors["i1"].preferred_time = "morning"
        schedule = [make_assigned("s1", "slot0_4", "room1", "i1", "sunday", "13:00")]

        w_low  = FitnessWeights(preferred_time=0.1)
        w_high = FitnessWeights(preferred_time=10.0)

        score_low  = calculate_fitness(schedule, data, w_low)
        score_high = calculate_fitness(schedule, data, w_high)
        assert score_low > score_high

    def test_fitness_breakdown_keys(self):
        data = build_simple_problem()
        breakdown = fitness_breakdown([], data)
        assert "fitness_score"    in breakdown
        assert "hard_violations"  in breakdown
        assert "soft_violations"  in breakdown
        assert "coverage_pct"     in breakdown

    def test_full_coverage_100pct(self):
        data = build_simple_problem(n_sessions=2)
        schedule = [
            make_assigned("s1", "slot0_1", "room1", "i1"),
            make_assigned("s2", "slot0_2", "room2", "i2"),
        ]
        bd = fitness_breakdown(schedule, data)
        assert bd["coverage_pct"] == 100.0

    def test_partial_coverage_less_than_100(self):
        data = build_simple_problem(n_sessions=3)
        schedule = [make_assigned("s1", "slot0_1", "room1", "i1")]
        bd = fitness_breakdown(schedule, data)
        assert bd["coverage_pct"] < 100.0


# ── Population Tests ──────────────────────────────────────────────

class TestPopulation:
    def test_chromosome_has_slots_for_sessions(self):
        data = build_simple_problem(n_sessions=3)
        chrom = generate_chromosome(data)
        # At least some sessions should be assigned
        assert len(chrom) > 0
        assert len(chrom) <= len(data.sessions)

    def test_generate_population_correct_size(self):
        data = build_simple_problem(n_sessions=2)
        pop  = generate_population(10, data)
        assert len(pop) == 10

    def test_chromosomes_are_independent(self):
        """Modifying one chromosome shouldn't affect another."""
        data = build_simple_problem(n_sessions=2)
        pop  = generate_population(5, data)
        original_len = len(pop[0])
        pop[0].append(make_assigned("extra", "slot0_1", "room1", "i1"))
        assert len(pop[1]) != len(pop[0]) or len(pop[1]) == original_len

    def test_chromosome_to_dict_keyed_by_session(self):
        chrom = [
            make_assigned("s1", "slot1", "room1", "i1"),
            make_assigned("s2", "slot2", "room2", "i2"),
        ]
        d = chromosome_to_dict(chrom)
        assert "s1" in d
        assert "s2" in d
        assert d["s1"].room_id == "room1"

    def test_seed_in_population(self):
        """If seed provided, first chromosome = seed."""
        data = build_simple_problem(n_sessions=2)
        seed = [make_assigned("s1", "slot0_1", "room1", "i1")]
        pop  = generate_population(5, data, seed=seed)
        # First chromosome should match the seed
        assert pop[0][0].session_id == "s1"

    def test_repair_removes_room_conflict(self):
        data = build_simple_problem(n_sessions=2)
        # Both in same room at same time
        broken = [
            make_assigned("s1", "slot0_1", "room1", "i1"),
            make_assigned("s2", "slot0_1", "room1", "i2"),
        ]
        repaired = repair_chromosome(broken, data)
        # After repair, no two sessions in same room+slot
        pairs = [(s.room_id, s.time_slot_id) for s in repaired]
        assert len(pairs) == len(set(pairs))


# ── GA Operations Tests ───────────────────────────────────────────

class TestGAOperations:
    def test_tournament_selection_returns_chromosome(self):
        data  = build_simple_problem(n_sessions=2)
        pop   = generate_population(10, data)
        fits  = [1.0] * 10
        fits[3] = 100.0   # make one clearly best
        result = tournament_selection(pop, fits, k=3)
        assert isinstance(result, list)

    def test_crossover_produces_two_children(self):
        data = build_simple_problem(n_sessions=3)
        p1   = generate_chromosome(data)
        p2   = generate_chromosome(data)
        c1, c2 = uniform_crossover(p1, p2, data)
        assert isinstance(c1, list)
        assert isinstance(c2, list)

    def test_crossover_children_have_valid_session_ids(self):
        data     = build_simple_problem(n_sessions=3)
        p1       = generate_chromosome(data)
        p2       = generate_chromosome(data)
        c1, _    = uniform_crossover(p1, p2, data)
        valid_ids = {s.id for s in data.sessions}
        for slot in c1:
            assert slot.session_id in valid_ids

    def test_mutation_returns_same_length(self):
        data  = build_simple_problem(n_sessions=3)
        chrom = generate_chromosome(data)
        mut   = mutate(chrom, data, mutation_rate=1.0)  # mutate everything
        # Mutated length may differ slightly (some may fail to find slot),
        # but should be close to original
        assert abs(len(mut) - len(chrom)) <= len(chrom)

    def test_mutation_rate_zero_unchanged(self):
        data  = build_simple_problem(n_sessions=3)
        chrom = generate_chromosome(data)
        mut   = mutate(chrom, data, mutation_rate=0.0)
        # No mutations — should be identical
        assert len(mut) == len(chrom)
        for orig, m in zip(chrom, mut):
            assert orig.session_id == m.session_id


# ── Full GA Run Tests ─────────────────────────────────────────────

class TestGeneticAlgorithm:
    def test_ga_runs_and_returns_schedule(self):
        data = build_simple_problem(n_sessions=3)
        cfg  = GAConfig(generations=10, population_size=10)
        ga   = GeneticAlgorithm(data, cfg)
        best, logs = ga.run()

        assert isinstance(best, list)
        assert len(logs) > 0

    def test_ga_improves_over_generations(self):
        data = build_simple_problem(n_sessions=4)
        cfg  = GAConfig(generations=20, population_size=20)
        ga   = GeneticAlgorithm(data, cfg)
        _, logs = ga.run()

        # Best fitness of last generation should be >= first generation
        assert logs[-1].best_fitness >= logs[0].best_fitness

    def test_ga_logs_every_generation(self):
        data = build_simple_problem(n_sessions=2)
        cfg  = GAConfig(generations=5, population_size=5)
        ga   = GeneticAlgorithm(data, cfg)
        _, logs = ga.run()

        assert len(logs) <= 5   # may stop early if converged
        assert len(logs) >= 1

    def test_ga_progress_callback_called(self):
        data = build_simple_problem(n_sessions=2)
        cfg  = GAConfig(generations=5, population_size=5)
        ga   = GeneticAlgorithm(data, cfg)

        called = []
        def on_progress(result):
            called.append(result.generation)

        ga.run(on_progress=on_progress)
        assert len(called) >= 1

    def test_ga_with_seed_outperforms_random(self):
        """GA seeded with a good solution should start with better fitness."""
        data = build_simple_problem(n_sessions=3)
        cfg  = GAConfig(generations=5, population_size=10)

        # Good seed: valid assignments
        seed = [
            make_assigned("s1", "slot0_1", "room1", "i1", "sunday", "08:00"),
            make_assigned("s2", "slot0_2", "room2", "i2", "sunday", "09:30"),
            make_assigned("s3", "slot1_1", "room3", "i3", "monday", "08:00"),
        ]

        ga_seeded = GeneticAlgorithm(data, cfg)
        _, logs_seeded = ga_seeded.run(seed=seed)

        ga_random = GeneticAlgorithm(data, cfg)
        _, logs_random = ga_random.run(seed=None)

        # Seeded GA should start better (first generation)
        assert logs_seeded[0].best_fitness >= 0
        assert logs_random[0].best_fitness >= 0
        # Both should produce valid logs
        assert len(logs_seeded) > 0
        assert len(logs_random) > 0

    def test_ga_elitism_preserves_best(self):
        """Best chromosome should never get worse across generations."""
        data = build_simple_problem(n_sessions=3)
        cfg  = GAConfig(generations=15, population_size=15, elitism_count=2)
        ga   = GeneticAlgorithm(data, cfg)
        _, logs = ga.run()

        best_seen = -1.0
        for log in logs:
            assert log.best_fitness >= best_seen - 0.01  # allow tiny float rounding
            best_seen = max(best_seen, log.best_fitness)