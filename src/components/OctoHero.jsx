import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"
import Ocho from "./Ocho"
import { CategoryIcon } from "./ui"
import { categoryMeta, MAIN_CATEGORIES } from "../lib/categories"
import { formatNumber } from "../lib/format"

const SIZE = 600
const R = 236 // radio de las burbujas
const rad = (d) => (d * Math.PI) / 180

function tentacle(angle, wave) {
  const dx = Math.cos(angle), dy = Math.sin(angle)
  const px = -dy, py = dx
  const S = [dx * 64, dy * 50 + 22]
  const E = [dx * (R - 36), dy * (R - 36)]
  const L = Math.hypot(E[0] - S[0], E[1] - S[1])
  const c1 = [S[0] + dx * L * 0.33 + px * wave, S[1] + dy * L * 0.33 + py * wave]
  const c2 = [S[0] + dx * L * 0.68 - px * wave * 0.9, S[1] + dy * L * 0.68 - py * wave * 0.9]
  const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
  return `M${f(S)} C${f(c1)} ${f(c2)} ${f(E)}`
}

export default function OctoHero({ categories = [] }) {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)

  const nodes = useMemo(() => {
    const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
    return main.map((c, i) => {
      const angle = rad(-157.5 + i * 45)
      return { ...c, angle, x: Math.cos(angle) * R, y: Math.sin(angle) * R }
    })
  }, [categories])

  const active = nodes.find((n) => n.slug === hovered)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[600px] select-none">
      <div className="absolute inset-[16%] rounded-full bg-brand/25 blur-3xl" aria-hidden />
      <div className="absolute inset-[30%] rounded-full bg-orchid/20 blur-3xl" aria-hidden />

      <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="hero-arm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#D357D6" />
          </linearGradient>
        </defs>
        {/* órbitas */}
        <circle r={R} fill="none" stroke="var(--line)" strokeDasharray="2 8" />
        <circle r={R * 0.62} fill="none" stroke="var(--line)" strokeOpacity="0.6" strokeDasharray="2 10" />

        {nodes.map((n, i) => {
          const w = 18 * (i % 2 ? 1 : -1)
          const frames = [tentacle(n.angle, w), tentacle(n.angle, -w), tentacle(n.angle, w)]
          const isActive = hovered === n.slug
          const dim = hovered && !isActive
          const anim = reduced ? {} : { d: frames }
          const wave = { duration: 4 + (i % 3) * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
          return (
            <motion.g key={n.slug} animate={{ opacity: dim ? 0.35 : 1 }} transition={{ duration: 0.3 }}>
              <motion.path
                d={frames[0]} animate={{ ...anim, pathLength: 1 }} initial={reduced ? false : { pathLength: 0 }}
                transition={{ d: wave, pathLength: { duration: 0.9, delay: 0.2 + i * 0.08, ease: "easeOut" } }}
                fill="none" stroke="#3A22A8" strokeOpacity="0.5" strokeWidth={isActive ? 22 : 19} strokeLinecap="round"
              />
              <motion.path
                d={frames[0]} animate={{ ...anim, pathLength: 1 }} initial={reduced ? false : { pathLength: 0 }}
                transition={{ d: wave, pathLength: { duration: 0.9, delay: 0.2 + i * 0.08, ease: "easeOut" } }}
                fill="none" stroke={isActive ? n.color : "url(#hero-arm)"} strokeWidth={isActive ? 16 : 14} strokeLinecap="round"
                style={isActive ? { filter: `drop-shadow(0 0 10px ${n.color})` } : undefined}
              />
              <motion.path
                d={frames[0]} animate={{ ...anim, pathLength: 1 }} initial={reduced ? false : { pathLength: 0 }}
                transition={{ d: wave, pathLength: { duration: 0.9, delay: 0.2 + i * 0.08, ease: "easeOut" } }}
                fill="none" stroke="#F7D0F2" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 12"
              />
            </motion.g>
          )
        })}
      </svg>

      {/* Ocho */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[40%] -translate-x-1/2 -translate-y-[46%]"
        initial={reduced ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
      >
        <Ocho
          size="100%"
          tentacles={false}
          track={!active}
          lookAt={active ? { x: Math.cos(active.angle), y: Math.sin(active.angle) } : undefined}
          outfit={active ? categoryMeta(active.slug).outfit : undefined}
          accent={active?.color}
          mood={active ? "happy" : "idle"}
          title="Ocho conecta las ocho categorías"
        />
      </motion.div>

      {/* Burbujas de categoría */}
      {nodes.map((n, i) => {
        const isActive = hovered === n.slug
        const below = n.y > 0
        return (
          <motion.button
            key={n.slug}
            type="button"
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${50 + (n.x / SIZE) * 100}%`, top: `${50 + (n.y / SIZE) * 100}%` }}
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.9 + i * 0.07 }}
            onMouseEnter={() => setHovered(n.slug)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(n.slug)}
            onBlur={() => setHovered(null)}
            onClick={() => navigate(`/categoria/${n.slug}`)}
            aria-label={`${n.name}: ${n.count ?? 0} skills`}
          >
            <motion.span
              className="relative grid h-12 w-12 place-items-center rounded-2xl border bg-elev sm:h-[60px] sm:w-[60px] sm:rounded-[20px]"
              style={{
                borderColor: isActive ? n.color : `${n.color}66`,
                boxShadow: isActive ? `0 0 0 6px ${n.color}2e, 0 14px 40px -8px ${n.color}` : `0 10px 30px -14px ${n.color}`,
              }}
              animate={{ scale: isActive ? 1.15 : 1, rotate: isActive ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              <CategoryIcon slug={n.slug} color={n.color} size={22} />
              {n.count > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-amber px-1.5 py-0.5 font-display text-[10px] font-bold leading-none text-night shadow">
                  {formatNumber(n.count)}
                </span>
              )}
            </motion.span>
            <motion.span
              className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-elev px-3 py-1 text-xs font-semibold text-fg shadow-lg sm:block ${below ? "top-full mt-3" : "bottom-full mb-5"}`}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : below ? -4 : 4 }}
            >
              {n.name}
            </motion.span>
          </motion.button>
        )
      })}
    </div>
  )
}
