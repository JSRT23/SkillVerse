import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useSearchParams } from "react-router"
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react"
import SkillCard from "../components/SkillCard"
import Mascot from "../components/Mascot"
import { CategoryIcon, Skeleton } from "../components/ui"
import { useCatalog, useCategoriesWithCounts } from "../hooks/useCatalog"
import { matchScore } from "../lib/format"

const SORTS = [
  { id: "stars", label: "Más estrellas" },
  { id: "newest", label: "Más recientes" },
  { id: "name", label: "Nombre (A-Z)" },
]
const TRUSTS = [
  { id: "", label: "Todas" },
  { id: "official", label: "Oficiales" },
  { id: "community", label: "Comunidad" },
]
const PAGE = 24

export function filterSkills(skills, { q, cat, sort, trust, noScripts }) {
  let list = skills
  if (cat) list = list.filter((s) => s.category_slug === cat)
  if (trust) list = list.filter((s) => s.trust === trust)
  if (noScripts) list = list.filter((s) => !s.has_scripts)
  const scored = list.map((s) => ({ s, score: matchScore(s, q) })).filter((r) => r.score > 0)
  scored.sort((a, b) => {
    if (q && b.score !== a.score) return b.score - a.score
    if (sort === "newest") return new Date(b.s.first_seen_at) - new Date(a.s.first_seen_at) || b.s.stars - a.s.stars
    if (sort === "name") return a.s.name.localeCompare(b.s.name)
    return b.s.stars - a.s.stars || a.s.name.localeCompare(b.s.name)
  })
  return scored.map((r) => r.s)
}

export default function Explore({ newIds }) {
  const [params, setParams] = useSearchParams()
  const { data: skills = [], isLoading, isError, refetch } = useCatalog()
  const { data: categories = [] } = useCategoriesWithCounts()
  const [visible, setVisible] = useState(PAGE)

  const q = params.get("q") ?? ""
  const cat = params.get("categoria") ?? ""
  const sort = params.get("orden") ?? "stars"
  const trust = params.get("confianza") ?? ""
  const noScripts = params.get("scripts") === "no"

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setVisible(PAGE)
  }

  const results = useMemo(() => filterSkills(skills, { q, cat, sort, trust, noScripts }), [skills, q, cat, sort, trust, noScripts])
  const activeFilters = [cat, trust, noScripts, q].filter(Boolean).length

  return (
    <div className="container-page pt-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl">Explorar skills</h1>
          <p className="mt-3 max-w-xl text-haze">Filtra por categoría, origen o si incluye scripts. Los filtros quedan en la dirección, así puedes compartir la búsqueda.</p>
        </div>
        <Mascot size={110} mood={q ? "search" : "idle"} outfit="magnifier" accent="#38D6C4" className="hidden lg:block" />
      </div>

      {/* Buscador y filtros */}
      <div className="sticky top-16 z-30 -mx-4 mt-8 border-y border-line/50 bg-ink/85 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-[22px] sm:border sm:px-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-dusk/80 px-4 py-2.5 focus-within:border-violet">
            <Search size={18} className="text-amber" aria-hidden />
            <input
              value={q}
              onChange={(e) => update("q", e.target.value)}
              placeholder="Busca por nombre, descripción o repositorio"
              className="w-full bg-transparent outline-none placeholder:text-haze/70"
              aria-label="Buscar skills"
            />
            <AnimatePresence>
              {q && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} type="button" onClick={() => update("q", "")} className="text-haze hover:text-silk cursor-pointer" aria-label="Borrar búsqueda">
                  <X size={16} />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
          <div className="flex flex-wrap gap-2">
            <Select label="Ordenar por" value={sort} onChange={(v) => update("orden", v === "stars" ? "" : v)} options={SORTS} />
            <Select label="Origen" value={trust} onChange={(v) => update("confianza", v)} options={TRUSTS} />
            <button
              type="button"
              onClick={() => update("scripts", noScripts ? "" : "no")}
              aria-pressed={noScripts}
              className={`chip cursor-pointer px-4 py-2.5 text-sm transition-colors ${noScripts ? "border-amber bg-amber/15 text-amber" : "border-line bg-dusk/80 text-haze hover:text-silk"}`}
            >
              <SlidersHorizontal size={14} aria-hidden /> Sin scripts
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <CategoryChip active={!cat} onClick={() => update("categoria", "")} label="Todas" count={skills.length} />
          {categories.filter((c) => c.count > 0).map((c) => (
            <CategoryChip key={c.slug} active={cat === c.slug} onClick={() => update("categoria", cat === c.slug ? "" : c.slug)} label={c.name} count={c.count} slug={c.slug} color={c.color} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-haze">
        <p aria-live="polite">
          {isLoading ? "Cargando…" : `${results.length} ${results.length === 1 ? "skill" : "skills"}`}
        </p>
        {activeFilters > 0 && (
          <button type="button" onClick={() => { setParams({}, { replace: true }); setVisible(PAGE) }} className="font-semibold text-amber hover:underline cursor-pointer">
            Quitar filtros
          </button>
        )}
      </div>

      {isError && (
        <div className="panel mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <Mascot size={110} mood="sleep" />
          <p className="font-semibold">No pudimos cargar el catálogo.</p>
          <p className="text-sm text-haze">Revisa tu conexión y vuelve a intentarlo.</p>
          <button type="button" onClick={() => refetch()} className="btn-primary mt-2">Reintentar</button>
        </div>
      )}

      <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)
          : (
            <AnimatePresence mode="popLayout">
              {results.slice(0, visible).map((s, i) => <SkillCard key={s.id} skill={s} index={i} isNew={newIds?.has(s.id)} />)}
            </AnimatePresence>
          )}
      </motion.div>

      {!isLoading && !isError && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel mt-2 flex flex-col items-center gap-3 p-10 text-center">
          <Mascot size={120} mood="search" outfit="magnifier" accent="#38D6C4" />
          <p className="font-display text-lg font-semibold">Ninguna skill coincide</p>
          <p className="max-w-md text-sm text-haze">Prueba con menos palabras, otra categoría, o quita los filtros para ver todo el catálogo.</p>
          <button type="button" onClick={() => setParams({}, { replace: true })} className="btn-primary mt-2">Quitar filtros</button>
        </motion.div>
      )}

      {results.length > visible && (
        <div className="mt-10 flex justify-center">
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={() => setVisible((v) => v + PAGE)} className="btn-ghost">
            Mostrar {Math.min(PAGE, results.length - visible)} más
          </motion.button>
        </div>
      )}
    </div>
  )
}

function CategoryChip({ active, onClick, label, count, slug, color = "#FFC447" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
      className={`chip relative shrink-0 cursor-pointer px-3.5 py-2 text-sm transition-colors ${active ? "text-ink-deep" : "border-line bg-dusk/60 text-haze hover:text-silk"}`}
      style={active ? { borderColor: color } : undefined}
    >
      {active && <motion.span layoutId="cat-chip" className="absolute inset-0 rounded-full" style={{ background: color }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
      <span className="relative flex items-center gap-1.5">
        {slug && <CategoryIcon slug={slug} color={active ? "#0F0D2B" : color} size={13} />}
        {label}
        <span className={`text-xs ${active ? "opacity-70" : "text-haze/80"}`}>{count}</span>
      </span>
    </motion.button>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-full border border-line bg-dusk/80 py-2.5 pl-4 pr-9 text-sm font-semibold text-silk outline-none transition-colors hover:border-violet focus:border-violet"
      >
        {options.map((o) => <option key={o.id} value={o.id} className="bg-dusk">{o.label}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 text-haze" aria-hidden />
    </label>
  )
}
