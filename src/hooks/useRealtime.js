import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { subscribeToCatalog } from "../lib/supabase"

/**
 * Escucha cambios en vivo. Refresca el catálogo (agrupando ráfagas de eventos)
 * y devuelve avisos para mostrar cuando llega una skill nueva.
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const [toasts, setToasts] = useState([])
  const [newIds, setNewIds] = useState(() => new Set())
  const timer = useRef(null)

  useEffect(() => {
    const refresh = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["catalog"] })
        queryClient.invalidateQueries({ queryKey: ["repo-trends"] })
        queryClient.invalidateQueries({ queryKey: ["sync-status"] })
      }, 1500)
    }

    const stop = subscribeToCatalog((event) => {
      refresh()
      if (event.table === "skills" && event.type === "INSERT" && event.record?.name) {
        const id = `${event.record.id}-${Date.now()}`
        setNewIds((prev) => new Set(prev).add(event.record.id))
        setToasts((prev) => [...prev.slice(-2), { id, name: event.record.name, slug: event.record.slug }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 7000)
      }
    })
    return () => {
      clearTimeout(timer.current)
      stop()
    }
  }, [queryClient])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))
  return { toasts, dismiss, newIds }
}
