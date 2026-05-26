// frontend/src/hooks/useExport.js
import { useCallback } from 'react'
import useUIStore from '../store/uiStore'

/**
 * Export schedule entries to Excel (.xlsx)
 */
export function useExportExcel() {
  const { addToast } = useUIStore()

  return useCallback(async (entries, filename = 'schedule') => {
    try {
      const XLSX = await import('xlsx')

      const rows = entries.map(e => ({
        Day:         e.day        || '',
        'Start Time':e.start_time || '',
        'End Time':  e.end_time   || '',
        Course:      e.course_code || '',
        'Course Name': e.course_name || '',
        Section:     e.section_name || '',
        Instructor:  e.instructor_name || '',
        Room:        e.room_code || '',
        Type:        e.session_type || '',
        Conflict:    e.has_conflict ? 'Yes' : 'No',
        Edited:      e.is_manually_edited ? 'Yes' : 'No',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 8  }, { wch: 30 }, { wch: 10 },
        { wch: 25 }, { wch: 12 }, { wch: 10 },
        { wch: 9  }, { wch: 8  },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Schedule')
      XLSX.writeFile(wb, `${filename}.xlsx`)

      addToast({ type: 'success', message: 'Excel exported successfully' })
    } catch (err) {
      addToast({ type: 'error', message: 'Excel export failed' })
    }
  }, [addToast])
}


/**
 * Export schedule entries to CSV
 */
export function useExportCSV() {
  const { addToast } = useUIStore()

  return useCallback((entries, filename = 'schedule') => {
    try {
      const headers = ['Day','Start','End','Course','Name','Section','Instructor','Room','Type','Conflict']
      const rows = entries.map(e => [
        e.day, e.start_time, e.end_time,
        e.course_code, e.course_name, e.section_name,
        e.instructor_name, e.room_code, e.session_type,
        e.has_conflict ? 'Yes' : 'No',
      ])

      const csv = [headers, ...rows]
        .map(r => r.map(v => `"${v ?? ''}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)

      addToast({ type: 'success', message: 'CSV exported successfully' })
    } catch (err) {
      addToast({ type: 'error', message: 'CSV export failed' })
    }
  }, [addToast])
}