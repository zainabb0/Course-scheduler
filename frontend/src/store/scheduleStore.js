// frontend/src/store/scheduleStore.js
import { create } from 'zustand'

const useScheduleStore = create((set) => ({
  // ── Active schedule ─────────────────────────────────────────────
  activeScheduleId: null,
  activeSchedule:   null,

  setActiveSchedule: (schedule) =>
    set({ activeScheduleId: schedule?.id || null, activeSchedule: schedule }),

  // ── Filters ─────────────────────────────────────────────────────
  yearFilter:       '',   // study_year_id
  dayFilter:        '',   // sunday | monday | ...
  showConflictsOnly:false,

  setYearFilter:        (id)   => set({ yearFilter: id }),
  setDayFilter:         (day)  => set({ dayFilter: day }),
  setShowConflictsOnly: (val)  => set({ showConflictsOnly: val }),

  clearFilters: () => set({ yearFilter: '', dayFilter: '', showConflictsOnly: false }),

  // ── View mode ───────────────────────────────────────────────────
  viewMode: 'grid',   // 'grid' | 'list'
  setViewMode: (mode) => set({ viewMode: mode }),
}))

export default useScheduleStore