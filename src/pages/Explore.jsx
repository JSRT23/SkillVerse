import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useSearchParams } from "react-router"
import { ChevronDown, LayoutGrid, List, LoaderCircle, Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import SkillCard, { SkillRow } from "../components/SkillCard"
import Nodo from "../components/Nodo"
import { useNodo, useNodoWork } from "../nodoContext"
import Modal from "../components/Modal"
import { CategoryIcon, Skeleton } from "../components/ui"
import { useSkillList, useTaxonomyWithCounts } from "../hooks/useCatalog"
import { MAIN_CATEGORIES } from "../lib/categories"
import { formatCompact, formatNumber } from "../lib/format"

const SORTS = [
  { id: "stars", label: "Más estrellas" },
  { id: "newest", label: "Más recientes" },
  { id: "name", label: "Nombre (A-Z)" },
]
const ORIGINS = [
  { id: "", label: "Todas" },
  { id: "official", label: "Oficiales" },
  { id: "verified", label: "Verificadas" },
  { id: "community", label: "Comunidad" },
]

function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

/** Filtros por categoría y subcategoría (barra lateral y hoja móvil). */
function Filters({ categories, cat, sub, origin, noScripts, set }) {
  const main = [...MAIN_CATEGORIES, "other"].map((slug) => categories.find((c) => c.slug === slug)).filter((c) => c && c.count > 0)
  return (
    <div className="space-y-7">
      <div>
        <h3 className="px-2 text-sm font-semibold text-fg">Categorías</h3>
        <ul className="mt-2 space-y-0.5">
          <li>
            <button type="button" onClick={() => set({ categoria: "", sub: "" })} className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm cursor-pointer ${!cat ? "bg-soft font-semibold text-fg" : "text-muted hover:bg-soft hover:text-fg"}`}>
              Todas
            </button>
          </li>
          {main.map((c) => {
            const open = cat === c.slug
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => set({ categoria: open && !sub ? "" : c.slug, sub: "" })}
                  aria-expanded={open}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm cursor-pointer ${open ? "bg-soft font-semibold text-fg" : "text-muted hover:bg-soft hover:text-fg"}`}
                >
                  <CategoryIcon slug={c.slug} color={c.color} size={15} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs tabular-nums text-subtle">{formatCompact(c.count)}</span>
                  {c.subcategories.length > 0 && <ChevronDown size={14} className={`text-subtle transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />}
                </button>
                <AnimatePresence initial={false}>
                  {open && c.subcategories.length > 0 && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      {c.subcategories.map((s) => (
                        <li key={s.slug}>
                          <button
                            type="button"
                            onClick={() => set({ categoria: c.slug, sub: sub === s.slug ? "" : s.slug })}
                            className={`relative ml-4 flex w-[calc(100%-1rem)] items-center justify-between border-l py-1.5 pl-4 pr-2 text-left text-[13px] cursor-pointer ${sub === s.slug ? "font-semibold text-fg" : "border-line text-muted hover:text-fg"}`}
                            style={sub === s.slug ? { borderColor: c.color } : undefined}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-[11px] tabular-nums text-subtle">{formatCompact(s.count)}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h3 className="px-2 text-sm font-semibold text-fg">Origen</h3>
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {ORIGINS.map((o) => (
            <button key={o.id} type="button" onClick={() => set({ origen: o.id })} aria-pressed={origin === o.id}
              className={`chip cursor-pointer px-3 py-1.5 text-[13px] transition-colors ${origin === o.id ? "border-brand bg-brand/12 text-brand" : "border-line bg-elev text-muted hover:text-fg"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-elev px-3 py-3">
        <span>
          <span className="block text-sm font-semibold text-fg">Solo sin scripts</span>
          <span className="block text-xs text-subtle">Skills que solo traen instrucciones</span>
        </span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${noScripts ? "bg-brand" : "bg-line"}`}>
          <motion.span layout className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: noScripts ? 22 : 2 }} />
        </span>
        <input type="checkbox" className="sr-only" checked={noScripts} onChange={() => set({ scripts: noScripts ? "" : "no" })} />
      </label>
    </div>
  )
}

export default function Explore({ newIds }) {
  const [params, setParams] = useSearchParams()
  const { data: categories = [] } = useTaxonomyWithCounts()
  const [sheet, setSheet] = useState(false)
  const [view, setView] = useState(() => { try { return localStorage.getItem("sv-view") || "grid" } catch { return "grid" } })
  const sentinel = useRef(null)

  const qParam = params.get("q") ?? ""
  const [qInput, setQInput] = useState(qParam)
  const q = useDebounced(qInput, 300)
  const cat = params.get("categoria") ?? ""
  const sub = params.get("sub") ?? ""
  const sort = params.get("orden") ?? "stars"
  const origin = params.get("origen") ?? ""
  const noScripts = params.get("scripts") === "no"
  const smart = params.get("ia") !== "no"

  const set = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    setParams(next, { replace: true })
  }
  useEffect(() => { if (q !== qParam) set({ q }) }, [q]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setQInput(qParam) }, [qParam]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem("sv-view", view) } catch { /* sin almacenamiento */ } }, [view])

  const list = useSkillList({ q, category: cat, subcategory: sub, origin, noScripts, sort, smart })
  const { items, total, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage, isFetching } = list
  useNodoWork(cat, sub)

  // Nodo reacciona a lo que pasa con la búsqueda
  const { react } = useNodo()
  const empty = !isLoading && !isError && items.length === 0 && Boolean(q || cat || origin || noScripts)
  useEffect(() => { if (empty) react("sad", "No encontré nada… prueba otras palabras", 2600) }, [empty, q]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (isError) react("angry", "¡Se cayó la conexión!", 2600) }, [isError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll infinito
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() }, { rootMargin: "600px" })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const catObj = categories.find((c) => c.slug === cat)
  const subObj = catObj?.subcategories.find((s) => s.slug === sub)
  const active = [
    q && { key: "q", label: `“${q}”`, clear: () => { setQInput(""); set({ q: "" }) } },
    catObj && { key: "cat", label: catObj.name, clear: () => set({ categoria: "", sub: "" }) },
    subObj && { key: "sub", label: subObj.name, clear: () => set({ sub: "" }) },
    origin && { key: "origin", label: ORIGINS.find((o) => o.id === origin)?.label, clear: () => set({ origen: "" }) },
    noScripts && { key: "scripts", label: "Sin scripts", clear: () => set({ scripts: "" }) },
  ].filter(Boolean)
  const filterProps = { categories, cat, sub, origin, noScripts, set }

  return (
    <div className="container-page pt-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold sm:text-[3.2rem]" style={{ letterSpacing: "-0.04em" }}>Explorar skills</h1>
          <p className="mt-3 max-w-xl text-muted">Busca con tus palabras y filtra por categoría, subcategoría u origen. Los filtros quedan en la dirección para compartirlos.</p>
        </div>
        <Nodo size={120} {...(cat ? { category: cat, subcategory: sub } : { hat: "glasses", prop: "magnifier" })} mood={isFetching ? "thinking" : q ? "happy" : "idle"} track className="hidden shrink-0 lg:block" title="Nodo te ayuda a buscar" />
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-1">
            <Filters {...filterProps} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Barra de búsqueda */}
          <div className="sticky top-[76px] z-30 -mx-4 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-[22px] sm:border sm:px-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-w-[220px] flex-1 items-center gap-3 rounded-full border border-line bg-elev px-4 py-2.5 transition-colors focus-within:border-brand">
                {isFetching && !isFetchingNextPage ? <LoaderCircle size={18} className="animate-spin text-brand" aria-hidden /> : <Search size={18} className="text-brand" aria-hidden />}
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={smart ? "Describe lo que necesitas…" : "Busca por nombre o palabra"}
                  className="w-full bg-transparent text-fg outline-none placeholder:text-subtle"
                  aria-label="Buscar skills"
                />
                {qInput && (
                  <button type="button" onClick={() => setQInput("")} className="text-subtle hover:text-fg cursor-pointer" aria-label="Borrar búsqueda"><X size={16} /></button>
                )}
              </label>
              <button
                type="button"
                onClick={() => set({ ia: smart ? "no" : "" })}
                aria-pressed={smart}
                title="Busca por significado, no solo por palabras exactas"
                className={`chip cursor-pointer px-3.5 py-2.5 text-sm transition-colors ${smart ? "border-orchid/50 bg-orchid/10 text-orchid" : "border-line bg-elev text-muted hover:text-fg"}`}
              >
                <Sparkles size={14} aria-hidden /> Inteligente
              </button>
              <label className="relative flex items-center">
                <span className="sr-only">Ordenar por</span>
                <select value={sort} onChange={(e) => set({ orden: e.target.value === "stars" ? "" : e.target.value })} disabled={smart && q.length >= 3}
                  className="cursor-pointer appearance-none rounded-full border border-line bg-elev py-2.5 pl-4 pr-9 text-sm font-medium text-fg outline-none hover:border-brand/50 disabled:opacity-50">
                  {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 text-subtle" aria-hidden />
              </label>
              <div className="flex rounded-full border border-line bg-elev p-1" role="group" aria-label="Vista">
                {[["grid", LayoutGrid, "Tarjetas"], ["list", List, "Lista"]].map(([id, Icon, label]) => (
                  <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} aria-label={label}
                    className={`relative grid h-8 w-8 place-items-center rounded-full cursor-pointer ${view === id ? "text-fg" : "text-subtle hover:text-fg"}`}>
                    {view === id && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-soft" />}
                    <Icon size={15} className="relative" />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setSheet(true)} className="btn-ghost py-2.5 lg:hidden">
                <SlidersHorizontal size={15} aria-hidden /> Filtros{active.length ? ` (${active.length})` : ""}
              </button>
            </div>

            <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2 text-sm">
              <span className="text-muted" aria-live="polite">
                {isLoading ? "Buscando…" : smart && q.length >= 3 ? `${formatNumber(total ?? 0)} resultados más relevantes` : `${formatNumber(total ?? 0)} skills`}
              </span>
              <AnimatePresence initial={false}>
                {active.map((f) => (
                  <motion.button key={f.key} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    type="button" onClick={f.clear} className="chip cursor-pointer border-line bg-elev py-1 text-[13px] text-fg hover:border-danger/50">
                    {f.label} <X size={12} className="text-subtle" aria-hidden />
                  </motion.button>
                ))}
              </AnimatePresence>
              {active.length > 1 && (
                <button type="button" onClick={() => { setQInput(""); setParams({}, { replace: true }) }} className="text-[13px] font-semibold text-brand hover:underline cursor-pointer">
                  Quitar todo
                </button>
              )}
            </div>
          </div>

          {isError && (
            <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
              <Nodo size={110} mood="angry" title="Nodo enojado: falló la conexión" />
              <p className="font-semibold">No pudimos cargar las skills.</p>
              <p className="text-sm text-muted">Revisa tu conexión y vuelve a intentarlo.</p>
              <button type="button" onClick={() => refetch()} className="btn-primary mt-2">Reintentar</button>
            </div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-52" />)}</div>
            ) : view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {items.map((s, i) => <SkillCard key={s.id} skill={s} index={i % 24} isNew={newIds?.has(s.id)} />)}
                </AnimatePresence>
              </div>
            ) : (
              <ul className="card divide-y divide-line p-2">
                <AnimatePresence mode="popLayout">
                  {items.map((s, i) => <SkillRow key={s.id} skill={s} index={i % 24} />)}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {!isLoading && !isError && items.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center gap-3 p-12 text-center">
              <Nodo size={140} mood="sad" hat="glasses" prop="magnifier" title="Nodo no encontró resultados" />
              <p className="font-display text-xl font-semibold">Ninguna skill coincide</p>
              <p className="max-w-md text-sm text-muted">Prueba con otras palabras, activa la búsqueda inteligente o quita algún filtro.</p>
              <button type="button" onClick={() => { setQInput(""); setParams({}, { replace: true }) }} className="btn-primary mt-2">Quitar filtros</button>
            </motion.div>
          )}

          <div ref={sentinel} className="flex h-24 items-center justify-center">
            {isFetchingNextPage && <LoaderCircle className="animate-spin text-brand" aria-label="Cargando más" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <Modal onClose={() => setSheet(false)} label="Filtros" width="max-w-lg">
            <div className="overflow-y-auto p-6 pt-4">
              <h2 className="font-display text-xl font-semibold">Filtros</h2>
              <div className="mt-5"><Filters {...filterProps} /></div>
              <button type="button" onClick={() => setSheet(false)} className="btn-primary mt-6 w-full">Ver {formatNumber(total ?? 0)} skills</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
