// frontend/src/lib/validators.js
import { z } from 'zod'

// ── Auth ─────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

// ── Department ───────────────────────────────────────────────────
export const departmentSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  code: z.string().min(1).max(20),
})

// ── Classroom ────────────────────────────────────────────────────
export const classroomSchema = z.object({
  name:          z.string().min(1),
  code:          z.string().min(1).max(20),
  capacity:      z.coerce.number().int().min(1).max(500),
  room_type:     z.enum(['lecture', 'lab', 'both']),
  has_projector: z.boolean().default(true),
  has_computers: z.boolean().default(false),
  department_id: z.string().min(1, 'Select a department'),
})

// ── Course ───────────────────────────────────────────────────────
export const courseSchema = z.object({
  name:               z.string().min(2),
  code:               z.string().min(2).max(20),
  credit_hours:       z.coerce.number().int().min(1).max(9),
  lecture_hours_week: z.coerce.number().int().min(0).max(6),
  lab_hours_week:     z.coerce.number().int().min(0).max(4),
  has_lab:            z.boolean().default(false),
  has_sections:       z.boolean().default(false),
  min_capacity:       z.coerce.number().int().min(1).max(500),
  department_id:      z.string().min(1),
  study_year_id:      z.string().min(1),
})

// ── Instructor ───────────────────────────────────────────────────
export const instructorCreateSchema = z.object({
  full_name:      z.string().min(2),
  email:          z.string().email(),
  password:       z.string().min(6),
  department_id:  z.string().min(1),
  title:          z.string().optional(),
  max_hours_week: z.coerce.number().int().min(1).max(40),
})

// ── Student ──────────────────────────────────────────────────────
export const studentCreateSchema = z.object({
  full_name:       z.string().min(2),
  email:           z.string().email(),
  password:        z.string().min(6),
  department_id:   z.string().min(1),
  study_year_id:   z.string().min(1),
  enrollment_year: z.coerce.number().int().min(2000).optional(),
})

// ── AI Generate ──────────────────────────────────────────────────
export const generateSchema = z.object({
  department_id:  z.string().min(1, 'Select a department'),
  academic_year:  z.string().regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
  semester:       z.enum(['fall', 'spring']),
  name:           z.string().optional(),
  generations:    z.coerce.number().int().min(10).max(500),
  population_size:z.coerce.number().int().min(10).max(200),
  mutation_rate:  z.coerce.number().min(0.001).max(0.5),
  crossover_rate: z.coerce.number().min(0.3).max(1),
  use_tabu:       z.boolean().default(true),
  tabu_iterations:z.coerce.number().int().min(10).max(1000),
  tabu_tenure:    z.coerce.number().int().min(5).max(50),
})