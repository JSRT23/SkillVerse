import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useQuery } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router"
import { ArrowRight, CornerDownLeft, LoaderCircle, Search, Sparkles } from "lucide-react"
import Modal from "./Modal"
import Ocho from "./Ocho"
import { CategoryIcon, Kbd, StarCount } from "./ui"
import { usePopular } from "../hooks/useCatalog"
import { searchSkills, smartSearch } from "../lib/supabase"

function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export default function CommandPalette({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <Modal onClose={onClose} label="Buscar skills" width="max-w-2xl" align="top" closeButton={false}>
          <PaletteBody onClose={onClose} />
        </Modal>
      )}
    </AnimatePresence>
  )
}

function PaletteBody({ onClose }) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query.trim(), 260)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const input = useRef(null)
  const list = useRef(null)
  const { data: popular = [] } = usePopular(7)

  const smart = q.length >= 3
  const search = useQuery({
    queryKey: ["palette", q],
    queryFn: async () => {
      try { return await smartSearch({ q, limit: 10 }) }
      catch { return await searchSkills({ q, limit: 10 }) } // respaldo por texto
    },
    enabled: q.length >= 2,
    staleTime: 60_000,
  })
  const results = q.length >= 2 ? (search.data ?? []) : popular
  const loading = q.length >= 2 && search.isFetching

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => setActive(0), [q])
  useEffect(() => { list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" }) }, [active])

  const openSkill = (skill) => {
    onClose()
    const background = location.state?.background ?? location
    setTimeout(() => navigate(`/skill/${skill.slug}`, { state: { background } }), 140)
  }
  const openExplore = () => { onClose(); navigate(`/explorar?q=${encodeURIComponent(query.trim())}`) }

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    if (e.key === "Enter") {
      e.preventDefault()
      if (results[active]) openSkill(results[active])
      else if (query.trim()) openExplore()
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <label className="flex items-center gap-3 border-b border-line px-5 py-4">
        {loading ? <LoaderCircle size={20} className="animate-spin text-brand" aria-hidden /> : <Search size={20} className="text-brand" aria-hidden />}
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe lo que necesitas: “probar mi web”, “pdf”, “diseño”…"
          className="w-full bg-transparent text-[17px] text-fg outline-none placeholder:text-subtle"
          aria-label="Buscar skills"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          autoComplete="off"
        />
        <Kbd>Esc</Kbd>
      </label>

      <div className="flex items-center gap-2 px-5 pb-1 pt-3 text-xs text-subtle">
        {q.length >= 2 ? (
          smart ? <><Sparkles size={13} className="text-orchid" aria-hidden /> Búsqueda inteligente: entiende lo que quieres decir</> : "Resultados"
        ) : "Populares"}
      </div>

      <ul id="palette-results" ref={list} role="listbox" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <AnimatePresence initial={false} mode="popLayout">
          {results.map((s, i) => (
            <motion.li
              key={s.id}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, delay: i * 0.015 }}
              role="option"
              aria-selected={i === active}
              data-index={i}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => openSkill(s)}
                className="relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left cursor-pointer"
              >
                {i === active && <motion.span layoutId="palette-active" className="absolute inset-0 rounded-2xl bg-soft" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className="relative"><CategoryIcon slug={s.category_slug} color={s.category_color} size={15} boxed /></span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-subtle">{s.subcategory_name ?? s.category_name} · {s.repo_full_name}</span>
                </span>
                <StarCount value={s.stars} className="relative text-xs text-muted" />
                <CornerDownLeft size={14} className={`relative text-subtle transition-opacity ${i === active ? "opacity-100" : "opacity-0"}`} aria-hidden />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {q.length >= 2 && !loading && !results.length && (
          <li className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Ocho size={96} mood="curious" tentacles={false} bob={false} />
            <p className="font-semibold">Nada con “{query}”</p>
            <p className="text-sm text-muted">Prueba con otras palabras o abre el explorador con filtros.</p>
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-subtle">
        <span className="hidden items-center gap-1.5 sm:flex"><Kbd>↑</Kbd><Kbd>↓</Kbd> moverse <Kbd>Enter</Kbd> abrir</span>
        {query.trim() && (
          <button type="button" onClick={openExplore} className="ml-auto inline-flex items-center gap-1 font-semibold text-brand hover:underline cursor-pointer">
            Ver todos los resultados <ArrowRight size={13} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
