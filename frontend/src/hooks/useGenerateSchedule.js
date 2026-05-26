// frontend/src/hooks/useGenerateSchedule.js
import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { aiApi }      from '../api/ai.api'
import { schedulesApi } from '../api/schedules.api'
import useUIStore     from '../store/uiStore'

/**
 * Manages the full AI generation flow:
 *  1. POST /ai/generate  → scheduleId
 *  2. Poll GET /ai/status/{id} every 2s
 *  3. When completed → fetch final logs
 */
export default function useGenerateSchedule() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const [scheduleId, setScheduleId] = useState(null)
  const [status, setStatus]         = useState(null)   // AIStatusResponse
  const [logs, setLogs]             = useState([])
  const [isPolling, setIsPolling]   = useState(false)
  const pollRef = useRef(null)

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Start polling
  const startPolling = useCallback((id) => {
    setIsPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await aiApi.getStatus(id)
        setStatus(data)

        if (data.status === 'completed') {
          stopPolling()
          // Fetch final generation logs
          const { data: finalLogs } = await schedulesApi.getLogs(id)
          setLogs(finalLogs)
          qc.invalidateQueries(['schedules'])
          addToast({ type: 'success', message: `Schedule generated! Fitness: ${data.best_fitness?.toFixed(1)}` })
        } else if (data.status === 'failed') {
          stopPolling()
          addToast({ type: 'error', message: 'Generation failed — check server logs' })
        }
      } catch (err) {
        stopPolling()
        addToast({ type: 'error', message: 'Lost connection to server' })
      }
    }, 2000)
  }, [stopPolling, qc, addToast])

  // Generate mutation
  const generate = useMutation({
    mutationFn: (params) => aiApi.generate(params),
    onSuccess: ({ data }) => {
      setScheduleId(data.id)
      setStatus({ status: 'pending', progress_pct: 0, current_gen: 0, total_gen: data.generations })
      setLogs([])
      startPolling(data.id)
    },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Failed to start generation' }),
  })

  const reset = useCallback(() => {
    stopPolling()
    setScheduleId(null)
    setStatus(null)
    setLogs([])
  }, [stopPolling])

  return {
    generate: generate.mutate,
    isStarting: generate.isPending,
    scheduleId,
    status,
    logs,
    isPolling,
    isRunning: isPolling || generate.isPending,
    reset,
  }
}