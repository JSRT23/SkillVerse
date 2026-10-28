import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useNavigate, useLocation } from "react-router"
import { CornerDownLeft, Search } from "lucide-react"
import Modal from "./Modal"
import Mascot from "./Mascot"
import { CategoryIcon, StarCount } from "./ui"
import { useCatalog } from "../hooks/useCatalog"
import { matchScore } from "../lib/format"

export default function CommandPalette({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <Modal onClose={onClose} label="Buscar skills" width="max-w-2xl" align="top">
          <PaletteBody onClose={onClose} />
        </Modal>
      )}
    </AnimatePresence>
  )
}

function PaletteBody({ onClose }) {
  const { data: skills = [], isLoading } = useCatalog()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const input = useRef(null)
  const list = useRef(null)

  useEffect(() => { input.current?.focus() }, [])

  const results = useMemo(() => {
    if (!query.trim()) return skills.slice(0, 7)
    return skills
      .map((s) => ({ s, score: matchScore(s, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.s.stars - a.s.stars)
      .slice(0, 8)
      .map((r) => r.s)
  }, [skills, query])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const open = (skill) => {
    onClose()
    const background = location.state?.background ?? location
    setTimeout(() => navigate(`/skill/${skill.slug}`, { state: { background } }), 120)
  }

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); open(results[active]) }
    if (e.key === "Enter" && !results.length && query) { onClose(); navigate(`/explorar?q=${encodeURIComponent(query)}`) }
  }

  return (
    <div className="p-2">
      <label className="flex items-center gap-3 border-b border-line px-4 py-4 pr-14">
        <Search size={20} className="text-amber" aria-hidden />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Busca por nombre, tema o repositorio…"
          className="w-full bg-transparent text-lg outline-none placeholder:text-haze/70"
          aria-label="Buscar skills"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
        />
      </label>

      <ul id="palette-results" ref={list} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
        {isLoading && <li className="p-6 text-center text-haze">Cargando el catálogo…</li>}
        <AnimatePresence initial={false}>
          {results.map((s, i) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}
              role="option"
              aria-selected={i === active}
              data-index={i}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => open(s)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors cursor-pointer ${i === active ? "bg-dusk-2" : ""}`}
              >
                <CategoryIcon slug={s.category_slug} color={s.category_color} size={16} boxed />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-haze">{s.repo_full_name} · {s.category_name}</span>
                </span>
                <StarCount value={s.stars} className="text-xs" />
                {i === active && <CornerDownLeft size={15} className="text-haze" aria-hidden />}
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {!isLoading && !results.length && (
          <li className="flex flex-col items-center gap-2 p-6 text-center">
            <Mascot size={90} mood="search" bob={false} />
            <p className="font-semibold">Nada con “{query}”</p>
            <p className="text-sm text-haze">Prueba con otra palabra o pulsa Enter para buscar en el explorador.</p>
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-haze">
        <span>↑ ↓ para moverte, Enter para abrir</span>
        <span>Esc para cerrar</span>
      </div>
    </div>
  )
}
