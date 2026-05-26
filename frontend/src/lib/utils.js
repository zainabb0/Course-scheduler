// frontend/src/lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/* Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/* Format a date string */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/* Capitalize first letter */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/* Day order for sorting */
export const DAY_ORDER = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
}

/**  Day display names */
export const DAY_LABELS = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
  wednesday: 'Wed', thursday: 'Thu',
}

/**  Role colors */
export const ROLE_COLORS = {
  admin:      'badge-red',
  instructor: 'badge-blue',
  student:    'badge-green',
}

/**  Study year label colors for schedule grid */
export const YEAR_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
]

/**  Truncate text */
export function truncate(str, n = 30) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}