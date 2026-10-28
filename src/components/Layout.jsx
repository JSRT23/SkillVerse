import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link, NavLink, useLocation } from "react-router"
import { ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react"
import Nodo from "./Nodo"
import { useNodo } from "../nodoContext"
import { CategoryIcon, Kbd } from "./ui"
import { useSyncStatus, useTaxonomyWithCounts } from "../hooks/useCatalog"
import { MAIN_CATEGORIES } from "../lib/categories"
import { formatNumber, timeAgo } from "../lib/format"
import { useTheme } from "../theme"

const LINKS = [
  { to: "/explorar", label: "Explorar" },
  { to: "/categorias", label: "Categorías", mega: true },
  { to: "/guia", label: "Guía" },
  { to: "/nodo", label: "Conoce a Nodo" },
]

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="SkillVerse, ir al inicio">
      <motion.span whileHover={{ rotate: [0, -10, 8, 0], scale: 1.06 }} transition={{ duration: 0.6 }} className="-my-1 inline-block">
        <Nodo size={40} title="" />
      </motion.span>
      <span className="font-display text-[19px] font-bold tracking-tight text-fg">
        Skill<span className="text-gradient">Verse</span>
      </span>
    </Link>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const day = theme === "day"
  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex h-10 w-[74px] shrink-0 items-center rounded-full border border-line bg-bg p-1 cursor-pointer"
      aria-label={day ? "Cambiar a modo noche" : "Cambiar a modo día"}
      title={day ? "Modo noche" : "Modo día"}
    >
      <span className="absolute inset-0 flex items-center justify-between px-2.5 text-subtle" aria-hidden>
        <Sun size={14} /><Moon size={14} />
      </span>
      <motion.span
        layout
        className={`relative z-10 grid h-8 w-8 place-items-center rounded-full ${day ? "bg-amber text-night" : "bg-brand text-white"}`}
        style={{ marginLeft: day ? 0 : "auto", boxShadow: day ? "0 0 18px rgb(255 178 36 / 0.7)" : "0 0 18px rgb(124 92 255 / 0.7)" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={theme} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.25 }}>
            {day ? <Sun size={15} /> : <Moon size={15} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  )
}

function LiveCounter() {
  const { data } = useSyncStatus()
  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal xl:inline-flex"
      title={data?.last_synced_at ? `Último rastreo ${timeAgo(data.last_synced_at)}` : "Conectando"}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
      </span>
      {data ? `${formatNumber(data.total_skills)} skills en vivo` : "En vivo"}
    </span>
  )
}

function MegaMenu({ onNavigate }) {
  const { data: categories = [] } = useTaxonomyWithCounts()
  const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-1/2 top-full z-50 mt-1 w-[min(94vw,900px)] -translate-x-1/2 rounded-[24px] border border-line bg-elev p-3 shadow-[0_40px_100px_-30px_rgb(4_3_18/0.95)]"
    >
      <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
        {main.map((c) => (
          <div key={c.slug} className="rounded-2xl p-3 transition-colors hover:bg-soft">
            <Link to={`/categoria/${c.slug}`} onClick={onNavigate} className="flex items-center gap-2.5">
              <CategoryIcon slug={c.slug} color={c.color} size={15} boxed />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{c.name}</span>
                <span className="block text-xs text-subtle">{formatNumber(c.count)} skills</span>
              </span>
            </Link>
            <ul className="mt-2.5 space-y-0.5 pl-1">
              {c.subcategories.slice(0, 4).map((s) => (
                <li key={s.slug}>
                  <Link to={`/categoria/${c.slug}?sub=${s.slug}`} onClick={onNavigate} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[13px] text-muted hover:bg-bg hover:text-fg">
                    <span className="truncate">{s.name}</span>
                    <span className="text-[11px] tabular-nums text-subtle">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link to="/categorias" onClick={onNavigate} className="mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-brand hover:bg-soft">
        Ver todas las categorías y subcategorías
      </Link>
    </motion.div>
  )
}

export function Navbar({ onSearch }) {
  const [open, setOpen] = useState(false)
  const [mega, setMega] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const closeTimer = useRef(null)

  useEffect(() => { setOpen(false); setMega(false) }, [location.pathname, location.search])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const openMega = () => { clearTimeout(closeTimer.current); setMega(true) }
  const closeMega = () => { closeTimer.current = setTimeout(() => setMega(false), 140) }

  return (
    <header className={`shell sticky top-0 z-40 border-b text-fg transition-[background-color,box-shadow,border-color] duration-300 ${scrolled ? "border-line bg-[#0c0a20]/85 shadow-[0_16px_40px_-24px_rgb(0_0_0/0.9)] backdrop-blur-xl" : "border-transparent bg-[#0c0a20]"}`}>
      <nav className="container-page relative flex h-[68px] items-center gap-3">
        <Logo />

        <ul className="ml-6 hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => (
            <li key={l.to} className={l.mega ? "" : "relative"} onMouseEnter={l.mega ? openMega : undefined} onMouseLeave={l.mega ? closeMega : undefined}>
              <NavLink
                to={l.to}
                onFocus={l.mega ? openMega : undefined}
                className="relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-fg aria-[current=page]:text-fg"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-soft" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{l.label}</span>
                    {l.mega && <ChevronDown size={14} className={`relative transition-transform duration-200 ${mega ? "rotate-180" : ""}`} aria-hidden />}
                  </>
                )}
              </NavLink>
              <AnimatePresence>{l.mega && mega && <MegaMenu onNavigate={() => setMega(false)} />}</AnimatePresence>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <LiveCounter />
          <motion.button
            type="button"
            onClick={onSearch}
            whileTap={{ scale: 0.96 }}
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-bg pl-3.5 pr-2 text-sm text-muted transition-colors hover:border-brand/60 hover:text-fg cursor-pointer"
            aria-label="Buscar skills (Ctrl+K)"
          >
            <Search size={16} aria-hidden />
            <span className="hidden lg:inline">Buscar skills</span>
            <span className="hidden sm:inline"><Kbd>Ctrl K</Kbd></span>
          </motion.button>
          <ThemeToggle />
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn-icon md:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="container-page overflow-hidden md:hidden">
            {[{ to: "/", label: "Inicio" }, ...LINKS].map((l, i) => (
              <motion.li key={l.to} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <NavLink to={l.to} end={l.to === "/"} className="block rounded-xl px-3 py-3 font-medium text-muted aria-[current=page]:bg-soft aria-[current=page]:text-fg">
                  {l.label}
                </NavLink>
              </motion.li>
            ))}
            <li className="h-3" />
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  )
}

function NodoToggle() {
  const { hidden, setHidden } = useNodo()
  return (
    <p className="flex items-center gap-3">
      <span>Hecho con React, Supabase y un poco de seda de araña.</span>
      <button type="button" onClick={() => setHidden(!hidden)} className="rounded-full border border-line px-2.5 py-1 font-semibold text-muted transition-colors hover:border-brand/60 hover:text-fg cursor-pointer">
        {hidden ? "Mostrar a Nodo" : "Esconder a Nodo"}
      </button>
    </p>
  )
}

export function Footer() {
  const { data } = useSyncStatus()
  return (
    <footer className="shell relative mt-28 overflow-hidden border-t border-line bg-[#0c0a20] text-fg">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" aria-hidden />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Directorio independiente de Agent Skills en formato SKILL.md. Clasificadas con IA y actualizadas en tiempo real desde GitHub.
          </p>
          {data && (
            <p className="mt-4 text-xs text-subtle">
              {formatNumber(data.total_skills)} skills de {formatNumber(data.total_repos)} repositorios. Último rastreo {timeAgo(data.last_synced_at)}.
            </p>
          )}
        </div>
        {[
          ["Explora", [["/explorar", "Todas las skills"], ["/categorias", "Categorías"], ["/explorar?orden=newest", "Recién llegadas"]]],
          ["Aprende", [["/guia", "Qué es una skill"], ["/guia#instalar", "Cómo instalarlas"], ["/guia#seguridad", "Seguridad"]]],
          ["Proyecto", [["/nodo", "Conoce a Nodo"], ["https://github.com/JSRT23/SkillVerse", "Código en GitHub"]]],
        ].map(([title, links]) => (
          <div key={title}>
            <h3 className="font-display text-sm font-semibold">{title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {links.map(([to, label]) => (
                <li key={to}>
                  {to.startsWith("http")
                    ? <a className="hover:text-fg" href={to} target="_blank" rel="noreferrer">{label}</a>
                    : <Link className="hover:text-fg" to={to}>{label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-line py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>No afiliado a Anthropic ni a ningún proveedor de agentes. Cada skill pertenece a su autor y conserva su licencia.</p>
        <NodoToggle />
      </div>
    </footer>
  )
}
