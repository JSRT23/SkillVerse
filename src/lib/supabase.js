import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.")
}

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 5 } },
})

const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data
}

/** Página de skills con filtros, búsqueda por texto y orden. */
export const searchSkills = ({ q, category, subcategory, origin, noScripts, sort = "stars", limit = 24, offset = 0 }) =>
  rpc("search_skills", {
    q: q || null, category: category || null, subcategory: subcategory || null,
    origin: origin || null, no_scripts: !!noScripts, sort, lim: limit, off: offset,
  })

export const countSkills = ({ q, category, subcategory, origin, noScripts }) =>
  rpc("count_skills", {
    q: q || null, category: category || null, subcategory: subcategory || null,
    origin: origin || null, no_scripts: !!noScripts,
  })

/** Búsqueda inteligente (texto + significado) a través de la Edge Function "search". */
export async function smartSearch({ q, category, subcategory, origin, noScripts, limit = 24 }) {
  const { data, error } = await supabase.functions.invoke("search", {
    body: { q, category, subcategory, origin, no_scripts: !!noScripts, lim: limit },
  })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function getSkill(slug) {
  const { data, error } = await supabase.from("skills_catalog").select("*").eq("slug", slug).maybeSingle()
  if (error) throw error
  return data
}

export const similarSkills = (id, limit = 6) => rpc("similar_skills", { p_skill_id: id, p_limit: limit })
export const popularSkills = (limit = 9) => rpc("popular_skills", { p_limit: limit })
export const newestSkills = (limit = 8) => rpc("newest_skills", { p_limit: limit })
export const catalogCounts = () => rpc("catalog_counts")
export const syncStatus = async () => (await rpc("sync_status"))?.[0] ?? null

export async function fetchTaxonomy() {
  const [cats, subs] = await Promise.all([
    supabase.from("categories").select("id, slug, name, description, icon, color, sort_order").order("sort_order"),
    supabase.from("subcategories").select("id, category_id, slug, name, description, sort_order").order("sort_order"),
  ])
  if (cats.error) throw cats.error
  if (subs.error) throw subs.error
  return cats.data.map((c) => ({ ...c, subcategories: subs.data.filter((s) => s.category_id === c.id) }))
}

export async function fetchRepoTrends(limit = 8) {
  const { data, error } = await supabase.from("repo_trends").select("*").order("stars", { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

/** Avisos en vivo: cada skill nueva genera un evento liviano. */
export function subscribeToCatalog(onEvent) {
  const channel = supabase
    .channel("catalog-events")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "catalog_events" }, (p) => onEvent(p.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
