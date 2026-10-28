import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.")
}

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 5 } },
})

const PAGE = 1000

/** Catálogo completo (vista sin duplicados), paginado de a 1000 filas. */
export async function fetchCatalog() {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("skills_catalog")
      .select("*")
      .order("stars", { ascending: false })
      .order("name")
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon, color, sort_order")
    .order("sort_order")
  if (error) throw error
  return data
}

export async function fetchRepoTrends() {
  const { data, error } = await supabase
    .from("repo_trends")
    .select("*")
    .order("stars", { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSyncStatus() {
  const { data, error } = await supabase.rpc("sync_status")
  if (error) throw error
  return data?.[0] ?? null
}

/** Escucha altas, cambios y bajas de skills y cambios de estrellas en repos. */
export function subscribeToCatalog(onChange) {
  const channel = supabase
    .channel("catalog-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "skills" }, (p) =>
      onChange({ table: "skills", type: p.eventType, record: p.new && Object.keys(p.new).length ? p.new : p.old }),
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "repos" }, (p) =>
      onChange({ table: "repos", type: "UPDATE", record: p.new, old: p.old }),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
