// frontend/src/lib/constants.js

// ── Days ─────────────────────────────────────────────────────────
export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']

export const DAY_LABELS = {
  sunday:    'Sunday',
  monday:    'Monday',
  tuesday:   'Tuesday',
  wednesday: 'Wednesday',
  thursday:  'Thursday',
}

export const DAY_SHORT = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
  wednesday: 'Wed', thursday: 'Thu',
}

export const DAY_ORDER = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
}

// ── Time Slots ────────────────────────────────────────────────────
export const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '08:00–09:00', slot: 1 },
  { start: '09:00', end: '10:00', label: '09:00–10:00', slot: 2 },
  { start: '10:00', end: '11:00', label: '10:00–11:00', slot: 3 },
  { start: '11:00', end: '12:00', label: '11:00–12:00', slot: 4 },
  { start: '12:00', end: '13:00', label: '12:00–13:00', slot: 5 },
  { start: '13:00', end: '14:00', label: '13:00–14:00', slot: 6 },
]

// ── User Roles ────────────────────────────────────────────────────
export const ROLES = { ADMIN: 'admin', INSTRUCTOR: 'instructor', STUDENT: 'student' }

export const ROLE_LABELS = {
  admin:      'Admin',
  instructor: 'Instructor',
  student:    'Student',
}

export const ROLE_COLORS = {
  admin:      'badge-red',
  instructor: 'badge-blue',
  student:    'badge-green',
}

// ── Room Types ────────────────────────────────────────────────────
export const ROOM_TYPES = ['lecture', 'lab', 'both']

export const ROOM_TYPE_LABELS = {
  lecture: 'Lecture Hall',
  lab:     'Lab',
  both:    'Both',
}

// ── Session Types ─────────────────────────────────────────────────
export const SESSION_TYPES = ['lecture', 'lab']

// ── Semesters ─────────────────────────────────────────────────────
export const SEMESTERS = ['fall', 'spring']

export const SEMESTER_LABELS = { fall: 'Fall', spring: 'Spring' }

// ── Schedule Colors (per study year) ─────────────────────────────
export const YEAR_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
]

// ── Default GA Params ─────────────────────────────────────────────
export const DEFAULT_GA_PARAMS = {
  generations:    100,
  population_size: 50,
  mutation_rate:  0.02,
  crossover_rate: 0.8,
  use_tabu:       true,
  tabu_iterations:200,
  tabu_tenure:    15,
}

// ── Conflict Types ────────────────────────────────────────────────
export const CONFLICT_LABELS = {
  room_double_booking: 'Room Double Booking',
  instructor_conflict: 'Instructor Conflict',
  section_conflict:    'Section Conflict',
  year_overlap:        'Year Overlap',
  capacity_violation:  'Capacity Exceeded',
  room_type_mismatch:  'Room Type Mismatch',
}