import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { subscribeToCatalog } from "../lib/supabase"

/**
 * Escucha las skills nuevas en vivo. Como pueden llegar cientos por minuto,
 * agrupa los avisos (uno cada pocos segundos) y refresca los datos con calma.
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState(null)
  const [newIds, setNewIds] = useState(() => new Set())
  const buffer = useRef([])
  const flushTimer = useRef(null)
  const refreshTimer = useRef(null)

  useEffect(() => {
    const flush = () => {
      flushTimer.current = null
      const batch = buffer.current
      buffer.current = []
      if (!batch.length) return
      setNewIds((prev) => {
        const next = new Set(prev)
        batch.forEach((e) => next.add(e.skill_id))
        return next
      })
      setToast({ id: Date.now(), count: batch.length, latest: batch[batch.length - 1] })
    }

    const stop = subscribeToCatalog((event) => {
      if (event.kind !== "skill_added") return
      buffer.current.push(event)
      if (!flushTimer.current) flushTimer.current = setTimeout(flush, 4000)
      if (!refreshTimer.current) {
        refreshTimer.current = setTimeout(() => {
          refreshTimer.current = null
          // Los listados del explorador no se recargan solos: los conteos y novedades salen de cachés del servidor
          for (const key of ["newest", "counts", "sync"]) queryClient.invalidateQueries({ queryKey: [key] })
        }, 5 * 60_000)
      }
    })
    return () => {
      clearTimeout(flushTimer.current)
      clearTimeout(refreshTimer.current)
      stop()
    }
  }, [queryClient])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6500)
    return () => clearTimeout(t)
  }, [toast])

  return { toast, dismiss: () => setToast(null), newIds }
}
