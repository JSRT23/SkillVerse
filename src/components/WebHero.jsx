import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"
import Nodo from "./Nodo"
import { CategoryIcon } from "./ui"
import { MAIN_CATEGORIES } from "../lib/categories"
import { formatNumber } from "../lib/format"

const SIZE = 600
const R = 270
const RINGS = [64, 112, 160, 208, 252]
const NODE_R = 206
const NODO_W = 0.3 // ancho de Nodo respecto al contenedor
const STEP_MS = 3800 // cada cuánto salta a la siguiente categoría
const TRAVEL_MS = 700

const polar = (angle, r) => [Math.cos(angle) * r, Math.sin(angle) * r]

/** Anillo de la telaraña: curvas entre radios con una leve caída hacia el centro. */
function ringPath(angles, r) {
  let d = ""
  angles.forEach((a, i) => {
    const next = angles[(i + 1) % angles.length]
    const [x1, y1] = polar(a, r)
    const [x2, y2] = polar(next, r)
    const mid = a + ((next - a + Math.PI * 2) % (Math.PI * 2)) / 2
    const [cx, cy] = polar(mid, r * 0.86)
    d += `${i === 0 ? `M${x1.toFixed(1)},${y1.toFixed(1)}` : ""} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
  })
  return d
}

export default function WebHero({ categories = [] }) {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const box = useRef(null)
  const inView = useInView(box, { amount: 0.3 })
  const [hovered, setHovered] = useState(null)
  const [auto, setAuto] = useState(0)
  const [moving, setMoving] = useState(false)
  const [cheer, setCheer] = useState(false)

  const nodes = useMemo(() => {
    const list = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
    return list.map((c, i) => {
      const angle = -Math.PI / 2 + (i / list.length) * Math.PI * 2
      const [x, y] = polar(angle, NODE_R)
      return { ...c, angle, x, y }
    })
  }, [categories])

  // Nodo recorre la telaraña solo: cada pocos segundos pasa a la categoría siguiente
  useEffect(() => {
    if (!nodes.length || hovered || !inView) return
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setAuto((i) => (i + 1) % nodes.length)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [nodes.length, hovered, inView])

  const active = nodes.find((n) => n.slug === hovered) ?? nodes[auto % (nodes.length || 1)]

  // Camina mientras viaja y, al llegar, a veces celebra
  useEffect(() => {
    if (!active) return
    setMoving(true)
    setCheer(false)
    const t1 = setTimeout(() => {
      setMoving(false)
      setCheer(Math.random() < 0.25)
    }, TRAVEL_MS)
    return () => clearTimeout(t1)
  }, [active?.slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const angles = nodes.length ? nodes.map((n) => n.angle) : Array.from({ length: 8 }, (_, i) => -Math.PI / 2 + (i / 8) * Math.PI * 2)
  const reach = 0.42
  const pos = active ? { x: active.x * reach, y: active.y * reach } : { x: 0, y: 0 }
  const toPct = (v) => `${(v / SIZE / NODO_W) * 100}%`

  const draw = (delay) =>
    reduced
      ? {}
      : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.1, delay, ease: "easeInOut" } }

  const mood = moving && !reduced ? "walk" : cheer ? "celebrate" : "happy"

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[580px] select-none">
      <div className="absolute inset-[14%] rounded-full bg-brand/20 blur-3xl" aria-hidden />

      <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="silk-fade">
            <stop offset="0.55" style={{ stopColor: "var(--fg)", stopOpacity: 0.5 }} />
            <stop offset="1" style={{ stopColor: "var(--fg)", stopOpacity: 0.07 }} />
          </radialGradient>
        </defs>
        <g stroke="url(#silk-fade)" fill="none" strokeWidth="1.2" strokeLinecap="round">
          {angles.map((a, i) => {
            const [x, y] = polar(a, R)
            return <motion.path key={`s${i}`} d={`M0,0 L${x.toFixed(1)},${y.toFixed(1)}`} {...draw(i * 0.06)} />
          })}
          {RINGS.map((r, i) => (
            <motion.path key={`r${i}`} d={ringPath(angles, r)} {...draw(0.5 + i * 0.14)} />
          ))}
        </g>

        {/* hilo resaltado hacia la categoría activa */}
        {active && (
          <motion.line
            key={active.slug}
            x1="0" y1="0" x2={active.x} y2={active.y}
            stroke={active.color} strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }}
            style={{ filter: `drop-shadow(0 0 6px ${active.color})` }}
          />
        )}

        {/* gotas de rocío */}
        {!reduced &&
          RINGS.slice(1).flatMap((r, ri) =>
            angles.filter((_, i) => (i + ri) % 3 === 0).map((a, i) => {
              const [x, y] = polar(a + 0.18, r * 0.93)
              return (
                <motion.circle
                  key={`d${ri}-${i}`} cx={x} cy={y} r="2.2" fill="#FFB224"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0.2, 0.9, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1.8 + ri * 0.7 + i * 0.5 }}
                />
              )
            }),
          )}
      </svg>

      {/* Nodo camina por la telaraña */}
      <motion.div
        className="pointer-events-none absolute z-20"
        style={{ left: `${50 - (NODO_W * 100) / 2}%`, top: `${50 - (NODO_W * 100) / 2}%`, width: `${NODO_W * 100}%` }}
        animate={{ x: toPct(pos.x), y: toPct(pos.y) }}
        transition={{ type: "spring", stiffness: 70, damping: 15 }}
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-x-[18%] bottom-[2%] h-[10%] rounded-[50%] bg-black/30 blur-md" aria-hidden />
        <Nodo
          size="100%"
          category={active?.slug}
          mood={mood}
          title={active ? `Nodo con el vestuario de ${active.name}` : "Nodo"}
        />
      </motion.div>

      {/* nodos de categoría */}
      {nodes.map((n, i) => {
        const left = 50 + (n.x / SIZE) * 100
        const top = 50 + (n.y / SIZE) * 100
        const isActive = active?.slug === n.slug
        const labelBelow = n.y > -20
        return (
          <motion.button
            key={n.slug}
            type="button"
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1.2 + i * 0.07 }}
            onMouseEnter={() => setHovered(n.slug)}
            onMouseLeave={() => { setHovered(null); setAuto(i) }}
            onFocus={() => setHovered(n.slug)}
            onBlur={() => { setHovered(null); setAuto(i) }}
            onClick={() => navigate(`/categoria/${n.slug}`)}
            aria-label={`${n.name}: ${n.count ?? 0} skills`}
          >
            <motion.span
              className="relative grid h-12 w-12 place-items-center rounded-full border-2 bg-elev sm:h-[60px] sm:w-[60px]"
              style={{ borderColor: n.color, boxShadow: isActive ? `0 0 0 6px ${n.color}33, 0 0 34px ${n.color}` : `0 6px 20px -6px ${n.color}88` }}
              animate={{ scale: isActive ? 1.18 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CategoryIcon slug={n.slug} color={n.color} size={21} />
              {n.count > 0 && (
                <span className="absolute -right-2 -top-1.5 rounded-full bg-amber px-1.5 py-0.5 font-display text-[10px] font-bold leading-none text-night shadow">
                  {formatNumber(n.count)}
                </span>
              )}
            </motion.span>
            <motion.span
              className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-elev px-3 py-1 text-xs font-semibold text-fg shadow-lg sm:block ${labelBelow ? "top-full mt-2.5" : "bottom-full mb-2.5"}`}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : labelBelow ? -4 : 4 }}
            >
              {n.name}
            </motion.span>
          </motion.button>
        )
      })}

      {/* En móvil la etiqueta va debajo de la telaraña */}
      {active && (
        <p className="absolute inset-x-0 -bottom-2 text-center text-sm font-semibold text-muted sm:hidden" aria-live="polite">
          <span style={{ color: active.color }}>●</span> {active.name}
        </p>
      )}
    </div>
  )
}
