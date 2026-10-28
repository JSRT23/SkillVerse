import { useEffect, useId, useRef } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"

/**
 * Ocho — mascota original de SkillVerse: un pulpo con un tentáculo para cada categoría.
 * Props: size, outfit, accent, mood (idle | happy | curious | sleep), track (los ojos siguen el cursor),
 * tentacles (false para dibujar solo la cabeza), lookAt ({x,y} en -1..1 para dirigir la mirada).
 */

const INK = "#1A1438"

// Tentáculos del lado izquierdo (el derecho es espejo): inicio, controles, fin y rizo de la punta
const ARMS = [
  { s: [72, 138], c1: [44, 150], c2: [22, 168], e: [26, 194], k1: [28, 210], k2: [46, 210], k: [44, 198] },
  { s: [86, 144], c1: [72, 168], c2: [52, 184], e: [58, 208], k1: [62, 222], k2: [78, 220], k: [76, 208] },
  { s: [100, 148], c1: [98, 172], c2: [86, 192], e: [92, 214], k1: [96, 228], k2: [112, 226], k: [110, 214] },
  { s: [113, 150], c1: [116, 176], c2: [108, 198], e: [114, 220], k1: [116, 232], k2: [130, 230], k: [127, 218] },
]
const mirror = ([x, y]) => [240 - x, y]
const ALL_ARMS = [
  ...ARMS.map((a) => ({ ...a, side: -1 })),
  ...ARMS.map((a) => ({ s: mirror(a.s), c1: mirror(a.c1), c2: mirror(a.c2), e: mirror(a.e), k1: mirror(a.k1), k2: mirror(a.k2), k: mirror(a.k), side: 1 })),
]

const shift = ([x, y], dx, dy = 0) => [x + dx, y + dy]
const armPath = (a, w) => {
  const c1 = shift(a.c1, w * 0.4)
  const c2 = shift(a.c2, w)
  const e = shift(a.e, w * 1.2, Math.abs(w) * 0.2)
  const k1 = shift(a.k1, w * 1.3)
  const k2 = shift(a.k2, w * 1.3)
  const k = shift(a.k, w * 1.25)
  const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
  return `M${f(a.s)} C${f(c1)} ${f(c2)} ${f(e)} C${f(k1)} ${f(k2)} ${f(k)}`
}

function Arm({ arm, index, animate, uid }) {
  const amp = 6 + (index % 3) * 2
  const frames = [armPath(arm, -amp * arm.side), armPath(arm, amp * arm.side), armPath(arm, -amp * arm.side)]
  const transition = { duration: 3.2 + (index % 4) * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }
  const outer = index % 4 < 2
  const anim = animate ? { d: frames } : undefined
  return (
    <g>
      <motion.path d={frames[0]} animate={anim} transition={transition}
        fill="none" stroke="#3A22A8" strokeOpacity="0.45" strokeWidth="17" strokeLinecap="round" />
      <motion.path d={frames[0]} animate={anim} transition={transition}
        fill="none" stroke={`url(#arm-${uid})`} strokeWidth="13" strokeLinecap="round" />
      {outer && (
        <motion.path d={frames[0]} animate={anim} transition={transition}
          fill="none" stroke="#F7D0F2" strokeOpacity="0.6" strokeWidth="3.6" strokeLinecap="round" strokeDasharray="0 10" />
      )}
    </g>
  )
}

function Mouth({ mood }) {
  if (mood === "happy")
    return (
      <g>
        <path d="M107 121 Q120 140 133 121 Z" fill={INK} />
        <path d="M113 129 Q120 136 127 129 Q120 126 113 129 Z" fill="#FF7AB6" />
      </g>
    )
  if (mood === "curious") return <ellipse cx="120" cy="126" rx="5" ry="6" fill={INK} />
  if (mood === "sleep") return <path d="M112 125 Q120 128 128 125" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
  return <path d="M109 122 Q120 132 131 122" stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
}

function Eye({ cx, mood, px, py, animate }) {
  if (mood === "sleep") {
    return <path d={`M${cx - 13} 100 Q${cx} 108 ${cx + 13} 100`} stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
  }
  if (mood === "happy") {
    return <path d={`M${cx - 13} 102 Q${cx} 86 ${cx + 13} 102`} stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
  }
  return (
    <motion.g
      style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
      animate={animate ? { scaleY: [1, 1, 0.08, 1, 1] } : undefined}
      transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
    >
      <ellipse cx={cx} cy="98" rx="17" ry="19" fill="#fff" />
      <motion.g style={{ x: px, y: py }}>
        <circle cx={cx} cy="100" r="10" fill={INK} />
        <circle cx={cx - 3.5} cy="95.5" r="3.6" fill="#fff" />
        <circle cx={cx + 3.5} cy="104" r="1.6" fill="#fff" opacity="0.8" />
      </motion.g>
    </motion.g>
  )
}

function Outfit({ outfit, accent, animate }) {
  switch (outfit) {
    case "hardhat":
      return (
        <g>
          <path d="M66 58 Q68 16 120 14 Q172 16 174 58 Z" fill="#FFB224" />
          <path d="M120 14 L120 56" stroke="#F29A00" strokeWidth="6" />
          <rect x="56" y="52" width="128" height="11" rx="5.5" fill="#F29A00" />
        </g>
      )
    case "beret":
      return (
        <g>
          <g transform="rotate(-12 116 34)">
            <ellipse cx="114" cy="36" rx="46" ry="14" fill={accent} />
            <ellipse cx="114" cy="31" rx="38" ry="10" fill={accent} opacity="0.85" />
            <circle cx="110" cy="18" r="5.5" fill={accent} />
          </g>
          <path d="M190 196 L214 160" stroke="#C9A06A" strokeWidth="6" strokeLinecap="round" />
          <path d="M212 163 L222 146" stroke={accent} strokeWidth="9" strokeLinecap="round" />
        </g>
      )
    case "headphones":
      return (
        <g>
          <path d="M50 98 C48 14 192 14 190 98" stroke="#2B2363" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M50 98 C48 14 192 14 190 98" stroke={accent} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.9" />
          <rect x="36" y="82" width="20" height="34" rx="9" fill={accent} />
          <rect x="184" y="82" width="20" height="34" rx="9" fill={accent} />
        </g>
      )
    case "goggles":
      return (
        <g>
          <path d="M52 62 L188 62" stroke={accent} strokeWidth="8" strokeLinecap="round" />
          <g stroke="#2B2363" strokeWidth="3.5" fill="rgba(31,199,182,0.35)">
            <circle cx="100" cy="60" r="15" />
            <circle cx="140" cy="60" r="15" />
          </g>
          <path d="M196 150 h18 M200 150 v14 l-11 26 a5 5 0 0 0 5 6 h26 a5 5 0 0 0 5 -6 l-11 -26 v-14" fill="#F3F1FF" stroke="#2B2363" strokeWidth="3" strokeLinejoin="round" />
          <path d="M192 182 h30 l3 8 a4 4 0 0 1 -4 5 h-28 a4 4 0 0 1 -4 -5z" fill="#1FC7B6" />
        </g>
      )
    case "antenna":
      return (
        <g>
          <path d="M120 26 L120 2" stroke="#5B3FE6" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="-3" r="14" fill={accent} opacity="0.22" />
          <circle cx="120" cy="-3" r="8" fill={accent} />
          <g>
            {animate && <animateTransform attributeName="transform" type="rotate" from="0 120 -3" to="360 120 -3" dur="3s" repeatCount="indefinite" />}
            <circle cx="135" cy="-3" r="3.6" fill="#1FC7B6" />
          </g>
        </g>
      )
    case "magnifier":
      return (
        <g>
          <g stroke="#FFB224" strokeWidth="3" fill="none">
            <circle cx="96" cy="98" r="23" />
            <circle cx="144" cy="98" r="23" />
            <path d="M119 96 Q120 92 121 96" />
          </g>
          <path d="M188 196 L172 214" stroke="#C9A06A" strokeWidth="7" strokeLinecap="round" />
          <circle cx="200" cy="180" r="18" fill="rgba(31,199,182,0.2)" stroke="#F3F1FF" strokeWidth="5" />
          <path d="M192 187v-6M199 187v-12M206 187v-8" stroke={accent} strokeWidth="3.4" strokeLinecap="round" />
        </g>
      )
    case "paper":
      return (
        <g>
          <g stroke="#FFB224" strokeWidth="3" fill="rgba(255,255,255,0.12)">
            <path d="M76 104 h40 a20 12 0 0 1 -40 0z" />
            <path d="M124 104 h40 a20 12 0 0 1 -40 0z" />
          </g>
          <g transform="rotate(10 204 176)">
            <rect x="188" y="154" width="32" height="42" rx="4" fill="#F3F1FF" />
            <path d="M195 165h18M195 173h18M195 181h12" stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
          </g>
        </g>
      )
    case "clipboard":
      return (
        <g transform="rotate(8 204 176)">
          <rect x="186" y="150" width="36" height="46" rx="5" fill={accent} />
          <rect x="192" y="158" width="24" height="33" rx="2" fill="#F3F1FF" />
          <rect x="196" y="145" width="16" height="9" rx="3" fill="#2B2363" />
          <path d="M196 167l3 3 6-6M196 180l3 3 6-6" stroke="#1FC7B6" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "nightcap":
      return (
        <g>
          <path d="M70 46 Q98 0 162 8 Q186 12 196 40 Q170 26 150 36 Q118 26 70 46 Z" fill="#3B2F8F" />
          <path d="M66 50 Q120 24 172 44" stroke="#F3F1FF" strokeWidth="9" fill="none" strokeLinecap="round" />
          <circle cx="198" cy="44" r="9" fill="#F3F1FF" />
          <circle cx="118" cy="22" r="2.4" fill="#FFB224" />
          <circle cx="150" cy="18" r="2" fill="#FFB224" />
        </g>
      )
    case "party":
      return (
        <g>
          <path d="M98 34 L120 -18 L142 34 Z" fill={accent} />
          <path d="M106 16 L134 16 M112 2 L128 2" stroke="#FFB224" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="120" cy="-20" r="7" fill="#FFB224" />
        </g>
      )
    default:
      return null
  }
}

export default function Ocho({
  size = 180,
  outfit,
  accent = "#7C5CFF",
  mood = "idle",
  track = false,
  tentacles = true,
  bob = true,
  lookAt,
  className = "",
  title = "Ocho, la mascota de SkillVerse",
}) {
  const reduced = useReducedMotion()
  const animate = !reduced
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 220, damping: 20 })
  const py = useSpring(my, { stiffness: 220, damping: 20 })

  // Los ojos siguen el cursor (o un punto indicado)
  useEffect(() => {
    if (lookAt) { mx.set(lookAt.x * 6); my.set(lookAt.y * 6); return }
    if (!track || reduced) { mx.set(0); my.set(0); return }
    let frame = 0
    const onMove = (e) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height * 0.42)
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 300)
        mx.set((dx / d) * 6 * k)
        my.set((dy / d) * 6 * k)
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame) }
  }, [track, reduced, lookAt?.x, lookAt?.y, mx, my])

  const viewBox = tentacles ? "0 -34 240 274" : "14 -30 212 186"

  return (
    <motion.svg
      ref={ref}
      viewBox={viewBox}
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      animate={animate && bob ? { y: mood === "sleep" ? [0, 3, 0] : [0, -6, 0] } : undefined}
      transition={{ duration: mood === "sleep" ? 3.8 : 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={`head-${uid}`} x1="0.15" y1="0.05" x2="0.85" y2="1">
          <stop offset="0" stopColor="#A58CFF" />
          <stop offset="0.55" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#C34FD6" />
        </linearGradient>
        <linearGradient id={`arm-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#D357D6" />
        </linearGradient>
        <radialGradient id={`shine-${uid}`} cx="0.32" cy="0.25" r="0.55">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {tentacles && (
        <>
          <ellipse cx="120" cy="236" rx="78" ry="7" fill="#0C0A20" opacity="0.22" />
          {ALL_ARMS.map((a, i) => <Arm key={i} arm={a} index={i} animate={animate} uid={uid} />)}
        </>
      )}

      <g transform="translate(120 150) scale(1.12) translate(-120 -150)">
      {/* Cabeza */}
      <path d="M120 22 C170 22 194 60 192 100 C191 126 178 142 160 150 L80 150 C62 142 49 126 48 100 C46 60 70 22 120 22 Z" fill={`url(#head-${uid})`} />
      <path d="M120 22 C170 22 194 60 192 100 C191 126 178 142 160 150 L80 150 C62 142 49 126 48 100 C46 60 70 22 120 22 Z" fill={`url(#shine-${uid})`} />
      <circle cx="158" cy="52" r="6.5" fill="#C9B8FF" opacity="0.55" />
      <circle cx="170" cy="72" r="4" fill="#C9B8FF" opacity="0.5" />
      <circle cx="80" cy="50" r="4.5" fill="#C9B8FF" opacity="0.45" />

      {/* Cara */}
      <Eye cx={96} mood={mood} px={px} py={py} animate={animate} />
      <Eye cx={144} mood={mood} px={px} py={py} animate={animate} />
      <ellipse cx="72" cy="122" rx="10" ry="6" fill="#FF7AB6" opacity="0.55" />
      <ellipse cx="168" cy="122" rx="10" ry="6" fill="#FF7AB6" opacity="0.55" />
      <Mouth mood={mood} />

      {mood === "sleep" && animate && (
        <motion.text
          x="186" y="40" fill="#A7A2D0" fontSize="22" fontWeight="800" fontFamily="Bricolage Grotesque Variable, sans-serif"
          animate={{ opacity: [0, 1, 0], y: [0, -16, -28] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          z
        </motion.text>
      )}

      {outfit && <Outfit outfit={outfit} accent={accent} animate={animate} />}
      </g>
    </motion.svg>
  )
}
