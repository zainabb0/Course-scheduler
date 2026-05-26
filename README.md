# AI Course Schedule Creation System

> Hybrid CSP + Genetic Algorithm schedule generator for university departments.

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | Vite + React 18 + Tailwind CSS + shadcn/ui |
| State      | Zustand + TanStack Query |
| Backend    | FastAPI + SQLAlchemy v2 + PostgreSQL |
| AI Engine  | CSP (Backtracking + MRV) + Genetic Algorithm |
| Auth       | JWT (python-jose + bcrypt) |
| Deploy     | Docker + Nginx |

## Quick Start (Development)

```bash
# 1. Clone and setup
git clone <repo-url>
cd ai-course-scheduler
cp .env.example .env
# Edit .env with your values

# 2. Start everything
docker compose up --build

# 3. Open browser
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

## Default Accounts (seed data)

| Email | Password | Role |
|-------|----------|------|
| admin@cs.edu | Password@123 | Admin |
| sara@cs.edu | Password@123 | Instructor |
| ali@student.cs.edu | Password@123 | Student |

## Project Structure

```
ai-course-scheduler/
├── backend/
│   ├── main.py                 ← FastAPI entry point
│   ├── app/
│   │   ├── models/             ← SQLAlchemy models (16 tables)
│   │   ├── schemas/            ← Pydantic request/response
│   │   ├── routers/            ← API endpoints (9 routers)
│   │   └── core/               ← JWT, security, exceptions
│   ├── ai_engine/
│   │   ├── models.py           ← Pure Python dataclasses
│   │   ├── constraints.py      ← 7 Hard + 4 Soft constraints
│   │   ├── csp_solver.py       ← Backtracking + MRV + FC
│   │   ├── fitness.py          ← Fitness function
│   │   ├── population.py       ← Chromosome encoding
│   │   ├── genetic_algorithm.py← Full GA implementation
│   │   └── scheduler.py        ← Pipeline orchestrator
│   └── tests/
│       ├── test_csp.py         ← 20 CSP unit tests
│       ├── test_genetic.py     ← 30 GA unit tests
│       └── test_integration.py ← API integration tests
├── frontend/
│   └── src/
│       ├── pages/              ← 15 React pages
│       ├── components/         ← Layout + UI + Schedule + Charts
│       ├── api/                ← Axios API modules
│       ├── store/              ← Zustand stores
│       └── hooks/              ← Custom React hooks
└── database/
    ├── schema_v1.1.sql         ← 16 tables
    └── seed_data.sql           ← CS dept sample data
```

## Running Tests

```bash
cd backend
source venv/bin/activate

# Unit tests (no DB needed)
pytest tests/test_csp.py tests/test_genetic.py -v

# Integration tests (needs DB)
pytest tests/test_integration.py -v
```

## Production Deployment

```bash
cp .env.example .env
# Edit .env: set DEBUG=false, strong SECRET_KEY

chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## API Documentation

After starting the server: **http://localhost:8000/docs**

## AI Algorithm

1. **CSP Phase**: Backtracking search with Arc Consistency (AC-3) and MRV heuristic finds a valid initial schedule satisfying all 7 hard constraints.

2. **GA Phase**: Genetic Algorithm refines the solution over N generations, optimizing 4 soft constraints (instructor preferences, schedule balance).

**Hard Constraints (must = 0 violations):**
- No room double-booking
- No instructor double-booking  
- No section double-booking
- Instructor availability
- Room type match (lecture/lab)
- Room capacity
- Same year no overlap

**Soft Constraints (weighted penalties):**
- Instructor preferred time (morning/afternoon)
- Preferred days off
- No consecutive overload
- Spread sessions across days