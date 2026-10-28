import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link, NavLink, useLocation } from "react-router"
import { Menu, Search, X } from "lucide-react"
import Mascot from "./Mascot"
import { useSyncStatus } from "../hooks/useCatalog"
import { formatNumber, timeAgo } from "../lib/format"

const LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/explorar", label: "Explorar" },
  { to: "/categorias", label: "Categorías" },
  { to: "/guia", label: "Guía" },
  { to: "/nodo", label: "Conoce a Nodo" },
]

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2" aria-label="SkillVerse, ir al inicio">
      <motion.span whileHover={{ rotate: [0, -12, 10, 0] }} transition={{ duration: 0.6 }} className="-my-2 inline-block">
        <Mascot size={44} bob={false} title="" />
      </motion.span>
      <span className="font-display text-lg font-bold tracking-tight">
        Skill<span className="text-amber">Verse</span>
      </span>
    </Link>
  )
}

function LiveBadge() {
  const { data } = useSyncStatus()
  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-lagoon/30 bg-lagoon/10 px-3 py-1.5 text-xs font-semibold text-lagoon lg:inline-flex"
      title={data?.last_synced_at ? `Última sincronización con GitHub ${timeAgo(data.last_synced_at)}` : "Conectando"}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lagoon opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-lagoon" />
      </span>
      En vivo{data ? `: ${formatNumber(data.total_skills)} skills` : ""}
    </span>
  )
}

export function Navbar({ onSearch }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${scrolled ? "border-b border-line/70 bg-ink/80 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="container-page flex h-16 items-center gap-4">
        <Logo />

        <ul className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className="relative block rounded-full px-3.5 py-2 text-sm font-semibold text-haze transition-colors hover:text-silk aria-[current=page]:text-silk">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-dusk-2" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                    )}
                    <span className="relative">{l.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <LiveBadge />
          <motion.button
            type="button"
            onClick={onSearch}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full border border-line bg-dusk/70 py-2 pl-3 pr-2 text-sm text-haze transition-colors hover:border-violet hover:text-silk cursor-pointer"
            aria-label="Buscar skills (Ctrl+K)"
          >
            <Search size={16} aria-hidden />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden rounded-md border border-line bg-ink-deep px-1.5 py-0.5 font-mono text-[11px] sm:inline">Ctrl K</kbd>
          </motion.button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-dusk/70 md:hidden cursor-pointer"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="container-page overflow-hidden md:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.li key={l.to} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <NavLink to={l.to} end={l.end} className="block rounded-xl px-3 py-3 font-semibold text-haze aria-[current=page]:bg-dusk-2 aria-[current=page]:text-silk">
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

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-haze">
            Directorio independiente de Agent Skills en formato SKILL.md. No está afiliado a Anthropic ni a ningún otro proveedor de agentes.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Explora</h3>
          <ul className="mt-3 space-y-2 text-sm text-haze">
            <li><Link className="hover:text-silk" to="/explorar">Todas las skills</Link></li>
            <li><Link className="hover:text-silk" to="/categorias">Categorías</Link></li>
            <li><Link className="hover:text-silk" to="/explorar?orden=newest">Recién llegadas</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Aprende</h3>
          <ul className="mt-3 space-y-2 text-sm text-haze">
            <li><Link className="hover:text-silk" to="/guia">Qué es una skill</Link></li>
            <li><Link className="hover:text-silk" to="/guia#instalar">Cómo instalarlas</Link></li>
            <li><Link className="hover:text-silk" to="/guia#seguridad">Usarlas con seguridad</Link></li>
          </ul>
        </div>
      </div>
      <p className="container-page pb-10 text-xs text-haze/70">
        Los datos vienen de repositorios públicos de GitHub y se sincronizan cada 30 minutos. Cada skill pertenece a su autor y conserva su licencia.
      </p>
    </footer>
  )
}
