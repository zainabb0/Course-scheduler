BEGIN;

-- Department
INSERT INTO departments (id, name, code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Computer Engineering', 'CE')
ON CONFLICT (id) DO NOTHING;

-- Study Years
INSERT INTO study_years (id, department_id, year_number, label) VALUES
  ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 1, 'First Year'),
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 2, 'Second Year'),
  ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 3, 'Third Year'),
  ('11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 4, 'Fourth Year')
ON CONFLICT (id) DO NOTHING;

-- Admin User
INSERT INTO users (id, full_name, email, hashed_password, role, is_active) VALUES
  ('22222222-2222-2222-2222-222222222221', 'System Admin', 'admin@ce.edu',
   '$2b$12$3Baqqmr1NIm/NAzrJHnUHuSlqNr0JXE95FkhQE.qwDC83CX3LrF0a',
   'admin', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Test Student
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Test Student', 'student@ce.edu',
   '$2b$12$3Baqqmr1NIm/NAzrJHnUHuSlqNr0JXE95FkhQE.qwDC83CX3LrF0a',
   'student', '11111111-1111-1111-1111-111111111111', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Students
INSERT INTO students (id, user_id, study_year_id, enrollment_year) VALUES
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111112', 2025)
ON CONFLICT (id) DO NOTHING;

COMMIT;