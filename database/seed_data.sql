-- ================================================================
--  Real Seed Data — Computer Engineering Department
--  v1.2 — UUID IDs, correct bcrypt hash
-- ================================================================

-- ── Clean existing data ───────────────────────────────────────
TRUNCATE TABLE student_enrollments    CASCADE;
TRUNCATE TABLE students               CASCADE;
TRUNCATE TABLE schedule_entries       CASCADE;
TRUNCATE TABLE course_assignments     CASCADE;
TRUNCATE TABLE sections               CASCADE;
TRUNCATE TABLE courses                CASCADE;
TRUNCATE TABLE instructor_availability CASCADE;
TRUNCATE TABLE instructor_preferences  CASCADE;
TRUNCATE TABLE instructors            CASCADE;
TRUNCATE TABLE rooms                  CASCADE;
TRUNCATE TABLE users                  CASCADE;
TRUNCATE TABLE study_years            CASCADE;
TRUNCATE TABLE departments            CASCADE;

-- ================================================================
--  1. DEPARTMENT
-- ================================================================
INSERT INTO departments (id, name, code) VALUES
  (uuid_generate_v4(), 'Computer Engineering', 'CE');

-- ================================================================
--  2. STUDY YEARS
-- ================================================================
INSERT INTO study_years (id, department_id, year_number, label, student_count)
SELECT uuid_generate_v4(), d.id, 1, 'First Year', 0  FROM departments d WHERE d.code='CE';
INSERT INTO study_years (id, department_id, year_number, label, student_count)
SELECT uuid_generate_v4(), d.id, 2, 'Second Year', 0 FROM departments d WHERE d.code='CE';
INSERT INTO study_years (id, department_id, year_number, label, student_count)
SELECT uuid_generate_v4(), d.id, 3, 'Third Year', 0  FROM departments d WHERE d.code='CE';
INSERT INTO study_years (id, department_id, year_number, label, student_count)
SELECT uuid_generate_v4(), d.id, 4, 'Fourth Year', 0 FROM departments d WHERE d.code='CE';

-- ================================================================
--  3. USERS — Admin
-- ================================================================
INSERT INTO users (id, full_name, email, hashed_password, role, is_active) VALUES
  (uuid_generate_v4(), 'System Admin', 'admin@ce.edu',
   '$2b$12$QC.oiEvALuiJzc18kvotl.3SOZI.CuXeX7oYbLvKekqd7aNAnZjuO', 'admin', TRUE);

-- ================================================================
--  4. USERS — Instructors
-- ================================================================
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active)
SELECT uuid_generate_v4(), v.full_name, v.email,
       '$2b$12$QC.oiEvALuiJzc18kvotl.3SOZI.CuXeX7oYbLvKekqd7aNAnZjuO',
       'instructor', d.id, TRUE
FROM departments d, (VALUES
  ('د. شيماء وليد',          'shaimaa.waleed@ce.edu'),
  ('د. اسراء بدر',            'israa.badr@ce.edu'),
  ('د. رسالن سعد',            'rasalan.saad@ce.edu'),
  ('د. اثيل نوفل',            'atheel.nawfal@ce.edu'),
  ('د. علي جواد',             'ali.jawad@ce.edu'),
  ('د. رعد سامي فياض',        'raad.sami@ce.edu'),
  ('د. ايمن جابر سلمان',      'ayman.jabir@ce.edu'),
  ('د. شيماء صفاء الدين',     'shaimaa.safaaddin@ce.edu'),
  ('د. حيدر',                 'haider@ce.edu'),
  ('د. مشتاق طالب',           'mushtaq.talib@ce.edu'),
  ('م.م. عبد الله',           'abdallah@ce.edu'),
  ('م.م. الرا موفق',          'alraa.mwafaq@ce.edu'),
  ('م.م. علي سعدي',           'ali.saadi@ce.edu'),
  ('م.م. سيف عبد الجاسم',    'saif.abdaljasim@ce.edu'),
  ('م.م. مصطفى عدنان',        'mustafa.adnan@ce.edu'),
  ('م.م. احمد علي',           'ahmed.ali@ce.edu'),
  ('م.م. رنا احسان',          'rana.ihsan@ce.edu'),
  ('م.م. سارة حيدر',          'sara.haider@ce.edu'),
  ('م.م. سفانة',              'safana@ce.edu'),
  ('أ.د. صفا رضا عبيد',       'safa.rida@ce.edu'),
  ('م.م. ندى ضياء',           'nada.diaa@ce.edu')
) AS v(full_name, email)
WHERE d.code = 'CE';

-- ================================================================
--  5. INSTRUCTORS
-- ================================================================
INSERT INTO instructors (id, user_id, department_id, title, max_hours_week)
SELECT uuid_generate_v4(), u.id, d.id,
  CASE
    WHEN u.email IN ('raad.sami@ce.edu','safa.rida@ce.edu') THEN 'Prof.'
    WHEN u.email IN ('shaimaa.waleed@ce.edu','israa.badr@ce.edu','rasalan.saad@ce.edu',
                     'atheel.nawfal@ce.edu','ali.jawad@ce.edu','ayman.jabir@ce.edu',
                     'shaimaa.safaaddin@ce.edu','haider@ce.edu','mushtaq.talib@ce.edu') THEN 'Dr.'
    ELSE 'M.Sc.'
  END,
  CASE WHEN u.email IN ('raad.sami@ce.edu','safa.rida@ce.edu') THEN 16
       WHEN u.email LIKE 'abdallah@%' OR u.email LIKE 'alraa%' OR u.email LIKE 'ali.saadi%'
         OR u.email LIKE 'saif%' OR u.email LIKE 'mustafa%' OR u.email LIKE 'ahmed.ali%'
         OR u.email LIKE 'rana%' OR u.email LIKE 'sara%' OR u.email LIKE 'safana%'
         OR u.email LIKE 'nada%' THEN 20
       ELSE 18 END
FROM users u, departments d
WHERE u.role = 'instructor' AND d.code = 'CE';

-- ================================================================
--  6. ROOMS
-- ================================================================
INSERT INTO rooms (id, department_id, name, code, capacity, room_type, has_projector, has_computers, is_shared, is_active)
SELECT uuid_generate_v4(), d.id, v.name, v.code, v.capacity, v.room_type::room_type,
       v.has_projector, v.has_computers, FALSE, TRUE
FROM departments d, (VALUES
  ('Main Lecture Hall',  'HALL-MAIN', 120, 'lecture', TRUE,  FALSE),
  ('Lecture Hall A',     'HALL-A',     80, 'lecture', TRUE,  FALSE),
  ('Lecture Hall B',     'HALL-B',     80, 'lecture', TRUE,  FALSE),
  ('Lecture Hall C',     'HALL-C',     60, 'lecture', TRUE,  FALSE),
  ('Computer Lab 1',     'LAB-CS-1',   30, 'lab',     TRUE,  TRUE),
  ('Computer Lab 2',     'LAB-CS-2',   30, 'lab',     TRUE,  TRUE),
  ('Engineering Lab 1',  'LAB-ENG-1',  30, 'lab',     TRUE,  FALSE),
  ('Engineering Lab 2',  'LAB-ENG-2',  30, 'lab',     TRUE,  FALSE),
  ('DSD Lab',            'LAB-DSD',    30, 'lab',     TRUE,  TRUE),
  ('Microprocessor Lab', 'LAB-MICRO',  30, 'lab',     TRUE,  TRUE),
  ('Workshop',           'WORKSHOP',   40, 'both',    TRUE,  FALSE)
) AS v(name, code, capacity, room_type, has_projector, has_computers)
WHERE d.code = 'CE';

-- ================================================================
--  7. COURSES — Year 1
-- ================================================================
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours,
  lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity)
SELECT uuid_generate_v4(), d.id, sy.id,
  v.name, v.code, v.credit_hours, v.lecture_h, v.lab_h, v.has_lab, v.has_sections, v.min_cap
FROM departments d
JOIN study_years sy ON sy.department_id = d.id AND sy.year_number = 1,
(VALUES
  ('Logic Circuits I',                          'LC-I',   3,2,2,TRUE, FALSE,40),
  ('Electrical Circuits I',                     'EC-I',   3,2,2,TRUE, FALSE,40),
  ('Computer Fundamentals and Programming I',   'CFP-I',  3,2,2,TRUE, FALSE,40),
  ('Engineering Mathematics',                   'EMATH',  3,2,0,FALSE,FALSE,40),
  ('Physics',                                   'PHYS',   3,2,2,TRUE, FALSE,40),
  ('Engineering Drawing',                       'EDRAW',  3,2,2,TRUE, FALSE,40),
  ('Computer Fundamentals II',                  'CF-II',  3,2,2,TRUE, FALSE,40),
  ('Chemistry',                                 'CHEM',   3,2,2,TRUE, FALSE,40),
  ('Electrical Circuits II',                    'EC-II',  3,2,2,TRUE, FALSE,40),
  ('Fundamentals of Engineering Mathematics',   'FEM',    3,2,0,FALSE,FALSE,40),
  ('English Language I',                        'ENG-I',  2,2,0,FALSE,FALSE,40),
  ('Arabic Language I',                         'ARB-I',  2,2,0,FALSE,FALSE,40)
) AS v(name,code,credit_hours,lecture_h,lab_h,has_lab,has_sections,min_cap)
WHERE d.code = 'CE';

-- ================================================================
--  8. COURSES — Year 2
-- ================================================================
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours,
  lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity)
SELECT uuid_generate_v4(), d.id, sy.id,
  v.name, v.code, v.credit_hours, v.lecture_h, v.lab_h, v.has_lab, v.has_sections, v.min_cap
FROM departments d
JOIN study_years sy ON sy.department_id = d.id AND sy.year_number = 2,
(VALUES
  ('Electronics I',                         'ELEC-I',  3,2,2,TRUE, FALSE,36),
  ('Digital System Design',                 'DSD',     3,2,2,TRUE, TRUE, 36),
  ('Logic Circuits II',                     'LC-II',   3,2,2,TRUE, TRUE, 36),
  ('Engineering Mathematics II',            'EMATH2',  3,2,0,FALSE,FALSE,36),
  ('Computer Programming I',                'CP-I',    3,2,2,TRUE, TRUE, 36),
  ('English Language II',                   'ENG-II',  2,2,0,FALSE,FALSE,36),
  ('Engineering Statistics',                'ESTAT',   3,2,0,FALSE,FALSE,36),
  ('Electronics II',                        'ELEC-II', 3,2,2,TRUE, TRUE, 36),
  ('Signals and Systems',                   'SS',      3,2,0,FALSE,FALSE,36),
  ('Computer Programming II',               'CP-II',   3,2,2,TRUE, TRUE, 36),
  ('Analytic Mathematics',                  'AMATH',   3,2,0,FALSE,FALSE,36),
  ('Engineering Analysis and Numerical',    'EAN',     3,2,0,FALSE,FALSE,36),
  ('English Language III',                  'ENG-III', 2,2,0,FALSE,FALSE,36),
  ('Digital Signal Processing',             'DSP-II',  3,2,2,TRUE, FALSE,36)
) AS v(name,code,credit_hours,lecture_h,lab_h,has_lab,has_sections,min_cap)
WHERE d.code = 'CE';

-- ================================================================
--  9. COURSES — Year 3
-- ================================================================
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours,
  lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity)
SELECT uuid_generate_v4(), d.id, sy.id,
  v.name, v.code, v.credit_hours, v.lecture_h, v.lab_h, v.has_lab, v.has_sections, v.min_cap
FROM departments d
JOIN study_years sy ON sy.department_id = d.id AND sy.year_number = 3,
(VALUES
  ('Digital System Design Lab',         'DSD-L',    0,0,2,TRUE, FALSE,48),
  ('Microprocessor',                    'MICRO',    3,2,2,TRUE, FALSE,48),
  ('Database Management Systems',       'DBMS',     3,2,0,FALSE,FALSE,48),
  ('Advanced Computer Architecture',    'ACA',      3,2,0,FALSE,FALSE,48),
  ('Software Engineering',              'SE',       3,2,0,FALSE,FALSE,48),
  ('Microcontrollers',                  'MCU',      3,2,2,TRUE, FALSE,48),
  ('Engineering Control I',             'CTRL-I',   3,2,0,FALSE,FALSE,48),
  ('Parallel Processing',               'PP',       3,2,2,TRUE, FALSE,48),
  ('Operating Systems',                 'OS',       3,2,0,FALSE,FALSE,48),
  ('Computer Networks I',               'CN-I',     3,2,2,TRUE, FALSE,48),
  ('Embedded Systems',                  'ES',       3,2,2,TRUE, FALSE,48),
  ('Microprocessors II',                'MICRO-II', 3,2,2,TRUE, FALSE,48),
  ('Control Engineering II',            'CTRL-II',  3,2,2,TRUE, FALSE,48),
  ('Database Management Systems Lab',   'DBMS-L',   0,0,2,TRUE, FALSE,48),
  ('Real Time Systems',                 'RTS',      3,2,0,FALSE,FALSE,48),
  ('Data Structure and Algorithms',     'DSA',      3,2,0,FALSE,FALSE,48)
) AS v(name,code,credit_hours,lecture_h,lab_h,has_lab,has_sections,min_cap)
WHERE d.code = 'CE';

-- ================================================================
--  10. COURSES — Year 4
-- ================================================================
INSERT INTO courses (id, department_id, study_year_id, name, code, credit_hours,
  lecture_hours_week, lab_hours_week, has_lab, has_sections, min_capacity)
SELECT uuid_generate_v4(), d.id, sy.id,
  v.name, v.code, v.credit_hours, v.lecture_h, v.lab_h, v.has_lab, v.has_sections, v.min_cap
FROM departments d
JOIN study_years sy ON sy.department_id = d.id AND sy.year_number = 4,
(VALUES
  ('Advanced Computer Architecture II',  'ACA-II',    3,2,0,FALSE,FALSE,19),
  ('Advanced Operating Systems',         'AOS',       3,2,0,FALSE,FALSE,19),
  ('Advanced Optical Networking',        'AON',       3,2,0,FALSE,FALSE,19),
  ('Machine Learning',                   'ML',        3,2,0,FALSE,FALSE,19),
  ('Advanced Digital Signal Processing', 'ADSP',      3,2,0,FALSE,FALSE,19),
  ('Networks and Information Security',  'NIS',       3,2,0,FALSE,FALSE,19),
  ('Adv Microprocessors',                'ADV-MICRO', 3,2,0,FALSE,FALSE,19),
  ('Cloud Computing',                    'CC',        3,2,2,TRUE, FALSE,19),
  ('Image Processing',                   'IP',        3,2,2,TRUE, FALSE,19),
  ('Computer Networks II',               'CN-II',     3,2,0,FALSE,FALSE,19),
  ('Modern Control',                     'MCTRL',     3,2,0,FALSE,FALSE,19),
  ('Information Theory and Coding',      'ITC',       3,2,0,FALSE,FALSE,19),
  ('Project',                            'PROJ',      4,0,4,TRUE, FALSE,19),
  ('Research Methodology',               'RM',        2,2,0,FALSE,FALSE,19),
  ('Distributed Systems',                'DS',        3,2,0,FALSE,FALSE,19),
  ('Adv Soft Computing',                 'ASC',       3,2,0,FALSE,FALSE,19),
  ('Fiber Optical Networks',             'FON',       3,2,0,FALSE,FALSE,19),
  ('Human Rights and Democracy',         'HRD',       2,2,0,FALSE,FALSE,19),
  ('Advanced Digital Image Processing',  'ADIP',      3,2,0,FALSE,FALSE,19),
  ('Communication Engineering',          'COMENG',    3,2,2,TRUE, FALSE,19)
) AS v(name,code,credit_hours,lecture_h,lab_h,has_lab,has_sections,min_cap)
WHERE d.code = 'CE';

-- ================================================================
--  11. SECTIONS
-- ================================================================
-- Year 1 — single section per course
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT uuid_generate_v4(), c.id, c.study_year_id, 'A', 40
FROM courses c
JOIN study_years sy ON sy.id = c.study_year_id
WHERE sy.year_number = 1
  AND c.code IN ('LC-I','CFP-I','PHYS','EDRAW','CF-II');

-- Year 2 — two sections for courses with has_sections=TRUE
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT uuid_generate_v4(), c.id, c.study_year_id, 'A', 18
FROM courses c
JOIN study_years sy ON sy.id = c.study_year_id
WHERE sy.year_number = 2 AND c.has_sections = TRUE;

INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT uuid_generate_v4(), c.id, c.study_year_id, 'B', 18
FROM courses c
JOIN study_years sy ON sy.id = c.study_year_id
WHERE sy.year_number = 2 AND c.has_sections = TRUE;

-- Year 3 — single section
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT uuid_generate_v4(), c.id, c.study_year_id, 'A', 48
FROM courses c
JOIN study_years sy ON sy.id = c.study_year_id
WHERE sy.year_number = 3
  AND c.code IN ('MICRO','DBMS','PP','OS','CN-I','ES');

-- Year 4 — single section
INSERT INTO sections (id, course_id, study_year_id, name, student_count)
SELECT uuid_generate_v4(), c.id, c.study_year_id, 'A', 19
FROM courses c
JOIN study_years sy ON sy.id = c.study_year_id
WHERE sy.year_number = 4
  AND c.code IN ('ML','NIS','CC','IP','PROJ');

-- ================================================================
--  12. COURSE ASSIGNMENTS — Fall 2025/2026
-- ================================================================
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester)
SELECT uuid_generate_v4(), c.id, i.id, v.session_type::session_type, '2025-2026', 'fall'
FROM (VALUES
  ('LC-I',   'shaimaa.waleed@ce.edu',   'lecture'),
  ('LC-I',   'shaimaa.waleed@ce.edu',   'lab'),
  ('EC-I',   'shaimaa.waleed@ce.edu',   'lecture'),
  ('CFP-I',  'abdallah@ce.edu',         'lecture'),
  ('CFP-I',  'abdallah@ce.edu',         'lab'),
  ('EMATH',  'alraa.mwafaq@ce.edu',     'lecture'),
  ('PHYS',   'ali.jawad@ce.edu',        'lab'),
  ('ELEC-I', 'israa.badr@ce.edu',       'lecture'),
  ('ELEC-I', 'israa.badr@ce.edu',       'lab'),
  ('DSD',    'rasalan.saad@ce.edu',     'lecture'),
  ('DSD',    'rasalan.saad@ce.edu',     'lab'),
  ('LC-II',  'atheel.nawfal@ce.edu',    'lecture'),
  ('LC-II',  'atheel.nawfal@ce.edu',    'lab'),
  ('CP-I',   'abdallah@ce.edu',         'lecture'),
  ('CP-I',   'alraa.mwafaq@ce.edu',     'lab'),
  ('ENG-II', 'saif.abdaljasim@ce.edu',  'lecture'),
  ('ESTAT',  'rana.ihsan@ce.edu',       'lecture'),
  ('MICRO',  'shaimaa.safaaddin@ce.edu','lecture'),
  ('MICRO',  'shaimaa.safaaddin@ce.edu','lab'),
  ('DBMS',   'ahmed.ali@ce.edu',        'lecture'),
  ('SE',     'ahmed.ali@ce.edu',        'lecture'),
  ('MCU',    'mustafa.adnan@ce.edu',    'lecture'),
  ('MCU',    'ali.jawad@ce.edu',        'lab'),
  ('CTRL-I', 'mushtaq.talib@ce.edu',    'lecture'),
  ('PP',     'atheel.nawfal@ce.edu',    'lecture'),
  ('PP',     'ayman.jabir@ce.edu',      'lab'),
  ('ACA-II', 'shaimaa.safaaddin@ce.edu','lecture'),
  ('AOS',    'rasalan.saad@ce.edu',     'lecture'),
  ('AON',    'raad.sami@ce.edu',        'lecture'),
  ('ML',     'ahmed.ali@ce.edu',        'lecture'),
  ('ADSP',   'israa.badr@ce.edu',       'lecture')
) AS v(course_code, instructor_email, session_type)
JOIN courses c ON c.code = v.course_code
JOIN users u ON u.email = v.instructor_email
JOIN instructors i ON i.user_id = u.id;

-- ================================================================
--  13. COURSE ASSIGNMENTS — Spring 2025/2026
-- ================================================================
INSERT INTO course_assignments (id, course_id, instructor_id, session_type, academic_year, semester)
SELECT uuid_generate_v4(), c.id, i.id, v.session_type::session_type, '2025-2026', 'spring'
FROM (VALUES
  ('EDRAW',   'ali.jawad@ce.edu',         'lecture'),
  ('EDRAW',   'ali.jawad@ce.edu',         'lab'),
  ('CF-II',   'abdallah@ce.edu',          'lecture'),
  ('CF-II',   'abdallah@ce.edu',          'lab'),
  ('CHEM',    'nada.diaa@ce.edu',         'lab'),
  ('EC-II',   'atheel.nawfal@ce.edu',     'lecture'),
  ('EC-II',   'atheel.nawfal@ce.edu',     'lab'),
  ('FEM',     'sara.haider@ce.edu',       'lecture'),
  ('ENG-I',   'saif.abdaljasim@ce.edu',   'lecture'),
  ('ARB-I',   'safa.rida@ce.edu',         'lecture'),
  ('ELEC-II', 'israa.badr@ce.edu',        'lecture'),
  ('ELEC-II', 'israa.badr@ce.edu',        'lab'),
  ('SS',      'ali.saadi@ce.edu',         'lecture'),
  ('CP-II',   'alraa.mwafaq@ce.edu',      'lecture'),
  ('CP-II',   'alraa.mwafaq@ce.edu',      'lab'),
  ('AMATH',   'rana.ihsan@ce.edu',        'lecture'),
  ('EAN',     'ali.jawad@ce.edu',         'lecture'),
  ('ENG-III', 'saif.abdaljasim@ce.edu',   'lecture'),
  ('DSP-II',  'shaimaa.waleed@ce.edu',    'lecture'),
  ('OS',      'rasalan.saad@ce.edu',      'lecture'),
  ('CN-I',    'ayman.jabir@ce.edu',       'lecture'),
  ('CN-I',    'ayman.jabir@ce.edu',       'lab'),
  ('ES',      'shaimaa.safaaddin@ce.edu', 'lecture'),
  ('ES',      'shaimaa.safaaddin@ce.edu', 'lab'),
  ('MICRO-II','shaimaa.safaaddin@ce.edu', 'lecture'),
  ('MICRO-II','shaimaa.safaaddin@ce.edu', 'lab'),
  ('CTRL-II', 'mushtaq.talib@ce.edu',     'lecture'),
  ('CTRL-II', 'mushtaq.talib@ce.edu',     'lab'),
  ('DBMS-L',  'ahmed.ali@ce.edu',         'lab'),
  ('RTS',     'shaimaa.waleed@ce.edu',    'lecture'),
  ('DSA',     'haider@ce.edu',            'lecture'),
  ('NIS',     'ayman.jabir@ce.edu',       'lecture'),
  ('ADV-MICRO','israa.badr@ce.edu',       'lecture'),
  ('CC',      'shaimaa.waleed@ce.edu',    'lecture'),
  ('CC',      'shaimaa.waleed@ce.edu',    'lab'),
  ('IP',      'atheel.nawfal@ce.edu',     'lecture'),
  ('IP',      'atheel.nawfal@ce.edu',     'lab'),
  ('CN-II',   'ayman.jabir@ce.edu',       'lecture'),
  ('MCTRL',   'shaimaa.safaaddin@ce.edu', 'lecture'),
  ('ITC',     'rasalan.saad@ce.edu',      'lecture'),
  ('RM',      'shaimaa.waleed@ce.edu',    'lecture'),
  ('DS',      'ayman.jabir@ce.edu',       'lecture'),
  ('ASC',     'shaimaa.waleed@ce.edu',    'lecture'),
  ('FON',     'raad.sami@ce.edu',         'lecture'),
  ('ADIP',    'raad.sami@ce.edu',         'lecture'),
  ('COMENG',  'raad.sami@ce.edu',         'lecture'),
  ('COMENG',  'ali.saadi@ce.edu',         'lab')
) AS v(course_code, instructor_email, session_type)
JOIN courses c ON c.code = v.course_code
JOIN users u ON u.email = v.instructor_email
JOIN instructors i ON i.user_id = u.id;

-- ================================================================
--  14. DEMO STUDENT
-- ================================================================
INSERT INTO users (id, full_name, email, hashed_password, role, department_id, is_active)
SELECT uuid_generate_v4(), 'طالب تجريبي', 'student@ce.edu',
       '$2b$12$QC.oiEvALuiJzc18kvotl.3SOZI.CuXeX7oYbLvKekqd7aNAnZjuO',
       'student', d.id, TRUE
FROM departments d WHERE d.code = 'CE';

INSERT INTO students (id, user_id, department_id, study_year_id, enrollment_year)
SELECT uuid_generate_v4(), u.id, d.id, sy.id, 2025
FROM users u, departments d, study_years sy
WHERE u.email = 'student@ce.edu'
  AND d.code = 'CE'
  AND sy.department_id = d.id AND sy.year_number = 1;

-- ================================================================
--  15. INSTRUCTOR PREFERENCES
-- ================================================================
INSERT INTO instructor_preferences (id, instructor_id, preferred_time, preferred_days_off, max_consecutive_hrs)
SELECT uuid_generate_v4(), i.id,
  CASE
    WHEN u.email IN ('rasalan.saad@ce.edu','haider@ce.edu','ali.saadi@ce.edu',
                     'safana@ce.edu','safa.rida@ce.edu') THEN 'no_preference'::time_preference
    ELSE 'morning'::time_preference
  END,
  CASE
    WHEN u.email IN ('shaimaa.waleed@ce.edu','atheel.nawfal@ce.edu',
                     'shaimaa.safaaddin@ce.edu','saif.abdaljasim@ce.edu',
                     'rana.ihsan@ce.edu') THEN ARRAY['thursday']::week_day[]
    WHEN u.email IN ('raad.sami@ce.edu') THEN ARRAY['thursday']::week_day[]
    WHEN u.email IN ('safa.rida@ce.edu') THEN ARRAY['wednesday','thursday']::week_day[]
    ELSE ARRAY[]::week_day[]
  END,
  CASE WHEN u.email IN ('raad.sami@ce.edu','safa.rida@ce.edu') THEN 3
       WHEN u.email IN ('shaimaa.waleed@ce.edu','israa.badr@ce.edu','rasalan.saad@ce.edu',
                        'atheel.nawfal@ce.edu','ali.jawad@ce.edu','ayman.jabir@ce.edu',
                        'shaimaa.safaaddin@ce.edu','haider@ce.edu','mushtaq.talib@ce.edu') THEN 3
       ELSE 4 END
FROM instructors i
JOIN users u ON u.id = i.user_id;