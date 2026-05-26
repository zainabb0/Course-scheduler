-- ================================================================
--  AI COURSE SCHEDULE CREATION SYSTEM
--  Database Schema — Department Level (v1.2)
--  PostgreSQL 15+
--
--  DESIGN DECISIONS:
--  • Level 2 (Department) — upgrade to Level 3 (College) needs
--    only adding `colleges` table + `college_id` FK in departments
--  • instructor = one per course per study_year (not per section)
--  • sections are per-course (some courses have A+B, others single)
--  • session_type: lecture | lab  (some courses have both, some lecture only)
--  • Soft deletes via is_active (no hard DELETE on core data)
--  • All times UTC, durations in minutes
--
--  v1.1 CHANGES:
--  • schedule_entries: added instructor_id column (direct FK to instructors)
--    → fixes double-booking detection (was incorrectly using course_assignment_id)
--  • sections: added study_year_id column for direct year lookup without joins
--  • Added students + student_enrollments tables
--
--  v1.2 CHANGES:
--  • instructors: added department_id column (present in real seed data)
--  • students: added department_id + updated_at columns
--  • time_slots: added slot_number + is_break columns
--  • course_assignments: added semester column (fall/spring)
--  • departments, study_years, instructors, rooms, courses, sections:
--    added updated_at column (required by TimestampMixin in SQLAlchemy models)
-- ================================================================


-- ================================================================
--  EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
--  ENUMS
-- ================================================================

CREATE TYPE user_role        AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE room_type        AS ENUM ('lecture', 'lab', 'both');
CREATE TYPE session_type     AS ENUM ('lecture', 'lab');
CREATE TYPE week_day         AS ENUM ('sunday','monday','tuesday','wednesday','thursday');
CREATE TYPE time_preference  AS ENUM ('morning','afternoon','no_preference');
CREATE TYPE schedule_status  AS ENUM ('pending','running','completed','failed');
CREATE TYPE ai_algorithm     AS ENUM ('csp_only','genetic_only','hybrid');


-- ================================================================
--  1. DEPARTMENTS
--     Level-3 upgrade: add `college_id UUID REFERENCES colleges(id)`
-- ================================================================
CREATE TABLE departments (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        VARCHAR(120) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    -- college_id UUID REFERENCES colleges(id)  ← uncomment to upgrade to Level 3
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()   -- v1.2: required by TimestampMixin
);

COMMENT ON TABLE departments IS
    'Academic departments. Add college_id FK here when upgrading to Level 3.';


-- ================================================================
--  2. STUDY YEARS  (المراحل الدراسية)
-- ================================================================
CREATE TABLE study_years (
    id              VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id   VARCHAR(36)  NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    year_number     SMALLINT     NOT NULL CHECK (year_number BETWEEN 1 AND 6),
    label           VARCHAR(60)  NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- v1.2

    UNIQUE (department_id, year_number)
);

COMMENT ON TABLE study_years IS
    'Academic stages within a department. e.g. Year 1..4 for CS.';


-- ================================================================
--  3. USERS  (admin · instructor · student)
-- ================================================================
CREATE TABLE users (
    id              VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(180) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'student',
    department_id   VARCHAR(36)  REFERENCES departments(id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.department_id IS
    'For instructors: their home department. For students: their enrolled department.';


-- ================================================================
--  4. INSTRUCTORS  (profile extension for users with role=instructor)
-- ================================================================
CREATE TABLE instructors (
    id              VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id         VARCHAR(36)  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id   VARCHAR(36)  REFERENCES departments(id) ON DELETE SET NULL,  -- v1.2
    title           VARCHAR(60),
    max_hours_week  SMALLINT     NOT NULL DEFAULT 20,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()   -- v1.2
);

COMMENT ON TABLE instructors IS
    'Instructor profile. One instructor teaches one course per study year.
     department_id added in v1.2 to match real seed data.';


-- ================================================================
--  5. INSTRUCTOR PREFERENCES
--     Entered by the instructor themselves from their own page
-- ================================================================
CREATE TABLE instructor_preferences (
    id                   VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instructor_id        VARCHAR(36)     NOT NULL UNIQUE REFERENCES instructors(id) ON DELETE CASCADE,
    preferred_time       time_preference NOT NULL DEFAULT 'no_preference',
    max_consecutive_hrs  SMALLINT        NOT NULL DEFAULT 3,
    preferred_days_off   week_day[]      NOT NULL DEFAULT '{}',
    notes                TEXT,
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE instructor_preferences IS
    'Soft constraints entered by the instructor. Fed into the AI as preference weights.';


-- ================================================================
--  6. INSTRUCTOR AVAILABILITY
--     Hard-constraint: which exact slots is the instructor available
-- ================================================================
CREATE TABLE instructor_availability (
    id              VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instructor_id   VARCHAR(36) NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    day             week_day    NOT NULL,
    start_time      TIME        NOT NULL,
    end_time        TIME        NOT NULL,
    is_available    BOOLEAN     NOT NULL DEFAULT TRUE,

    CHECK (end_time > start_time),
    UNIQUE (instructor_id, day, start_time)
);

COMMENT ON TABLE instructor_availability IS
    'Weekly availability grid per instructor.
     is_available=FALSE means that slot is blocked (hard constraint for CSP).';


-- ================================================================
--  7. ROOMS
-- ================================================================
CREATE TABLE rooms (
    id              VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id   VARCHAR(36)  REFERENCES departments(id) ON DELETE SET NULL,
    name            VARCHAR(80)  NOT NULL,
    code            VARCHAR(20)  NOT NULL UNIQUE,
    capacity        SMALLINT     NOT NULL CHECK (capacity > 0),
    room_type       room_type    NOT NULL DEFAULT 'lecture',
    has_projector   BOOLEAN      NOT NULL DEFAULT TRUE,
    has_computers   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_shared       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()   -- v1.2
);

COMMENT ON COLUMN rooms.room_type IS
    'lecture=theory hall only, lab=practical/computer lab only, both=flexible.';


-- ================================================================
--  8. COURSES
-- ================================================================
CREATE TABLE courses (
    id                   VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id        VARCHAR(36)  NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    study_year_id        VARCHAR(36)  NOT NULL REFERENCES study_years(id) ON DELETE CASCADE,
    name                 VARCHAR(150) NOT NULL,
    code                 VARCHAR(30)  NOT NULL UNIQUE,
    credit_hours         SMALLINT     NOT NULL CHECK (credit_hours BETWEEN 0 AND 6),  -- v1.2: 0 for pure-lab courses
    has_lab              BOOLEAN      NOT NULL DEFAULT FALSE,
    lecture_hours_week   SMALLINT     NOT NULL DEFAULT 2,
    lab_hours_week       SMALLINT     NOT NULL DEFAULT 0,
    min_capacity         SMALLINT     NOT NULL DEFAULT 30,
    has_sections         BOOLEAN      NOT NULL DEFAULT FALSE,
    description          TEXT,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- v1.2

    CHECK (
        (has_lab = FALSE AND lab_hours_week = 0) OR
        (has_lab = TRUE  AND lab_hours_week > 0)
    )
);

COMMENT ON TABLE courses IS
    'A course belongs to one study year in one department.
     has_lab=TRUE  → AI schedules both lecture + lab slots, in different room types.
     has_sections=TRUE → course is split into Section A and Section B.
     credit_hours=0 allowed for pure-lab courses (e.g. DSD-L, DBMS-L).';


-- ================================================================
--  9. SECTIONS
-- ================================================================
CREATE TABLE sections (
    id              VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    course_id       VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    study_year_id   VARCHAR(36) NOT NULL REFERENCES study_years(id) ON DELETE CASCADE,
    name            VARCHAR(10) NOT NULL,
    student_count   SMALLINT    NOT NULL DEFAULT 30,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- v1.2
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- v1.2

    UNIQUE (course_id, name)
);

COMMENT ON TABLE sections IS
    'Each course has at least one section (Main).
     study_year_id is denormalized here for direct year lookup without extra joins.
     student_count is used by the AI to match room capacity.';


-- ================================================================
--  10. COURSE ASSIGNMENTS
-- ================================================================
CREATE TABLE course_assignments (
    id              VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    course_id       VARCHAR(36)  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id   VARCHAR(36)  NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    session_type    session_type NOT NULL DEFAULT 'lecture',
    academic_year   VARCHAR(20)  NOT NULL,
    semester        VARCHAR(10)  NOT NULL DEFAULT 'fall'
                        CHECK (semester IN ('fall', 'spring')),  -- v1.2
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- v1.2

    UNIQUE (course_id, session_type, academic_year, semester)  -- v1.2
);

COMMENT ON TABLE course_assignments IS
    'Links an instructor to a course for a given academic year and semester.
     A course with has_lab=TRUE gets two rows: one for lecture, one for lab.
     semester column added in v1.2 to distinguish fall/spring assignments.';


-- ================================================================
--  11. TIME SLOTS  (master scheduling grid)
-- ================================================================
CREATE TABLE time_slots (
    id            VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    day           week_day  NOT NULL,
    start_time    TIME      NOT NULL,
    end_time      TIME      NOT NULL,
    duration_min  SMALLINT  NOT NULL,
    slot_number   SMALLINT,           -- v1.2
    is_break      BOOLEAN   NOT NULL DEFAULT FALSE,  -- v1.2

    CHECK (end_time > start_time),
    UNIQUE (day, start_time)
);

COMMENT ON TABLE time_slots IS
    'All schedulable time slots for the week. Populated by admin during semester setup.
     slot_number and is_break added in v1.2.';


-- ================================================================
--  12. SCHEDULES  (one row per AI generation run)
-- ================================================================
CREATE TABLE schedules (
    id               VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id    VARCHAR(36)     NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_year    VARCHAR(20)     NOT NULL,
    semester         SMALLINT        NOT NULL CHECK (semester IN (1, 2)),
    label            VARCHAR(120),
    algorithm        ai_algorithm    NOT NULL DEFAULT 'hybrid',
    population_size  SMALLINT        NOT NULL DEFAULT 100,
    generations      SMALLINT        NOT NULL DEFAULT 500,
    mutation_rate    DECIMAL(4,3)    NOT NULL DEFAULT 0.015
                         CHECK (mutation_rate BETWEEN 0 AND 1),
    name             VARCHAR(100),
    status           schedule_status NOT NULL DEFAULT 'pending',
    crossover_rate   DECIMAL(4,3)    NOT NULL DEFAULT 0.8,  -- v1.2
    notes            TEXT,
    fitness_score    DECIMAL(6,3),
    conflicts_count  SMALLINT,
    generations_run  SMALLINT,
    runtime_seconds  DECIMAL(8,2),
    created_by       VARCHAR(36)     REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,

    UNIQUE (department_id, academic_year, semester, label)
);

COMMENT ON TABLE schedules IS
    'Each row = one AI generation run. Admin can generate multiple and pick the best.';


-- ================================================================
--  13. SCHEDULE ENTRIES  (the actual timetable)
-- ================================================================
CREATE TABLE schedule_entries (
    id                    VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schedule_id           VARCHAR(36)  NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    section_id            VARCHAR(36)  NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    course_assignment_id  VARCHAR(36)  NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
    instructor_id         VARCHAR(36)  NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
    room_id               VARCHAR(36)  NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    time_slot_id          VARCHAR(36)  NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    session_type          session_type NOT NULL,
    has_conflict          BOOLEAN      NOT NULL DEFAULT FALSE,
    conflict_reason       TEXT,
    is_manual_override    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_manually_edited    BOOLEAN      NOT NULL DEFAULT FALSE,  -- v1.2: alias used by model
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_room_timeslot
    ON schedule_entries (schedule_id, room_id, time_slot_id);

CREATE UNIQUE INDEX uix_instructor_timeslot
    ON schedule_entries (schedule_id, instructor_id, time_slot_id)
    WHERE has_conflict = FALSE;

CREATE UNIQUE INDEX uix_section_timeslot
    ON schedule_entries (schedule_id, section_id, time_slot_id)
    WHERE has_conflict = FALSE;

COMMENT ON TABLE schedule_entries IS
    'The actual timetable rows. Unique indexes enforce hard constraints at the DB level
     as a safety net on top of the AI engine validation.
     instructor_id is stored directly here (not derived via course_assignment) so that
     the double-booking index works correctly across all of an instructor''s courses.';


-- ================================================================
--  14. AI GENERATION LOG  (fitness per generation → progress chart)
-- ================================================================
CREATE TABLE ai_generation_log (
    id                VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schedule_id       VARCHAR(36)  NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    generation_number INT          NOT NULL DEFAULT 0,  -- v1.2: alias used by model
    best_fitness      DECIMAL(8,4) NOT NULL DEFAULT 0,  -- v1.2
    avg_fitness       DECIMAL(8,4) NOT NULL DEFAULT 0,  -- v1.2
    conflicts_count   SMALLINT     NOT NULL,
    logged_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_generation_log IS
    'One row per generation. Used to render the fitness improvement chart in the frontend.';


-- ================================================================
--  15. STUDENTS  (profile extension for users with role=student)
-- ================================================================
CREATE TABLE students (
    id               VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id          VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id    VARCHAR(36) REFERENCES departments(id) ON DELETE SET NULL,  -- v1.2
    study_year_id    VARCHAR(36) REFERENCES study_years(id) ON DELETE SET NULL,
    enrollment_year  SMALLINT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- v1.2
);

COMMENT ON TABLE students IS
    'Student profile linked to users. study_year_id tracks their current academic stage.
     department_id added in v1.2 to match real seed data.';


-- ================================================================
--  16. STUDENT ENROLLMENTS  (which section a student is in)
-- ================================================================
CREATE TABLE student_enrollments (
    id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id  VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id  VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (student_id, section_id)
);

COMMENT ON TABLE student_enrollments IS
    'Maps students to their sections. A student can be in multiple sections
     (one per course). Used to generate personalised student timetables.';


-- ================================================================
--  INDEXES
-- ================================================================
CREATE INDEX idx_study_years_dept       ON study_years(department_id);
CREATE INDEX idx_courses_study_year     ON courses(study_year_id);
CREATE INDEX idx_courses_dept           ON courses(department_id);
CREATE INDEX idx_sections_course        ON sections(course_id);
CREATE INDEX idx_sections_study_year    ON sections(study_year_id);
CREATE INDEX idx_assignments_course     ON course_assignments(course_id);
CREATE INDEX idx_assignments_instructor ON course_assignments(instructor_id);
CREATE INDEX idx_entries_schedule       ON schedule_entries(schedule_id);
CREATE INDEX idx_entries_section        ON schedule_entries(section_id);
CREATE INDEX idx_entries_instructor     ON schedule_entries(instructor_id);
CREATE INDEX idx_entries_room           ON schedule_entries(room_id);
CREATE INDEX idx_entries_timeslot       ON schedule_entries(time_slot_id);
CREATE INDEX idx_availability_inst      ON instructor_availability(instructor_id);
CREATE INDEX idx_log_schedule           ON ai_generation_log(schedule_id);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_users_dept             ON users(department_id);
CREATE INDEX idx_students_user          ON students(user_id);
CREATE INDEX idx_students_year          ON students(study_year_id);
CREATE INDEX idx_enrollments_student    ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_section    ON student_enrollments(section_id);


-- ================================================================
--  TRIGGER: auto-update updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_preferences_updated_at
    BEFORE UPDATE ON instructor_preferences
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- ================================================================
--  SEED DATA — TIME SLOTS
--  Sunday–Thursday  |  08:00–14:00  |  60-minute slots
-- ================================================================
INSERT INTO time_slots (day, start_time, end_time, duration_min, slot_number, is_break) VALUES
('sunday',   '08:00','09:00', 60, 1, FALSE),
('sunday',   '09:00','10:00', 60, 2, FALSE),
('sunday',   '10:00','11:00', 60, 3, FALSE),
('sunday',   '11:00','12:00', 60, 4, FALSE),
('sunday',   '12:00','13:00', 60, 5, FALSE),
('sunday',   '13:00','14:00', 60, 6, FALSE),
('monday',   '08:00','09:00', 60, 1, FALSE),
('monday',   '09:00','10:00', 60, 2, FALSE),
('monday',   '10:00','11:00', 60, 3, FALSE),
('monday',   '11:00','12:00', 60, 4, FALSE),
('monday',   '12:00','13:00', 60, 5, FALSE),
('monday',   '13:00','14:00', 60, 6, FALSE),
('tuesday',  '08:00','09:00', 60, 1, FALSE),
('tuesday',  '09:00','10:00', 60, 2, FALSE),
('tuesday',  '10:00','11:00', 60, 3, FALSE),
('tuesday',  '11:00','12:00', 60, 4, FALSE),
('tuesday',  '12:00','13:00', 60, 5, FALSE),
('tuesday',  '13:00','14:00', 60, 6, FALSE),
('wednesday','08:00','09:00', 60, 1, FALSE),
('wednesday','09:00','10:00', 60, 2, FALSE),
('wednesday','10:00','11:00', 60, 3, FALSE),
('wednesday','11:00','12:00', 60, 4, FALSE),
('wednesday','12:00','13:00', 60, 5, FALSE),
('wednesday','13:00','14:00', 60, 6, FALSE),
('thursday', '08:00','09:00', 60, 1, FALSE),
('thursday', '09:00','10:00', 60, 2, FALSE),
('thursday', '10:00','11:00', 60, 3, FALSE),
('thursday', '11:00','12:00', 60, 4, FALSE),
('thursday', '12:00','13:00', 60, 5, FALSE),
('thursday', '13:00','14:00', 60, 6, FALSE);


-- ================================================================
--  LEVEL-3 UPGRADE PATH  (keep this comment block, never delete)
-- ================================================================
--
--  To upgrade to College Level (Level 3):
--
--  STEP 1: Add colleges table
--    CREATE TABLE colleges (
--        id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--        name VARCHAR(120) NOT NULL,
--        code VARCHAR(20)  NOT NULL UNIQUE
--    );
--
--  STEP 2: Link departments to colleges
--    ALTER TABLE departments
--        ADD COLUMN college_id UUID REFERENCES colleges(id);
--
--  STEP 3: The AI engine needs ZERO changes.
--    It receives department_id as input and works identically
--    regardless of whether departments are grouped under colleges.
--
--  STEP 4: Add a college-level schedule view in the frontend (optional).
--
-- ================================================================