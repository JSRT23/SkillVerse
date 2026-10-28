import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"
import Mascot from "./Mascot"
import { CategoryIcon } from "./ui"
import { categoryMeta } from "../lib/categories"

const SIZE = 600
const R = 270
const RINGS = [64, 112, 160, 208, 252]
const NODE_R = 206

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
  const [hovered, setHovered] = useState(null)

  const nodes = useMemo(() => {
    const list = categories.filter((c) => c.slug !== "other")
    return list.map((c, i) => {
      const angle = -Math.PI / 2 + (i / list.length) * Math.PI * 2
      const [x, y] = polar(angle, NODE_R)
      return { ...c, angle, x, y }
    })
  }, [categories])

  const angles = nodes.length ? nodes.map((n) => n.angle) : Array.from({ length: 10 }, (_, i) => -Math.PI / 2 + (i / 10) * Math.PI * 2)
  const active = nodes.find((n) => n.slug === hovered)
  const mascotPos = active ? { x: active.x * 0.4, y: active.y * 0.4 } : { x: 0, y: 0 }

  const draw = (delay) =>
    reduced
      ? {}
      : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.1, delay, ease: "easeInOut" } }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] select-none">
      {/* brillo de fondo */}
      <div className="absolute inset-[12%] rounded-full bg-violet/20 blur-3xl" aria-hidden />

      <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="silk-fade">
            <stop offset="0.55" stopColor="#F3F0FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#F3F0FF" stopOpacity="0.08" />
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
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }}
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
                  key={`d${ri}-${i}`} cx={x} cy={y} r="2.2" fill="#FFC447"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0.2, 0.9, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1.8 + ri * 0.7 + i * 0.5 }}
                />
              )
            }),
          )}
      </svg>

      {/* mascota */}
      <motion.div
        className="absolute left-[33%] top-[33%] w-[34%]"
        animate={{ x: `${(mascotPos.x / SIZE) * 294}%`, y: `${(mascotPos.y / SIZE) * 294}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
      >
        <Mascot
          size="100%"
          outfit={active ? categoryMeta(active.slug).outfit : undefined}
          accent={active?.color}
          mood={active ? "happy" : "idle"}
          title="Nodo teje la red de categorías"
        />
      </motion.div>

      {/* nodos de categoría */}
      {nodes.map((n, i) => {
        const left = 50 + (n.x / SIZE) * 100
        const top = 50 + (n.y / SIZE) * 100
        const isActive = hovered === n.slug
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
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(n.slug)}
            onBlur={() => setHovered(null)}
            onClick={() => navigate(`/categoria/${n.slug}`)}
            aria-label={`${n.name}: ${n.count ?? 0} skills`}
          >
            <motion.span
              className="relative grid h-11 w-11 place-items-center rounded-full border-2 bg-ink-deep sm:h-14 sm:w-14"
              style={{ borderColor: n.color, boxShadow: isActive ? `0 0 0 6px ${n.color}33, 0 0 30px ${n.color}` : `0 6px 20px -6px ${n.color}88` }}
              animate={{ scale: isActive ? 1.18 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CategoryIcon slug={n.slug} color={n.color} size={20} />
              {n.count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 font-display text-[10px] font-bold text-ink-deep">
                  {n.count}
                </span>
              )}
            </motion.span>
            <motion.span
              className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-dusk/95 px-2.5 py-1 text-xs font-semibold sm:block ${labelBelow ? "top-full mt-2" : "bottom-full mb-2"}`}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : labelBelow ? -4 : 4 }}
            >
              {n.name}
            </motion.span>
          </motion.button>
        )
      })}
    </div>
  )
}
