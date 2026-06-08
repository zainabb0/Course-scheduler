-- ================================================================
--  Seed Data — 4 Departments
--  Computer Engineering (CE) + Software Engineering (SE)
--  + Information Technology (IT) + Cybersecurity (CS)
--
--  Password for all users: admin123
--  Hash: $2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6
-- ================================================================

-- ── Clean ────────────────────────────────────────────────────────
TRUNCATE TABLE student_enrollments     CASCADE;
TRUNCATE TABLE students                CASCADE;
TRUNCATE TABLE schedule_entries        CASCADE;
TRUNCATE TABLE ai_generation_log       CASCADE;
TRUNCATE TABLE schedules               CASCADE;
TRUNCATE TABLE course_assignments      CASCADE;
TRUNCATE TABLE sections                CASCADE;
TRUNCATE TABLE courses                 CASCADE;
TRUNCATE TABLE instructor_availability CASCADE;
TRUNCATE TABLE instructor_preferences  CASCADE;
TRUNCATE TABLE instructors             CASCADE;
TRUNCATE TABLE rooms                   CASCADE;
TRUNCATE TABLE users                   CASCADE;
TRUNCATE TABLE study_years             CASCADE;
TRUNCATE TABLE departments             CASCADE;

-- ================================================================
--  1. DEPARTMENTS
-- ================================================================
INSERT INTO departments (id, name, code) VALUES
  ('dept-ce-0001-0001-000000000001', 'Computer Engineering',   'CE'),
  ('dept-se-0001-0001-000000000002', 'Software Engineering',   'SE'),
  ('dept-it-0001-0001-000000000003', 'Information Technology', 'IT'),
  ('dept-cy-0001-0001-000000000004', 'Cybersecurity',          'CY');

-- ================================================================
--  2. STUDY YEARS — all 4 departments
-- ================================================================
INSERT INTO study_years (id, department_id, year_number, label, student_count) VALUES
  -- CE
  ('sy-ce-1', 'dept-ce-0001-0001-000000000001', 1, 'First Year', 0),
  ('sy-ce-2', 'dept-ce-0001-0001-000000000001', 2, 'Second Year', 0),
  ('sy-ce-3', 'dept-ce-0001-0001-000000000001', 3, 'Third Year', 0),
  ('sy-ce-4', 'dept-ce-0001-0001-000000000001', 4, 'Fourth Year', 0),
  -- SE
  ('sy-se-1', 'dept-se-0001-0001-000000000002', 1, 'First Year', 0),
  ('sy-se-2', 'dept-se-0001-0001-000000000002', 2, 'Second Year', 0),
  ('sy-se-3', 'dept-se-0001-0001-000000000002', 3, 'Third Year', 0),
  ('sy-se-4', 'dept-se-0001-0001-000000000002', 4, 'Fourth Year', 0),
  -- IT
  ('sy-it-1', 'dept-it-0001-0001-000000000003', 1, 'First Year', 0),
  ('sy-it-2', 'dept-it-0001-0001-000000000003', 2, 'Second Year', 0),
  ('sy-it-3', 'dept-it-0001-0001-000000000003', 3, 'Third Year', 0),
  ('sy-it-4', 'dept-it-0001-0001-000000000003', 4, 'Fourth Year', 0),
  -- CY
  ('sy-cy-1', 'dept-cy-0001-0001-000000000004', 1, 'First Year', 0),
  ('sy-cy-2', 'dept-cy-0001-0001-000000000004', 2, 'Second Year', 0),
  ('sy-cy-3', 'dept-cy-0001-0001-000000000004', 3, 'Third Year', 0),
  ('sy-cy-4', 'dept-cy-0001-0001-000000000004', 4, 'Fourth Year', 0);

-- ================================================================
--  3. ADMIN USER
-- ================================================================
INSERT INTO users (id, full_name, email, hashed_password, role, is_active) VALUES
  ('user-admin-000000000000000000001', 'System Admin', 'admin@uni.edu',
   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'admin', TRUE);

-- ================================================================
--  4. INSTRUCTOR USERS — CE (10 instructors)
-- ================================================================
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active) VALUES
  ('user-ce-i01', 'د. أحمد محمد علي',        'ahmed.ali@ce.edu',      '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i02', 'د. سارة حسين',             'sara.hussein@ce.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i03', 'أ.د. محمد الراشد',         'm.rashid@ce.edu',       '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i04', 'م.م. علي حسن',             'ali.hassan@ce.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i05', 'د. زينب كاظم',             'zainab.kazim@ce.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i06', 'م.م. مصطفى عدنان',         'mustafa.adnan@ce.edu',  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i07', 'د. رنا إحسان',             'rana.ihsan@ce.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i08', 'أ.د. سفاء رضا',           'safa.rida@ce.edu',      '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i09', 'د. محمود جابر',            'mahmoud.jaber@ce.edu',  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE),
  ('user-ce-i10', 'د. ليلى حسان',             'leila.hassan@ce.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-ce-0001-0001-000000000001', TRUE);

-- SE (10 instructors)
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active) VALUES
  ('user-se-i01', 'د. خالد إبراهيم',          'khalid.ibrahim@se.edu', '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i02', 'د. نور الهدى',             'noor.huda@se.edu',      '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i03', 'م.م. حسين عباس',           'hussein.abbas@se.edu',  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i04', 'د. لمى عبد الله',          'lama.abdullah@se.edu',  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i05', 'أ.د. عمر فاروق',           'omar.farouk@se.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i06', 'م.م. دينا محمود',          'dina.mahmoud@se.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i07', 'د. باسم جاسم',             'basim.jasim@se.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i08', 'د. وردة كريم',             'warda.karim@se.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i09', 'أ.م. سامر محمود',          'samer.mahmoud@se.edu',  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE),
  ('user-se-i10', 'د. ليان طلال',             'lian.talal@se.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-se-0001-0001-000000000002', TRUE);

-- IT (10 instructors)
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active) VALUES
  ('user-it-i01', 'د. هناء جبار',             'hanaa.jabbar@it.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i02', 'م.م. قيس ناصر',            'qais.nasser@it.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i03', 'د. مي علاء',               'may.alaa@it.edu',       '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i04', 'أ.د. طارق سعيد',           'tariq.saeed@it.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i05', 'م.م. فاطمة حميد',          'fatima.hamid@it.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i06', 'د. وسام كريم',             'wissam.karim@it.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i07', 'د. حيدر سلمان',            'hyder.salman@it.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i08', 'م.م. ريم زكي',            'reem.zaki@it.edu',      '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i09', 'د. عادل فاضل',            'adel.fadel@it.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE),
  ('user-it-i10', 'د. سحر جاسم',             'sahar.jasim@it.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-it-0001-0001-000000000003', TRUE);

-- CY (10 instructors)
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active) VALUES
  ('user-cy-i01', 'د. عمار طاهر',             'ammar.tahir@cy.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i02', 'م.م. شذى رياض',            'shatha.riyad@cy.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i03', 'أ.د. كرار علي',            'karar.ali@cy.edu',      '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i04', 'د. سلمى عبد الرزاق',       'salma.razzaq@cy.edu',   '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i05', 'م.م. يوسف حامد',           'yusuf.hamid@cy.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i06', 'د. إيمان صالح',            'iman.salih@cy.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i07', 'أ.م. ماجد صالح',           'majid.salih@cy.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i08', 'د. مها كريم',              'maha.karim@cy.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i09', 'د. رهف نوري',              'rahaf.nouri@cy.edu',    '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE),
  ('user-cy-i10', 'د. جاسر نجم',              'jasir.najm@cy.edu',     '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'instructor', 'dept-cy-0001-0001-000000000004', TRUE);

-- Additional instructor users to reach 20 per department
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active)
SELECT
  concat('user-', code, '-i', lpad(num::text,2,'0')),
  concat('د. ', name, ' إضافي ', num),
  concat('extra.', code, num, '@', lower(code), '.edu'),
  '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6',
  'instructor',
  dept_id,
  TRUE
FROM (VALUES
  ('dept-ce-0001-0001-000000000001', 'ce', 'CE'),
  ('dept-se-0001-0001-000000000002', 'se', 'SE'),
  ('dept-it-0001-0001-000000000003', 'it', 'IT'),
  ('dept-cy-0001-0001-000000000004', 'cy', 'CY')
) AS d(dept_id, code, name)
CROSS JOIN generate_series(11,20) AS g(num);

-- ================================================================
--  5. INSTRUCTORS PROFILES
-- ================================================================
-- CE
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week) VALUES
  ('inst-ce-01', 'user-ce-i01', 'dept-ce-0001-0001-000000000001', 'Dr.',   18),
  ('inst-ce-02', 'user-ce-i02', 'dept-ce-0001-0001-000000000001', 'Dr.',   18),
  ('inst-ce-03', 'user-ce-i03', 'dept-ce-0001-0001-000000000001', 'Prof.', 16),
  ('inst-ce-04', 'user-ce-i04', 'dept-ce-0001-0001-000000000001', 'M.Sc.', 20),
  ('inst-ce-05', 'user-ce-i05', 'dept-ce-0001-0001-000000000001', 'Dr.',   18),
  ('inst-ce-06', 'user-ce-i06', 'dept-ce-0001-0001-000000000001', 'M.Sc.', 20),
  ('inst-ce-07', 'user-ce-i07', 'dept-ce-0001-0001-000000000001', 'Dr.',   18),
  ('inst-ce-08', 'user-ce-i08', 'dept-ce-0001-0001-000000000001', 'Prof.', 16),
  ('inst-ce-09', 'user-ce-i09', 'dept-ce-0001-0001-000000000001', 'Dr.',   18),
  ('inst-ce-10', 'user-ce-i10', 'dept-ce-0001-0001-000000000001', 'M.Sc.', 20);

-- SE
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week) VALUES
  ('inst-se-01', 'user-se-i01', 'dept-se-0001-0001-000000000002', 'Dr.',   18),
  ('inst-se-02', 'user-se-i02', 'dept-se-0001-0001-000000000002', 'Dr.',   18),
  ('inst-se-03', 'user-se-i03', 'dept-se-0001-0001-000000000002', 'M.Sc.', 20),
  ('inst-se-04', 'user-se-i04', 'dept-se-0001-0001-000000000002', 'Dr.',   18),
  ('inst-se-05', 'user-se-i05', 'dept-se-0001-0001-000000000002', 'Prof.', 16),
  ('inst-se-06', 'user-se-i06', 'dept-se-0001-0001-000000000002', 'M.Sc.', 20),
  ('inst-se-07', 'user-se-i07', 'dept-se-0001-0001-000000000002', 'Dr.',   18),
  ('inst-se-08', 'user-se-i08', 'dept-se-0001-0001-000000000002', 'Dr.',   18),
  ('inst-se-09', 'user-se-i09', 'dept-se-0001-0001-000000000002', 'M.Sc.', 20),
  ('inst-se-10', 'user-se-i10', 'dept-se-0001-0001-000000000002', 'Dr.',   18);

-- IT
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week) VALUES
  ('inst-it-01', 'user-it-i01', 'dept-it-0001-0001-000000000003', 'Dr.',   18),
  ('inst-it-02', 'user-it-i02', 'dept-it-0001-0001-000000000003', 'M.Sc.', 20),
  ('inst-it-03', 'user-it-i03', 'dept-it-0001-0001-000000000003', 'Dr.',   18),
  ('inst-it-04', 'user-it-i04', 'dept-it-0001-0001-000000000003', 'Prof.', 16),
  ('inst-it-05', 'user-it-i05', 'dept-it-0001-0001-000000000003', 'M.Sc.', 20),
  ('inst-it-06', 'user-it-i06', 'dept-it-0001-0001-000000000003', 'Dr.',   18),
  ('inst-it-07', 'user-it-i07', 'dept-it-0001-0001-000000000003', 'Dr.',   18),
  ('inst-it-08', 'user-it-i08', 'dept-it-0001-0001-000000000003', 'M.Sc.', 20),
  ('inst-it-09', 'user-it-i09', 'dept-it-0001-0001-000000000003', 'Dr.',   18),
  ('inst-it-10', 'user-it-i10', 'dept-it-0001-0001-000000000003', 'Dr.',   18);

-- CY
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week) VALUES
  ('inst-cy-01', 'user-cy-i01', 'dept-cy-0001-0001-000000000004', 'Dr.',   18),
  ('inst-cy-02', 'user-cy-i02', 'dept-cy-0001-0001-000000000004', 'M.Sc.', 20),
  ('inst-cy-03', 'user-cy-i03', 'dept-cy-0001-0001-000000000004', 'Prof.', 16),
  ('inst-cy-04', 'user-cy-i04', 'dept-cy-0001-0001-000000000004', 'Dr.',   18),
  ('inst-cy-05', 'user-cy-i05', 'dept-cy-0001-0001-000000000004', 'M.Sc.', 20),
  ('inst-cy-06', 'user-cy-i06', 'dept-cy-0001-0001-000000000004', 'Dr.',   18),
  ('inst-cy-07', 'user-cy-i07', 'dept-cy-0001-0001-000000000004', 'Dr.',   18),
  ('inst-cy-08', 'user-cy-i08', 'dept-cy-0001-0001-000000000004', 'M.Sc.', 20),
  ('inst-cy-09', 'user-cy-i09', 'dept-cy-0001-0001-000000000004', 'Dr.',   18),
  ('inst-cy-10', 'user-cy-i10', 'dept-cy-0001-0001-000000000004', 'Prof.', 16);

-- Additional instructor profiles for extra users
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week)
SELECT
  concat('inst-', code, '-', lpad(num::text,2,'0')),
  concat('user-', code, '-i', lpad(num::text,2,'0')),
  dept_id,
  'Dr.',
  18
FROM (VALUES
  ('dept-ce-0001-0001-000000000001', 'ce'),
  ('dept-se-0001-0001-000000000002', 'se'),
  ('dept-it-0001-0001-000000000003', 'it'),
  ('dept-cy-0001-0001-000000000004', 'cy')
) AS d(dept_id, code)
CROSS JOIN generate_series(11,20) AS g(num);

-- ================================================================
--  6. INSTRUCTOR PREFERENCES — متنوعة
-- ================================================================
INSERT INTO instructor_preferences (instructor_id, preferred_time, preferred_days_off, max_consecutive_hrs) VALUES
  -- CE — تنويع في الأوقات والأيام
  ('inst-ce-01', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-ce-02', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-ce-03', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-ce-04', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-ce-05', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-ce-06', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-ce-07', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-ce-08', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-ce-09', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-ce-10', 'no_preference', ARRAY['thursday']::weekday[],            3),
  -- SE
  ('inst-se-01', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-se-02', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-se-03', 'morning',       ARRAY['thursday']::weekday[],            4),
  ('inst-se-04', 'no_preference', ARRAY['thursday']::weekday[],            3),
  ('inst-se-05', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-se-06', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-se-07', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-se-08', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-se-09', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-se-10', 'morning',       ARRAY['thursday']::weekday[],            3),
  -- IT
  ('inst-it-01', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-it-02', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-it-03', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-it-04', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-it-05', 'afternoon',     ARRAY['thursday']::weekday[],            4),
  ('inst-it-06', 'morning',       ARRAY[]::weekday[],                      3),
  ('inst-it-07', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-it-08', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-it-09', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-it-10', 'morning',       ARRAY[]::weekday[],                      3),
  -- CY
  ('inst-cy-01', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-cy-02', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-cy-03', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-cy-04', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-cy-05', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-cy-06', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-cy-07', 'afternoon',     ARRAY[]::weekday[],                      4),
  ('inst-cy-08', 'no_preference', ARRAY['wednesday','thursday']::weekday[], 3),
  ('inst-cy-09', 'morning',       ARRAY['thursday']::weekday[],            3),
  ('inst-cy-10', 'afternoon',     ARRAY[]::weekday[],                      4);

-- ================================================================
--  7. INSTRUCTOR AVAILABILITY — كل أستاذ له أوقات محددة
-- ================================================================
INSERT INTO instructor_availability (id, instructor_id, day, start_time, end_time, is_available)
SELECT gen_random_uuid()::text, v.instructor_id, v.day::weekday, v.start_time, v.end_time, TRUE
FROM (VALUES
  ('inst-ce-01','sunday','08:00','09:30'),
  ('inst-ce-01','monday','09:30','11:00'),
  ('inst-ce-01','wednesday','13:00','14:30'),
  ('inst-ce-02','sunday','11:00','12:30'),
  ('inst-ce-02','tuesday','13:00','14:30'),
  ('inst-ce-02','thursday','08:00','09:30'),
  ('inst-ce-03','monday','08:00','09:30'),
  ('inst-ce-03','wednesday','09:30','11:00'),
  ('inst-ce-03','thursday','13:00','14:30'),
  ('inst-ce-04','sunday','13:00','14:30'),
  ('inst-ce-04','tuesday','08:00','09:30'),
  ('inst-ce-04','thursday','11:00','12:30'),
  ('inst-ce-05','monday','11:00','12:30'),
  ('inst-ce-05','wednesday','14:30','16:00'),
  ('inst-ce-05','thursday','09:30','11:00'),
  ('inst-ce-06','sunday','08:00','09:30'),
  ('inst-ce-06','tuesday','14:30','16:00'),
  ('inst-ce-06','wednesday','11:00','12:30'),
  ('inst-ce-07','monday','13:00','14:30'),
  ('inst-ce-07','tuesday','08:00','09:30'),
  ('inst-ce-07','thursday','11:00','12:30'),
  ('inst-ce-08','sunday','11:00','12:30'),
  ('inst-ce-08','wednesday','08:00','09:30'),
  ('inst-ce-08','thursday','14:30','16:00'),
  ('inst-ce-09','monday','09:30','11:00'),
  ('inst-ce-09','tuesday','13:00','14:30'),
  ('inst-ce-09','wednesday','14:30','16:00'),
  ('inst-ce-10','sunday','13:00','14:30'),
  ('inst-ce-10','tuesday','09:30','11:00'),
  ('inst-ce-10','thursday','08:00','09:30'),
  ('inst-se-01','sunday','08:00','09:30'),
  ('inst-se-01','monday','11:00','12:30'),
  ('inst-se-01','thursday','13:00','14:30'),
  ('inst-se-02','monday','08:00','09:30'),
  ('inst-se-02','wednesday','13:00','14:30'),
  ('inst-se-02','thursday','11:00','12:30'),
  ('inst-se-03','sunday','11:00','12:30'),
  ('inst-se-03','tuesday','13:00','14:30'),
  ('inst-se-03','wednesday','08:00','09:30'),
  ('inst-se-04','monday','09:30','11:00'),
  ('inst-se-04','tuesday','08:00','09:30'),
  ('inst-se-04','thursday','14:30','16:00'),
  ('inst-se-05','sunday','13:00','14:30'),
  ('inst-se-05','wednesday','09:30','11:00'),
  ('inst-se-05','thursday','11:00','12:30'),
  ('inst-se-06','monday','13:00','14:30'),
  ('inst-se-06','tuesday','11:00','12:30'),
  ('inst-se-06','wednesday','14:30','16:00'),
  ('inst-se-07','sunday','08:00','09:30'),
  ('inst-se-07','tuesday','09:30','11:00'),
  ('inst-se-07','thursday','08:00','09:30'),
  ('inst-se-08','monday','11:00','12:30'),
  ('inst-se-08','wednesday','13:00','14:30'),
  ('inst-se-08','thursday','14:30','16:00'),
  ('inst-se-09','sunday','09:30','11:00'),
  ('inst-se-09','tuesday','14:30','16:00'),
  ('inst-se-09','wednesday','08:00','09:30'),
  ('inst-se-10','monday','08:00','09:30'),
  ('inst-se-10','thursday','09:30','11:00'),
  ('inst-se-10','wednesday','13:00','14:30'),
  ('inst-it-01','sunday','08:00','09:30'),
  ('inst-it-01','monday','13:00','14:30'),
  ('inst-it-01','wednesday','11:00','12:30'),
  ('inst-it-02','tuesday','08:00','09:30'),
  ('inst-it-02','wednesday','09:30','11:00'),
  ('inst-it-02','thursday','13:00','14:30'),
  ('inst-it-03','sunday','11:00','12:30'),
  ('inst-it-03','monday','08:00','09:30'),
  ('inst-it-03','thursday','14:30','16:00'),
  ('inst-it-04','tuesday','09:30','11:00'),
  ('inst-it-04','wednesday','13:00','14:30'),
  ('inst-it-04','thursday','08:00','09:30'),
  ('inst-it-05','sunday','13:00','14:30'),
  ('inst-it-05','monday','11:00','12:30'),
  ('inst-it-05','wednesday','14:30','16:00'),
  ('inst-it-06','tuesday','11:00','12:30'),
  ('inst-it-06','thursday','09:30','11:00'),
  ('inst-it-06','wednesday','08:00','09:30'),
  ('inst-it-07','sunday','08:00','09:30'),
  ('inst-it-07','monday','09:30','11:00'),
  ('inst-it-07','thursday','13:00','14:30'),
  ('inst-it-08','tuesday','13:00','14:30'),
  ('inst-it-08','wednesday','11:00','12:30'),
  ('inst-it-08','thursday','14:30','16:00'),
  ('inst-it-09','sunday','11:00','12:30'),
  ('inst-it-09','monday','13:00','14:30'),
  ('inst-it-09','thursday','08:00','09:30'),
  ('inst-it-10','tuesday','09:30','11:00'),
  ('inst-it-10','wednesday','08:00','09:30'),
  ('inst-it-10','thursday','11:00','12:30'),
  ('inst-cy-01','sunday','08:00','09:30'),
  ('inst-cy-01','monday','13:00','14:30'),
  ('inst-cy-01','thursday','09:30','11:00'),
  ('inst-cy-02','sunday','11:00','12:30'),
  ('inst-cy-02','tuesday','13:00','14:30'),
  ('inst-cy-02','wednesday','08:00','09:30'),
  ('inst-cy-03','monday','08:00','09:30'),
  ('inst-cy-03','wednesday','09:30','11:00'),
  ('inst-cy-03','thursday','13:00','14:30'),
  ('inst-cy-04','sunday','13:00','14:30'),
  ('inst-cy-04','monday','11:00','12:30'),
  ('inst-cy-04','wednesday','14:30','16:00'),
  ('inst-cy-05','tuesday','08:00','09:30'),
  ('inst-cy-05','thursday','09:30','11:00'),
  ('inst-cy-05','wednesday','13:00','14:30'),
  ('inst-cy-06','sunday','09:30','11:00'),
  ('inst-cy-06','monday','13:00','14:30'),
  ('inst-cy-06','thursday','08:00','09:30'),
  ('inst-cy-07','tuesday','11:00','12:30'),
  ('inst-cy-07','wednesday','08:00','09:30'),
  ('inst-cy-07','thursday','14:30','16:00'),
  ('inst-cy-08','sunday','08:00','09:30'),
  ('inst-cy-08','monday','09:30','11:00'),
  ('inst-cy-08','thursday','13:00','14:30'),
  ('inst-cy-09','tuesday','13:00','14:30'),
  ('inst-cy-09','wednesday','11:00','12:30'),
  ('inst-cy-09','thursday','08:00','09:30'),
  ('inst-cy-10','sunday','11:00','12:30'),
  ('inst-cy-10','monday','13:00','14:30'),
  ('inst-cy-10','thursday','09:30','11:00')
) AS v(instructor_id, day, start_time, end_time);-- ================================================================
--  8. ROOMS
-- ================================================================
-- Shared rooms (بين كل الأقسام)
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active) VALUES
  ('room-shared-01', NULL, 'Main Auditorium',   'AUD-MAIN', 200, 'lecture', TRUE,  FALSE, TRUE, TRUE),
  ('room-shared-02', NULL, 'Conference Hall A', 'CONF-A',   100, 'lecture', TRUE,  FALSE, TRUE, TRUE),
  ('room-shared-03', NULL, 'General Lab 1',     'GEN-LAB1',  40, 'lab',     TRUE,  TRUE,  TRUE, TRUE),
  ('room-shared-04', NULL, 'General Lab 2',     'GEN-LAB2',  40, 'lab',     TRUE,  TRUE,  TRUE, TRUE),
  ('room-shared-05', NULL, 'Multimedia Studio',  'MM-STU',    60, 'lecture', TRUE,  TRUE,  TRUE, TRUE),
  ('room-shared-06', NULL, 'Flexible Workshop', 'WSK-01',    48, 'lab',     TRUE,  TRUE,  TRUE, TRUE),
  ('room-shared-07', NULL, 'Seminar Room 1',    'SEM-01',    35, 'lecture', TRUE,  FALSE, TRUE, TRUE),
  ('room-shared-08', NULL, 'Computer Lab 3',    'GEN-LAB3',  28, 'lab',     TRUE,  TRUE,  TRUE, TRUE);

-- CE rooms
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active) VALUES
  ('room-ce-01', 'dept-ce-0001-0001-000000000001', 'CE Lecture Hall A',  'CE-HALL-A',  80, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-ce-02', 'dept-ce-0001-0001-000000000001', 'CE Lecture Hall B',  'CE-HALL-B',  60, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-ce-03', 'dept-ce-0001-0001-000000000001', 'CE Computer Lab 1',  'CE-LAB-1',   30, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-ce-04', 'dept-ce-0001-0001-000000000001', 'CE Computer Lab 2',  'CE-LAB-2',   30, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-ce-05', 'dept-ce-0001-0001-000000000001', 'CE Engineering Lab', 'CE-ENG-LAB', 34, 'lab',     TRUE,  FALSE, FALSE, TRUE),
  ('room-ce-06', 'dept-ce-0001-0001-000000000001', 'CE Lecture Hall C',  'CE-HALL-C',  90, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-ce-07', 'dept-ce-0001-0001-000000000001', 'CE Design Lab',      'CE-LAB-3',   24, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-ce-08', 'dept-ce-0001-0001-000000000001', 'CE Computer Lab 3',  'CE-LAB-4',   32, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-ce-09', 'dept-ce-0001-0001-000000000001', 'CE Lecture Hall D',  'CE-HALL-D',  70, 'lecture', TRUE,  FALSE, FALSE, TRUE);

-- SE rooms
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active) VALUES
  ('room-se-01', 'dept-se-0001-0001-000000000002', 'SE Lecture Hall A',  'SE-HALL-A',  70, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-se-02', 'dept-se-0001-0001-000000000002', 'SE Lecture Hall B',  'SE-HALL-B',  50, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-se-03', 'dept-se-0001-0001-000000000002', 'SE Software Lab 1',  'SE-LAB-1',   35, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-se-04', 'dept-se-0001-0001-000000000002', 'SE Software Lab 2',  'SE-LAB-2',   35, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-se-05', 'dept-se-0001-0001-000000000002', 'SE Lecture Hall C',  'SE-HALL-C',  45, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-se-06', 'dept-se-0001-0001-000000000002', 'SE Media Lab',       'SE-LAB-3',   28, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-se-07', 'dept-se-0001-0001-000000000002', 'SE Innovation Lab',  'SE-LAB-4',   26, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-se-08', 'dept-se-0001-0001-000000000002', 'SE Seminar Room',    'SE-SEM-1',   40, 'lecture', TRUE,  FALSE, FALSE, TRUE);

-- IT rooms
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active) VALUES
  ('room-it-01', 'dept-it-0001-0001-000000000003', 'IT Lecture Hall',    'IT-HALL',    60, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-it-02', 'dept-it-0001-0001-000000000003', 'IT Lab 1',           'IT-LAB-1',   30, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-it-03', 'dept-it-0001-0001-000000000003', 'IT Lab 2',           'IT-LAB-2',   30, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-it-04', 'dept-it-0001-0001-000000000003', 'IT Lecture Hall B',  'IT-HALL-B',  50, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-it-05', 'dept-it-0001-0001-000000000003', 'IT Networking Lab',  'IT-LAB-3',   35, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-it-06', 'dept-it-0001-0001-000000000003', 'IT Workshop',        'IT-WSK',     24, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-it-07', 'dept-it-0001-0001-000000000003', 'IT Lecture Hall C',  'IT-HALL-C',  55, 'lecture', TRUE,  FALSE, FALSE, TRUE);

-- CY rooms
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active) VALUES
  ('room-cy-01', 'dept-cy-0001-0001-000000000004', 'CY Lecture Hall',    'CY-HALL',    55, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-cy-02', 'dept-cy-0001-0001-000000000004', 'CY Security Lab 1',  'CY-LAB-1',   25, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-cy-03', 'dept-cy-0001-0001-000000000004', 'CY Security Lab 2',  'CY-LAB-2',   25, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-cy-04', 'dept-cy-0001-0001-000000000004', 'CY Lecture Hall B',  'CY-HALL-B',  35, 'lecture', TRUE,  FALSE, FALSE, TRUE),
  ('room-cy-05', 'dept-cy-0001-0001-000000000004', 'CY Research Lab',    'CY-LAB-3',   20, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-cy-06', 'dept-cy-0001-0001-000000000004', 'CY Forensics Lab',   'CY-LAB-4',   22, 'lab',     TRUE,  TRUE,  FALSE, TRUE),
  ('room-cy-07', 'dept-cy-0001-0001-000000000004', 'CY Seminar Room',    'CY-SEM-1',   30, 'lecture', TRUE,  FALSE, FALSE, TRUE);

-- ================================================================
--  9. COURSES — 6 courses per year across all 4 departments
-- ================================================================
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours, lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity) VALUES
  -- Year 1
  ('crs-ce-y1-01', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Logic Circuits',         'CE-LC',   3, 2, 2, TRUE,  FALSE, 30),
  ('crs-ce-y1-02', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Computer Fundamentals',  'CE-CF',   3, 2, 2, TRUE,  FALSE, 30),
  ('crs-ce-y1-03', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Engineering Mathematics','CE-EM',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-ce-y1-04', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Physics',                'CE-PHY',  3, 2, 2, TRUE,  FALSE, 30),
  ('crs-ce-y1-05', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Programming Fundamentals','CE-PF',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-ce-y1-06', 'dept-ce-0001-0001-000000000001', 'sy-ce-1', 'Engineering Drawing',    'CE-ED',   3, 2, 0, FALSE, FALSE, 30),
  -- Year 2
  ('crs-ce-y2-01', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Digital System Design',  'CE-DSD',  3, 2, 2, TRUE,  TRUE,  25),
  ('crs-ce-y2-02', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Computer Programming',   'CE-CP',   3, 2, 2, TRUE,  TRUE,  25),
  ('crs-ce-y2-03', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Electronics',            'CE-EL',   3, 2, 2, TRUE,  FALSE, 25),
  ('crs-ce-y2-04', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Engineering Statistics', 'CE-ES',   3, 2, 0, FALSE, FALSE, 25),
  ('crs-ce-y2-05', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Microprocessors',        'CE-MP',   3, 2, 2, TRUE,  TRUE,  25),
  ('crs-ce-y2-06', 'dept-ce-0001-0001-000000000001', 'sy-ce-2', 'Software Engineering',   'CE-SE',   3, 2, 0, FALSE, FALSE, 25),
  -- Year 3
  ('crs-ce-y3-01', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Operating Systems',      'CE-OS',   3, 2, 0, FALSE, FALSE, 40),
  ('crs-ce-y3-02', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Computer Networks',      'CE-CN',   3, 2, 2, TRUE,  FALSE, 40),
  ('crs-ce-y3-03', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Database Systems',       'CE-DB',   3, 2, 0, FALSE, FALSE, 40),
  ('crs-ce-y3-04', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Embedded Systems',       'CE-ES2',  3, 2, 2, TRUE,  FALSE, 40),
  ('crs-ce-y3-05', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Algorithms',             'CE-AL',   3, 2, 0, FALSE, FALSE, 40),
  ('crs-ce-y3-06', 'dept-ce-0001-0001-000000000001', 'sy-ce-3', 'Digital Communications', 'CE-DC',   3, 2, 0, FALSE, FALSE, 40),
  -- Year 4
  ('crs-ce-y4-01', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Machine Learning',       'CE-ML',   3, 2, 0, FALSE, FALSE, 15),
  ('crs-ce-y4-02', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Cloud Computing',        'CE-CC',   3, 2, 2, TRUE,  FALSE, 15),
  ('crs-ce-y4-03', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Advanced Networks',      'CE-AN',   3, 2, 0, FALSE, FALSE, 15),
  ('crs-ce-y4-04', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Cyber Physical Systems', 'CE-CPS',  3, 2, 2, TRUE,  FALSE, 15),
  ('crs-ce-y4-05', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Advanced Control',       'CE-AC',   3, 2, 0, FALSE, FALSE, 15),
  ('crs-ce-y4-06', 'dept-ce-0001-0001-000000000001', 'sy-ce-4', 'Systems Optimization',   'CE-SO',   3, 2, 0, FALSE, FALSE, 15);

-- SE courses
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours, lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity) VALUES
  ('crs-se-y1-01', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Introduction to SE',     'SE-ISE',  3, 2, 0, FALSE, FALSE, 30),
  ('crs-se-y1-02', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Programming I',          'SE-PRG1', 3, 2, 2, TRUE,  FALSE, 30),
  ('crs-se-y1-03', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Discrete Mathematics',   'SE-DM',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-se-y1-04', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Software Tools',         'SE-ST',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-se-y1-05', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Intro to Statistics',    'SE-IS',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-se-y1-06', 'dept-se-0001-0001-000000000002', 'sy-se-1', 'Digital Logic',          'SE-DL',   3, 2, 2, TRUE,  FALSE, 30),
  ('crs-se-y2-01', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'OOP',                    'SE-OOP',  3, 2, 2, TRUE,  TRUE,  25),
  ('crs-se-y2-02', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'Data Structures',        'SE-DS',   3, 2, 2, TRUE,  TRUE,  25),
  ('crs-se-y2-03', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'Software Design',        'SE-SD',   3, 2, 0, FALSE, FALSE, 25),
  ('crs-se-y2-04', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'Software Architecture',   'SE-SA',   3, 2, 0, FALSE, FALSE, 25),
  ('crs-se-y2-05', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'Operating Systems',      'SE-OS',   3, 2, 2, TRUE,  TRUE,  25),
  ('crs-se-y2-06', 'dept-se-0001-0001-000000000002', 'sy-se-2', 'Human Computer Interaction', 'SE-HCI', 3, 2, 0, FALSE, FALSE, 25),
  ('crs-se-y3-01', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'Software Testing',       'SE-SWT',  3, 2, 2, TRUE,  FALSE, 35),
  ('crs-se-y3-02', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'Web Development',        'SE-WD',   3, 2, 2, TRUE,  FALSE, 35),
  ('crs-se-y3-03', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'Database Design',        'SE-DD',   3, 2, 0, FALSE, FALSE, 35),
  ('crs-se-y3-04', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'Project Management',     'SE-PM',   3, 2, 0, FALSE, FALSE, 35),
  ('crs-se-y3-05', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'DevOps',                 'SE-DO',   3, 2, 2, TRUE,  FALSE, 35),
  ('crs-se-y3-06', 'dept-se-0001-0001-000000000002', 'sy-se-3', 'Mobile UX',             'SE-MUX',  3, 2, 0, FALSE, FALSE, 35),
  ('crs-se-y4-01', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'AI & ML',                'SE-AML',  3, 2, 0, FALSE, FALSE, 20),
  ('crs-se-y4-02', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'Mobile Development',     'SE-MOB',  3, 2, 2, TRUE,  FALSE, 20),
  ('crs-se-y4-03', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'Cloud Engineering',      'SE-CE',   3, 2, 2, TRUE,  FALSE, 20),
  ('crs-se-y4-04', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'Enterprise Systems',     'SE-ES',   3, 2, 0, FALSE, FALSE, 20),
  ('crs-se-y4-05', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'Software Security',      'SE-SS',   3, 2, 2, TRUE,  FALSE, 20),
  ('crs-se-y4-06', 'dept-se-0001-0001-000000000002', 'sy-se-4', 'Data Analytics',         'SE-DA',   3, 2, 0, FALSE, FALSE, 20);

-- IT courses
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours, lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity) VALUES
  ('crs-it-y1-01', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'IT Fundamentals',        'IT-FUND', 3, 2, 2, TRUE,  FALSE, 28),
  ('crs-it-y1-02', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'Computer Networks I',    'IT-CN1',  3, 2, 0, FALSE, FALSE, 28),
  ('crs-it-y1-03', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'Intro to Programming',    'IT-IP',   3, 2, 2, TRUE,  FALSE, 28),
  ('crs-it-y1-04', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'Math for IT',            'IT-MATH', 3, 2, 0, FALSE, FALSE, 28),
  ('crs-it-y1-05', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'Operating Systems I',     'IT-OS1',  3, 2, 0, FALSE, FALSE, 28),
  ('crs-it-y1-06', 'dept-it-0001-0001-000000000003', 'sy-it-1', 'Database Concepts',       'IT-DB',   3, 2, 2, TRUE,  FALSE, 28),
  ('crs-it-y2-01', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'Network Administration', 'IT-NA',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-it-y2-02', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'Database Admin',         'IT-DA',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-it-y2-03', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'Systems Administration', 'IT-SA',   3, 2, 0, FALSE, FALSE, 22),
  ('crs-it-y2-04', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'IT Security',            'IT-SEC',  3, 2, 2, TRUE,  FALSE, 22),
  ('crs-it-y2-05', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'Web Systems',            'IT-WS',   3, 2, 0, FALSE, FALSE, 22),
  ('crs-it-y2-06', 'dept-it-0001-0001-000000000003', 'sy-it-2', 'Data Communication',     'IT-DC',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-it-y3-01', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'Cloud Infrastructure',   'IT-CI',   3, 2, 2, TRUE,  FALSE, 30),
  ('crs-it-y3-02', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'Systems Security',       'IT-SS',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-it-y3-03', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'Virtualization',         'IT-VIRT', 3, 2, 2, TRUE,  FALSE, 30),
  ('crs-it-y3-04', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'Database Security',      'IT-DS',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-it-y3-05', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'AI Fundamentals',        'IT-AI',   3, 2, 0, FALSE, FALSE, 30),
  ('crs-it-y3-06', 'dept-it-0001-0001-000000000003', 'sy-it-3', 'Network Design',         'IT-ND',   3, 2, 2, TRUE,  FALSE, 30),
  ('crs-it-y4-01', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'Big Data',               'IT-BD',   3, 2, 2, TRUE,  FALSE, 18),
  ('crs-it-y4-02', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'IoT Systems',            'IT-IOT',  3, 2, 2, TRUE,  FALSE, 18),
  ('crs-it-y4-03', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'Advanced Networking',    'IT-AN',   3, 2, 2, TRUE,  FALSE, 18),
  ('crs-it-y4-04', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'Information Systems',    'IT-IS',   3, 2, 0, FALSE, FALSE, 18),
  ('crs-it-y4-05', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'Cyber Infrastructure',   'IT-CI2',  3, 2, 2, TRUE,  FALSE, 18),
  ('crs-it-y4-06', 'dept-it-0001-0001-000000000003', 'sy-it-4', 'Tech Innovation',        'IT-TI',   3, 2, 0, FALSE, FALSE, 18);

-- CY courses
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours, lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity) VALUES
  ('crs-cy-y1-01', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Intro to Cybersecurity', 'CY-ICS',  3, 2, 0, FALSE, FALSE, 25),
  ('crs-cy-y1-02', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Linux Fundamentals',     'CY-LX',   3, 2, 2, TRUE,  FALSE, 25),
  ('crs-cy-y1-03', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Network Basics',         'CY-NB',   3, 2, 2, TRUE,  FALSE, 25),
  ('crs-cy-y1-04', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Risk Management',        'CY-RM',   3, 2, 0, FALSE, FALSE, 25),
  ('crs-cy-y1-05', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Programming Basics',     'CY-PB',   3, 2, 2, TRUE,  FALSE, 25),
  ('crs-cy-y1-06', 'dept-cy-0001-0001-000000000004', 'sy-cy-1', 'Information Assurance',  'CY-IA',   3, 2, 0, FALSE, FALSE, 25),
  ('crs-cy-y2-01', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'Network Security',       'CY-NS',   3, 2, 2, TRUE,  FALSE, 20),
  ('crs-cy-y2-02', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'Cryptography',           'CY-CR',   3, 2, 0, FALSE, FALSE, 20),
  ('crs-cy-y2-03', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'Security Policies',      'CY-SP',   3, 2, 0, FALSE, FALSE, 20),
  ('crs-cy-y2-04', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'Penetration Testing',    'CY-PT',   3, 2, 2, TRUE,  FALSE, 20),
  ('crs-cy-y2-05', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'System Hardening',       'CY-SH',   3, 2, 2, TRUE,  FALSE, 20),
  ('crs-cy-y2-06', 'dept-cy-0001-0001-000000000004', 'sy-cy-2', 'Secure Coding',          'CY-SC',   3, 2, 0, FALSE, FALSE, 20),
  ('crs-cy-y3-01', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Ethical Hacking',        'CY-EH',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-cy-y3-02', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Digital Forensics',      'CY-DF',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-cy-y3-03', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Incident Response',      'CY-IR',   3, 2, 0, FALSE, FALSE, 22),
  ('crs-cy-y3-04', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Forensic Analysis',      'CY-FA',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-cy-y3-05', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Security Architecture',   'CY-SA',   3, 2, 0, FALSE, FALSE, 22),
  ('crs-cy-y3-06', 'dept-cy-0001-0001-000000000004', 'sy-cy-3', 'Cloud Security',         'CY-CS',   3, 2, 2, TRUE,  FALSE, 22),
  ('crs-cy-y4-01', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Malware Analysis',       'CY-MA',   3, 2, 2, TRUE,  FALSE, 15),
  ('crs-cy-y4-02', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Security Management',    'CY-SM',   3, 2, 0, FALSE, FALSE, 15),
  ('crs-cy-y4-03', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Advanced Cryptography',   'CY-AC',   3, 2, 2, TRUE,  FALSE, 15),
  ('crs-cy-y4-04', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Cyber Risk',             'CY-CR2',  3, 2, 0, FALSE, FALSE, 15),
  ('crs-cy-y4-05', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Security Governance',    'CY-SG',   3, 2, 0, FALSE, FALSE, 15),
  ('crs-cy-y4-06', 'dept-cy-0001-0001-000000000004', 'sy-cy-4', 'Professional Ethics',    'CY-PE',   3, 2, 0, FALSE, FALSE, 15);

-- ================================================================
--  10. SECTIONS
-- ================================================================
-- CE Year 1 — single section
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 30
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-1';

-- CE Year 2 — two sections for has_sections=TRUE and smaller lab sections
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 14
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-2' AND c.has_sections = TRUE;
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'B', 11
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-2' AND c.has_sections = TRUE;
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 24
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-2' AND c.has_sections = FALSE;

-- CE Year 3 & 4
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 38
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-3';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 18
FROM courses c WHERE c.department_id = 'dept-ce-0001-0001-000000000001' AND c.study_year_id = 'sy-ce-4';

-- SE sections
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 30
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-1';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 13
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-2' AND c.has_sections = TRUE;
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'B', 12
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-2' AND c.has_sections = TRUE;
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 23
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-2' AND c.has_sections = FALSE;
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 32
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-3';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 20
FROM courses c WHERE c.department_id = 'dept-se-0001-0001-000000000002' AND c.study_year_id = 'sy-se-4';

-- IT sections
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 28
FROM courses c WHERE c.department_id = 'dept-it-0001-0001-000000000003' AND c.study_year_id = 'sy-it-1';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 20
FROM courses c WHERE c.department_id = 'dept-it-0001-0001-000000000003' AND c.study_year_id = 'sy-it-2';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 30
FROM courses c WHERE c.department_id = 'dept-it-0001-0001-000000000003' AND c.study_year_id = 'sy-it-3';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 18
FROM courses c WHERE c.department_id = 'dept-it-0001-0001-000000000003' AND c.study_year_id = 'sy-it-4';

-- CY sections
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 25
FROM courses c WHERE c.department_id = 'dept-cy-0001-0001-000000000004' AND c.study_year_id = 'sy-cy-1';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 20
FROM courses c WHERE c.department_id = 'dept-cy-0001-0001-000000000004' AND c.study_year_id = 'sy-cy-2';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 22
FROM courses c WHERE c.department_id = 'dept-cy-0001-0001-000000000004' AND c.study_year_id = 'sy-cy-3';
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT gen_random_uuid()::text, c.id, c.study_year_id, 'A', 18
FROM courses c WHERE c.department_id = 'dept-cy-0001-0001-000000000004' AND c.study_year_id = 'sy-cy-4';

-- ================================================================
--  11. COURSE ASSIGNMENTS — Fall 2026-2027
-- ================================================================
-- CE
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester) VALUES
  (gen_random_uuid()::text, 'crs-ce-y1-01', 'inst-ce-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-01', 'inst-ce-04', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-02', 'inst-ce-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-02', 'inst-ce-06', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-03', 'inst-ce-03', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-04', 'inst-ce-05', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y1-04', 'inst-ce-04', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-01', 'inst-it-05', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-01', 'inst-ce-06', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-02', 'inst-ce-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-02', 'inst-ce-04', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-03', 'inst-ce-05', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-03', 'inst-ce-07', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y2-04', 'inst-ce-07', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y3-01', 'inst-se-08', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y3-02', 'inst-ce-08', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y3-02', 'inst-ce-06', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y3-03', 'inst-ce-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y4-01', 'inst-ce-08', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y4-02', 'inst-ce-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y4-02', 'inst-ce-04', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-ce-y4-03', 'inst-ce-05', 'lecture', '2026-2027', 'fall');

-- SE
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester) VALUES
  (gen_random_uuid()::text, 'crs-se-y1-01', 'inst-ce-03', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y1-02', 'inst-se-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y1-02', 'inst-se-03', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y1-03', 'inst-se-05', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y2-01', 'inst-se-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y2-01', 'inst-se-06', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y2-02', 'inst-se-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y2-02', 'inst-se-03', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y2-03', 'inst-se-07', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y3-01', 'inst-se-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y3-01', 'inst-se-06', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y3-02', 'inst-se-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y3-02', 'inst-se-03', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y3-03', 'inst-se-07', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y4-01', 'inst-se-05', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y4-02', 'inst-se-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-se-y4-02', 'inst-se-06', 'lab',     '2026-2027', 'fall');

-- IT
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester) VALUES
  (gen_random_uuid()::text, 'crs-it-y1-01', 'inst-it-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y1-01', 'inst-it-02', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y1-02', 'inst-it-03', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y2-01', 'inst-it-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y2-01', 'inst-it-05', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y2-02', 'inst-it-06', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y2-02', 'inst-it-02', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y3-01', 'inst-it-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y3-01', 'inst-it-05', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y3-02', 'inst-cy-06', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y4-01', 'inst-it-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y4-01', 'inst-it-02', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y4-02', 'inst-it-06', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-it-y4-02', 'inst-it-05', 'lab',     '2026-2027', 'fall');

-- CY
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester) VALUES
  (gen_random_uuid()::text, 'crs-cy-y1-01', 'inst-cy-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y1-02', 'inst-cy-02', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y1-02', 'inst-se-05', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y2-01', 'inst-it-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y2-01', 'inst-cy-02', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y2-02', 'inst-cy-03', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y3-01', 'inst-cy-06', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y3-01', 'inst-cy-05', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y3-02', 'inst-cy-01', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y3-02', 'inst-cy-02', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y4-01', 'inst-cy-04', 'lecture', '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y4-01', 'inst-cy-05', 'lab',     '2026-2027', 'fall'),
  (gen_random_uuid()::text, 'crs-cy-y4-02', 'inst-cy-06', 'lecture', '2026-2027', 'fall');

-- Duplicate course assignments for additional academic years
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester)
SELECT
  gen_random_uuid()::text,
  course_id,
  instructor_id,
  session_type,
  '2025-2026',
  semester
FROM course_assignments
WHERE academic_year = '2026-2027';

INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester)
SELECT
  gen_random_uuid()::text,
  course_id,
  instructor_id,
  session_type,
  '2024-2025',
  semester
FROM course_assignments
WHERE academic_year = '2026-2027';

-- ================================================================
--  12. SAMPLE STUDENTS — توزيع مختلف على المراحل
-- ================================================================
WITH student_setup AS (
  SELECT
    gen_random_uuid()::text AS id,
    concat(
      concat(dept.code, ' Year ', sy.year_number, ' Student '),
      lpad(seq::text, 2, '0')
    ) AS full_name,
    concat('student.', lower(dept.code), sy.year_number, '.', lpad(seq::text, 2, '0'), '@uni.edu') AS email,
    dept.id AS department_id,
    sy.id AS study_year_id,
    CASE sy.year_number
      WHEN 1 THEN 2026
      WHEN 2 THEN 2025
      WHEN 3 THEN 2024
      ELSE 2023
    END AS enrollment_year
  FROM departments dept
  JOIN study_years sy ON sy.department_id = dept.id
  CROSS JOIN generate_series(1,20) AS seq
),
inserted_users AS (
  INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active)
  SELECT id, full_name, email, '$2b$12$nmlngOatRD06mIp1Hg/tHOZCM2NACfP8enC8Pg5GYS5ON0PpnnCk6', 'student', department_id, TRUE
  FROM student_setup
  RETURNING id, id AS user_id
)
INSERT INTO students (id, user_id, department_id, study_year_id, enrollment_year)
SELECT gen_random_uuid()::text, ss.id, ss.department_id, ss.study_year_id, ss.enrollment_year
FROM student_setup ss;