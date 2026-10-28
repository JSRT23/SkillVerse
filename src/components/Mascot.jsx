import { motion, useReducedMotion } from "motion/react"
import { useId } from "react"

/**
 * Nodo — mascota original de SkillVerse: una araña-agente que teje la red de skills.
 * outfit: accesorio por categoría · mood: idle | happy | search | sleep
 */

// Patas del lado izquierdo: cadera → rodilla → pie. El lado derecho es espejo.
const LEGS = [
  { hip: [64, 96], knee: [38, 60], foot: [18, 102] },
  { hip: [60, 106], knee: [24, 84], foot: [8, 140] },
  { hip: [62, 116], knee: [28, 120], foot: [22, 170] },
  { hip: [68, 126], knee: [46, 148], foot: [52, 184] },
]
const mirror = ([x, y]) => [200 - x, y]

function Leg({ leg, side, index, animate }) {
  const pts = side === "left" ? leg : { hip: mirror(leg.hip), knee: mirror(leg.knee), foot: mirror(leg.foot) }
  const d = `M${pts.hip[0]},${pts.hip[1]} L${pts.knee[0]},${pts.knee[1]} L${pts.foot[0]},${pts.foot[1]}`
  const swing = (index % 2 === 0 ? 1 : -1) * (side === "left" ? 1 : -1) * 5
  return (
    <motion.g
      style={{ transformOrigin: `${pts.hip[0]}px ${pts.hip[1]}px`, transformBox: "view-box" }}
      animate={animate ? { rotate: [0, swing, 0] } : undefined}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 + (side === "right" ? 0.3 : 0) }}
    >
      <path d={d} fill="none" stroke="#2A2370" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#6A5BEA" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.knee[0]} cy={pts.knee[1]} r="3.6" fill="#FFC447" />
      <circle cx={pts.foot[0]} cy={pts.foot[1]} r="3" fill="#A99EFF" />
    </motion.g>
  )
}

function Eyes({ mood, animate, eyeColor }) {
  if (mood === "happy") {
    return (
      <g stroke={eyeColor} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M83,103 Q88.5,94 94,103" />
        <path d="M106,103 Q111.5,94 117,103" />
      </g>
    )
  }
  if (mood === "sleep") {
    return (
      <g stroke={eyeColor} strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M83,101 Q88.5,105 94,101" fill="none" />
        <path d="M106,101 Q111.5,105 117,101" fill="none" />
      </g>
    )
  }
  return (
    <motion.g
      animate={animate && mood === "search" ? { x: [-3, 3, -3] } : undefined}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {[84, 107].map((x) => (
        <motion.rect
          key={x}
          x={x} y="93" width="9" height="14" rx="4.5"
          fill={eyeColor}
          style={{ transformOrigin: `${x + 4.5}px 100px`, transformBox: "view-box" }}
          animate={animate ? { scaleY: [1, 1, 0.12, 1, 1] } : undefined}
          transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1], delay: x === 84 ? 0 : 0.02 }}
        />
      ))}
      <rect x="86" y="95" width="3" height="4" rx="1.5" fill="#fff" opacity="0.7" />
      <rect x="109" y="95" width="3" height="4" rx="1.5" fill="#fff" opacity="0.7" />
    </motion.g>
  )
}

function Outfit({ outfit, accent, animate }) {
  switch (outfit) {
    case "glasses":
      return (
        <g>
          <g stroke="#FFC447" strokeWidth="2.6" fill="rgba(255,255,255,0.08)">
            <circle cx="88.5" cy="100" r="11" />
            <circle cx="111.5" cy="100" r="11" />
          </g>
          <path d="M99.5,99 Q100,96 100.5,99" stroke="#FFC447" strokeWidth="2.6" fill="none" />
          <g transform="rotate(12 158 140)">
            <rect x="146" y="124" width="24" height="31" rx="3" fill="#F3F0FF" />
            <path d="M151,132h14M151,138h14M151,144h9" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
      )
    case "beret":
      return (
        <g>
          <g transform="rotate(-10 100 66)">
            <ellipse cx="98" cy="68" rx="36" ry="12" fill={accent} />
            <ellipse cx="98" cy="64" rx="30" ry="9" fill={accent} opacity="0.85" />
            <circle cx="96" cy="53" r="4.5" fill={accent} />
          </g>
          <path d="M146,156 L168,120" stroke="#C9A06A" strokeWidth="5" strokeLinecap="round" />
          <path d="M166,123 L174,108" stroke={accent} strokeWidth="7" strokeLinecap="round" />
        </g>
      )
    case "headphones":
      return (
        <g>
          <path d="M57,100 C57,46 143,46 143,100" stroke="#2A2370" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M57,100 C57,46 143,46 143,100" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
          <rect x="47" y="88" width="15" height="26" rx="7" fill={accent} />
          <rect x="138" y="88" width="15" height="26" rx="7" fill={accent} />
        </g>
      )
    case "goggles":
      return (
        <g>
          <path d="M56,98 L144,98" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          <g stroke="#2A2370" strokeWidth="3" fill="rgba(56,214,196,0.28)">
            <circle cx="88.5" cy="100" r="12" />
            <circle cx="111.5" cy="100" r="12" />
          </g>
          <path d="M152,118 h14 M155,118 v12 l-9,22 a4,4 0 0 0 4,5 h22 a4,4 0 0 0 4,-5 l-9,-22 v-12" fill="#F3F0FF" stroke="#2A2370" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M150,146 h24 l3,7 a3,3 0 0 1 -3,4 h-24 a3,3 0 0 1 -3,-4z" fill="#38D6C4" />
        </g>
      )
    case "antenna":
      return (
        <g>
          <path d="M100,66 L100,38" stroke="#6A5BEA" strokeWidth="5" strokeLinecap="round" />
          <circle cx="100" cy="33" r="8" fill={accent} />
          <circle cx="100" cy="33" r="13" fill={accent} opacity="0.25" />
          <motion.g
            style={{ transformOrigin: "100px 33px", transformBox: "view-box" }}
            animate={animate ? { rotate: 360 } : undefined}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="120" cy="33" r="3.5" fill="#38D6C4" />
          </motion.g>
        </g>
      )
    case "magnifier":
      return (
        <g>
          <path d="M146,146 L132,162" stroke="#C9A06A" strokeWidth="6" strokeLinecap="round" />
          <circle cx="158" cy="132" r="15" fill="rgba(56,214,196,0.18)" stroke="#F3F0FF" strokeWidth="4" />
          <path d="M151,138v-5M157,138v-10M163,138v-7" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case "clipboard":
      return (
        <g transform="rotate(8 158 140)">
          <rect x="144" y="120" width="28" height="36" rx="4" fill={accent} />
          <rect x="149" y="126" width="18" height="26" rx="2" fill="#F3F0FF" />
          <rect x="152" y="116" width="12" height="7" rx="2" fill="#2A2370" />
          <path d="M152,133l2.5,2.5 4.5,-5M152,143l2.5,2.5 4.5,-5" stroke="#38D6C4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "headset":
      return (
        <g>
          <path d="M59,98 C59,50 141,50 141,98" stroke="#2A2370" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="49" y="88" width="14" height="22" rx="6" fill={accent} />
          <path d="M56,110 Q60,126 80,124" stroke="#2A2370" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="82" cy="124" r="4" fill={accent} />
          <motion.g
            animate={animate ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M138,30 h34 a8,8 0 0 1 8,8 v12 a8,8 0 0 1 -8,8 h-22 l-8,7 v-7 h-4 a8,8 0 0 1 -8,-8 v-12 a8,8 0 0 1 8,-8z" fill="#F3F0FF" />
            <circle cx="146" cy="44" r="2.6" fill={accent} />
            <circle cx="155" cy="44" r="2.6" fill={accent} />
            <circle cx="164" cy="44" r="2.6" fill={accent} />
          </motion.g>
        </g>
      )
    case "hardhat":
      return (
        <g>
          <path d="M60,80 Q60,44 100,42 Q140,44 140,80 Z" fill="#FFC447" />
          <path d="M100,42 L100,78" stroke="#F2A516" strokeWidth="5" />
          <rect x="52" y="76" width="96" height="9" rx="4.5" fill="#F2A516" />
        </g>
      )
    case "shield":
      return (
        <g>
          <path d="M160,116 L178,123 V137 C178,149 170,157 160,161 C150,157 142,149 142,137 V123 Z" fill={accent} stroke="#2A2370" strokeWidth="2.5" />
          <path d="M152,138 l6,6 10,-12" stroke="#F3F0FF" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "party":
      return (
        <g>
          <path d="M82,70 L100,26 L118,70 Z" fill={accent} />
          <path d="M88,56 L112,56 M93,44 L107,44" stroke="#FFC447" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="100" cy="25" r="5.5" fill="#FFC447" />
        </g>
      )
    default:
      return null
  }
}

export default function Mascot({
  size = 160,
  outfit,
  accent = "#7B6CF6",
  mood = "idle",
  hanging = false,
  bob = true,
  className = "",
  title = "Nodo, la mascota de SkillVerse",
}) {
  const reduced = useReducedMotion()
  const animate = !reduced
  const uid = useId().replace(/:/g, "")
  const eyeColor = mood === "happy" ? "#FFC447" : "#38D6C4"

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      role="img"
      aria-label={title}
      animate={animate && bob ? { y: mood === "sleep" ? [0, 2, 0] : [0, -5, 0] } : undefined}
      transition={{ duration: mood === "sleep" ? 3.6 : 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9488FF" />
          <stop offset="1" stopColor="#4A3DC2" />
        </linearGradient>
        <radialGradient id={`core-${uid}`}>
          <stop offset="0" stopColor="#FFE7A3" />
          <stop offset="0.6" stopColor="#FFC447" />
          <stop offset="1" stopColor="#FFC447" stopOpacity="0" />
        </radialGradient>
      </defs>

      {hanging && <line x1="100" y1="-400" x2="100" y2="68" stroke="#F3F0FF" strokeOpacity="0.55" strokeWidth="1.5" />}

      {/* sombra en el suelo */}
      <ellipse cx="100" cy="190" rx={hanging ? 0 : 52} ry="6" fill="#0F0D2B" opacity="0.55" />

      {LEGS.map((leg, i) => <Leg key={`l${i}`} leg={leg} side="left" index={i} animate={animate} />)}
      {LEGS.map((leg, i) => <Leg key={`r${i}`} leg={leg} side="right" index={i} animate={animate} />)}

      {/* cuerpo */}
      <ellipse cx="100" cy="106" rx="45" ry="40" fill="#2A2370" />
      <ellipse cx="100" cy="104" rx="43" ry="38" fill={`url(#body-${uid})`} />
      <ellipse cx="88" cy="80" rx="18" ry="7" fill="#fff" opacity="0.16" transform="rotate(-14 88 80)" />

      {/* núcleo ámbar */}
      <motion.circle
        cx="100" cy="128" r="11"
        fill={`url(#core-${uid})`}
        animate={animate ? { opacity: [0.65, 1, 0.65], scale: [0.95, 1.08, 0.95] } : undefined}
        style={{ transformOrigin: "100px 128px", transformBox: "view-box" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="100" cy="128" r="4.5" fill="#FFE7A3" />

      {/* visor */}
      <rect x="69" y="85" width="62" height="30" rx="15" fill="#15123A" stroke="#2A2370" strokeWidth="2" />
      <Eyes mood={mood} animate={animate} eyeColor={eyeColor} />

      {mood === "sleep" && animate && (
        <motion.text
          x="138" y="62" fill="#A9A3D9" fontSize="18" fontFamily="Unbounded Variable, sans-serif" fontWeight="700"
          animate={{ opacity: [0, 1, 0], y: [0, -14, -24] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        >
          z
        </motion.text>
      )}

      {outfit && <Outfit outfit={outfit} accent={accent} animate={animate} />}
    </motion.svg>
  )
}
