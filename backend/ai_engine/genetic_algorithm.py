# ================================================================
#  backend/ai_engine/genetic_algorithm.py
#
#  Genetic Algorithm for Schedule Optimization
#
#  Pipeline:
#    1. Start with population (from CSP seed or random)
#    2. Each generation:
#       a. Evaluate fitness for all chromosomes
#       b. Selection: Tournament Selection
#       c. Crossover: Uniform Crossover
#       d. Mutation: Random slot reassignment
#       e. Elitism: keep best N chromosomes unchanged
#    3. Return best chromosome found
#
#  Progress is reported via a callback so FastAPI can
#  stream updates to the frontend (polling /ai/status).
# ================================================================

import random
import logging
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Callable

from ai_engine.models import ProblemData, ScheduleSlot
from ai_engine.population import (
    Chromosome, generate_population,
    chromosome_to_dict, repair_chromosome,
)
from ai_engine.fitness import calculate_fitness, fitness_breakdown, FitnessWeights
from ai_engine.utils import random_slot_room
from ai_engine.constraints import count_hard_violations

logger = logging.getLogger(__name__)


# ── Config ────────────────────────────────────────────────────────

@dataclass
class GAConfig:
    """Genetic Algorithm hyperparameters."""
    generations:      int   = 100
    population_size:  int   = 50
    mutation_rate:    float = 0.02    # probability per gene
    crossover_rate:   float = 0.8     # probability of crossover vs clone
    elitism_count:    int   = 2       # top N kept unchanged each gen
    tournament_size:  int   = 3       # k for tournament selection

    @classmethod
    def from_dict(cls, d: dict) -> "GAConfig":
        return cls(**{k: v for k, v in d.items() if hasattr(cls, k)})


@dataclass
class GenerationResult:
    """Stats for one generation — sent to frontend via polling."""
    generation:      int
    best_fitness:    float
    avg_fitness:     float
    hard_violations: int
    best_chromosome: Chromosome = field(default_factory=list, repr=False)


# ── Selection ─────────────────────────────────────────────────────

def tournament_selection(
    population: list[Chromosome],
    fitnesses: list[float],
    k: int = 3,
) -> Chromosome:
    """
    Tournament Selection: pick k random chromosomes, return the best.
    Simple, fast, and works well for scheduling problems.
    """
    indices = random.sample(range(len(population)), min(k, len(population)))
    best_idx = max(indices, key=lambda i: fitnesses[i])
    return deepcopy(population[best_idx])


# ── Crossover ─────────────────────────────────────────────────────

def uniform_crossover(
    parent1: Chromosome,
    parent2: Chromosome,
    data: ProblemData,
) -> tuple[Chromosome, Chromosome]:
    """
    Uniform Crossover: for each session, randomly take the slot
    from either parent1 or parent2.

    This is better than single-point crossover for scheduling because
    sessions are not positionally ordered — any combination can be valid.

    Returns two children chromosomes.
    """
    p1_dict = chromosome_to_dict(parent1)
    p2_dict = chromosome_to_dict(parent2)

    child1_slots: list[ScheduleSlot] = []
    child2_slots: list[ScheduleSlot] = []

    for session in data.sessions:
        s1 = p1_dict.get(session.id)
        s2 = p2_dict.get(session.id)

        if s1 and s2:
            # Randomly take from either parent
            if random.random() < 0.5:
                child1_slots.append(deepcopy(s1))
                child2_slots.append(deepcopy(s2))
            else:
                child1_slots.append(deepcopy(s2))
                child2_slots.append(deepcopy(s1))
        elif s1:
            child1_slots.append(deepcopy(s1))
            child2_slots.append(deepcopy(s1))
        elif s2:
            child1_slots.append(deepcopy(s2))
            child2_slots.append(deepcopy(s2))
        # If neither parent has this session → stays unassigned

    return child1_slots, child2_slots


# ── Mutation ──────────────────────────────────────────────────────

def mutate(
    chromosome: Chromosome,
    data: ProblemData,
    mutation_rate: float = 0.02,
) -> Chromosome:
    """
    Mutation: with probability `mutation_rate`, reassign each session
    to a new random (slot, room) pair.

    Low mutation rate preserves good solutions.
    High mutation rate explores more but can destroy good solutions.
    """
    mutated = deepcopy(chromosome)

    for i, slot in enumerate(mutated):
        if random.random() > mutation_rate:
            continue

        # Find the session for this slot
        session = next(
            (s for s in data.sessions if s.id == slot.session_id),
            None
        )
        if not session:
            continue

        # Try to find a new slot (excluding current chromosome except this one)
        temp = [s for j, s in enumerate(mutated) if j != i]
        new_slot = random_slot_room(session, data, temp)
        if new_slot:
            mutated[i] = new_slot

    return mutated


# ── Main GA ───────────────────────────────────────────────────────

class GeneticAlgorithm:
    """
    Full Genetic Algorithm for schedule optimization.

    Usage:
        ga = GeneticAlgorithm(data, config)
        best_schedule, logs = ga.run(seed=csp_result, on_progress=callback)
    """

    def __init__(
        self,
        data: ProblemData,
        config: GAConfig | None = None,
        weights: FitnessWeights | None = None,
    ):
        self.data    = data
        self.config  = config or GAConfig()
        self.weights = weights or FitnessWeights()

    def _evaluate_population(
        self, population: list[Chromosome]
    ) -> list[float]:
        """Calculate fitness for each chromosome in the population."""
        return [
            calculate_fitness(chrom, self.data, self.weights)
            for chrom in population
        ]

    def _get_elite(
        self,
        population: list[Chromosome],
        fitnesses: list[float],
    ) -> list[Chromosome]:
        """Return top N chromosomes (elitism)."""
        sorted_idx = sorted(
            range(len(population)),
            key=lambda i: fitnesses[i],
            reverse=True,
        )
        return [deepcopy(population[i]) for i in sorted_idx[:self.config.elitism_count]]

    def run(
        self,
        seed: Chromosome | None = None,
        on_progress: Callable[[GenerationResult], None] | None = None,
    ) -> tuple[Chromosome, list[GenerationResult]]:
        """
        Run the Genetic Algorithm.

        Args:
            seed        : CSP solution to seed the population with
            on_progress : callback called after each generation
                          (used to update DB and stream progress to frontend)

        Returns:
            (best_chromosome, generation_logs)
        """
        cfg = self.config
        logger.info(
            f"GA starting: {cfg.generations} gen, "
            f"pop={cfg.population_size}, "
            f"mut={cfg.mutation_rate}, "
            f"sessions={len(self.data.sessions)}"
        )

        # ── Initial population ────────────────────────────────────
        population = generate_population(cfg.population_size, self.data, seed)
        logs: list[GenerationResult] = []
        best_ever: Chromosome = []
        best_ever_fitness: float = -1.0

        # ── Evolution loop ────────────────────────────────────────
        for gen in range(cfg.generations):
            fitnesses = self._evaluate_population(population)

            # Track best
            best_idx  = max(range(len(fitnesses)), key=lambda i: fitnesses[i])
            best_fit  = fitnesses[best_idx]
            avg_fit   = sum(fitnesses) / len(fitnesses)
            hard_viol = count_hard_violations(population[best_idx], self.data)

            if best_fit > best_ever_fitness:
                best_ever_fitness = best_fit
                best_ever = deepcopy(population[best_idx])

            # Log this generation
            gen_result = GenerationResult(
                generation=gen + 1,
                best_fitness=round(best_fit, 2),
                avg_fitness=round(avg_fit, 2),
                hard_violations=hard_viol,
                best_chromosome=best_ever,
            )
            logs.append(gen_result)

            # Report progress
            if on_progress:
                on_progress(gen_result)

            # Early exit: perfect schedule
            if best_fit >= 999.9 and hard_viol == 0:
                logger.info(
                    f"GA converged at generation {gen+1} "
                    f"(fitness={best_fit:.2f}, violations={hard_viol})"
                )
                break

            # ── Build next generation ─────────────────────────────
            elite = self._get_elite(population, fitnesses)
            next_gen: list[Chromosome] = elite.copy()

            while len(next_gen) < cfg.population_size:
                # Selection
                p1 = tournament_selection(population, fitnesses, cfg.tournament_size)
                p2 = tournament_selection(population, fitnesses, cfg.tournament_size)

                # Crossover
                if random.random() < cfg.crossover_rate:
                    c1, c2 = uniform_crossover(p1, p2, self.data)
                else:
                    c1, c2 = deepcopy(p1), deepcopy(p2)

                # Mutation
                c1 = mutate(c1, self.data, cfg.mutation_rate)
                c2 = mutate(c2, self.data, cfg.mutation_rate)

                # Repair (fix obvious hard violations after crossover)
                c1 = repair_chromosome(c1, self.data)
                c2 = repair_chromosome(c2, self.data)

                next_gen.append(c1)
                if len(next_gen) < cfg.population_size:
                    next_gen.append(c2)

            population = next_gen

        final_breakdown = fitness_breakdown(best_ever, self.data, self.weights)
        logger.info(
            f"GA finished: fitness={final_breakdown['fitness_score']}, "
            f"hard_violations={final_breakdown['hard_violations']}, "
            f"coverage={final_breakdown['coverage_pct']}%"
        )

        return best_ever, logs