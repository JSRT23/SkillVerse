import { useMemo } from "react"
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  catalogCounts, countSkills, fetchRepoTrends, fetchTaxonomy, getSkill, newestSkills,
  popularSkills, searchSkills, similarSkills, smartSearch, syncStatus,
} from "../lib/supabase"

const MIN = 60 * 1000
export const PAGE_SIZE = 24

export const useTaxonomy = () => useQuery({ queryKey: ["taxonomy"], queryFn: fetchTaxonomy, staleTime: Infinity })
export const useCounts = () => useQuery({ queryKey: ["counts"], queryFn: catalogCounts, staleTime: 10 * MIN })
// Los conteos y el estado se recalculan en el servidor cada 10 minutos: no hace falta pedirlos más seguido
export const useSyncStatus = () => useQuery({ queryKey: ["sync"], queryFn: syncStatus, staleTime: 5 * MIN, refetchInterval: 5 * MIN })
export const usePopular = (limit = 9) => useQuery({ queryKey: ["popular", limit], queryFn: () => popularSkills(limit), staleTime: 5 * MIN })
export const useNewest = (limit = 8) => useQuery({ queryKey: ["newest", limit], queryFn: () => newestSkills(limit), staleTime: 5 * MIN })
export const useRepoTrends = (limit = 8) => useQuery({ queryKey: ["repos", limit], queryFn: () => fetchRepoTrends(limit), staleTime: 5 * MIN })
export const useSkill = (slug) => useQuery({ queryKey: ["skill", slug], queryFn: () => getSkill(slug), enabled: !!slug, staleTime: 5 * MIN })
export const useSimilar = (id) => useQuery({ queryKey: ["similar", id], queryFn: () => similarSkills(id, 6), enabled: !!id, staleTime: 10 * MIN })

/** Taxonomía con conteos por categoría y subcategoría. */
export function useTaxonomyWithCounts() {
  const { data: taxonomy = [], ...rest } = useTaxonomy()
  const { data: counts = [] } = useCounts()
  const data = useMemo(() => {
    const byCat = {}, bySub = {}
    for (const r of counts) {
      byCat[r.category_slug] = (byCat[r.category_slug] ?? 0) + Number(r.n)
      if (r.subcategory_slug) bySub[r.subcategory_slug] = Number(r.n)
    }
    return taxonomy.map((c) => ({
      ...c,
      count: byCat[c.slug] ?? 0,
      subcategories: c.subcategories.map((s) => ({ ...s, count: bySub[s.slug] ?? 0 })),
    }))
  }, [taxonomy, counts])
  return { data, ...rest }
}

/** Listado paginado con scroll infinito. Con búsqueda inteligente usa la Edge Function. */
export function useSkillList(filters) {
  const smart = filters.smart && (filters.q ?? "").trim().length >= 3
  const list = useInfiniteQuery({
    queryKey: ["skills", { ...filters, smart }],
    queryFn: ({ pageParam = 0 }) =>
      smart
        ? smartSearch({ ...filters, limit: 48 })
        : searchSkills({ ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (smart || last.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: MIN,
  })
  const total = useQuery({
    queryKey: ["skills-count", { ...filters, smart }],
    queryFn: () => countSkills(filters),
    enabled: !smart,
    placeholderData: keepPreviousData,
    staleTime: MIN,
  })
  const items = useMemo(() => {
    const seen = new Set()
    return (list.data?.pages ?? []).flat().filter((s) => (seen.has(s.id) ? false : seen.add(s.id)))
  }, [list.data])
  return { ...list, items, total: smart ? items.length : total.data, smart }
}
