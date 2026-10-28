import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchCatalog, fetchCategories, fetchRepoTrends, fetchSyncStatus } from "../lib/supabase"

const FIVE_MIN = 5 * 60 * 1000

export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog, staleTime: FIVE_MIN })
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: Infinity })
}

export function useRepoTrends() {
  return useQuery({ queryKey: ["repo-trends"], queryFn: fetchRepoTrends, staleTime: FIVE_MIN })
}

export function useSyncStatus() {
  return useQuery({ queryKey: ["sync-status"], queryFn: fetchSyncStatus, refetchInterval: 60_000 })
}

/** Categorías con su número de skills. */
export function useCategoriesWithCounts() {
  const { data: categories = [], ...rest } = useCategories()
  const { data: skills = [] } = useCatalog()
  const data = useMemo(() => {
    const counts = {}
    for (const s of skills) counts[s.category_slug] = (counts[s.category_slug] ?? 0) + 1
    return categories.map((c) => ({ ...c, count: counts[c.slug] ?? 0 }))
  }, [categories, skills])
  return { data, ...rest }
}

/**
 * Populares: las estrellas son del repo, así que intercalamos skills de los
 * repos con más estrellas para no mostrar 8 del mismo repositorio.
 */
export function pickPopular(skills, limit = 8) {
  const byRepo = new Map()
  for (const s of skills) {
    if (!byRepo.has(s.repo_full_name)) byRepo.set(s.repo_full_name, [])
    byRepo.get(s.repo_full_name).push(s)
  }
  const repos = [...byRepo.values()].sort((a, b) => b[0].stars - a[0].stars)
  const out = []
  for (let i = 0; out.length < limit; i++) {
    let added = false
    for (const list of repos) {
      if (list[i]) { out.push(list[i]); added = true }
      if (out.length >= limit) break
    }
    if (!added) break
  }
  return out
}

export function pickNewest(skills, limit = 6) {
  return [...skills]
    .sort((a, b) => new Date(b.first_seen_at) - new Date(a.first_seen_at) || new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, limit)
}
