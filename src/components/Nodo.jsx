import { useEffect, useRef, useState } from "react"
import { LAYERS } from "./nodo/sprites"
import { outfitFor } from "../lib/nodo"

/**
 * Nodo — araña saltarina morada en pixel art, mascota original de SkillVerse.
 *
 * Props:
 *  - size: ancho en px o cualquier medida CSS ("100%")
 *  - mood: idle | happy | celebrate | angry | sad | surprised | thinking | sleep | walk | love
 *  - category / subcategory: slugs; ponen el gorro y el objeto que corresponden
 *  - hat / prop: fuerzan un gorro u objeto concreto (null para quitarlo)
 *  - track: los ojos siguen el cursor
 *  - stroll: al caminar, además se pasea de lado a lado
 *  - title: texto accesible ("" lo vuelve decorativo)
 */

const VIEW = "-2 -6 44 42"

function Layer({ name, className, style }) {
  const html = LAYERS[name]
  if (!html) return null
  return <g className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

const FACE = {
  idle: "neutral",
  walk: "neutral",
  happy: "happy",
  celebrate: "happy",
  love: "happy",
  angry: "angry",
  sad: "sad",
  surprised: "surprised",
  thinking: "thinking",
  sleep: "closed",
}

const BODY_ANIM = {
  idle: "nodo-breathe",
  walk: "nodo-trot",
  happy: "nodo-sway",
  celebrate: "nodo-hop",
  love: "nodo-sway",
  angry: "nodo-shake",
  sad: "nodo-droop",
  surprised: "nodo-pop",
  thinking: "nodo-breathe",
  sleep: "nodo-snore",
}

/** Desplaza la mirada un píxel hacia el cursor. */
function useLook(ref, enabled) {
  const [look, setLook] = useState([0, 0])
  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const onMove = (e) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height * 0.55)
        const step = (v, dead) => (Math.abs(v) < dead ? 0 : Math.sign(v))
        const next = [step(dx, r.width * 0.35), step(dy, r.height * 0.4)]
        setLook((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
    }
  }, [enabled, ref])
  return enabled ? look : [0, 0]
}

export default function Nodo({
  size = 160,
  mood = "idle",
  category,
  subcategory,
  hat,
  prop,
  track = false,
  stroll = false,
  title = "Nodo",
  className = "",
  style,
}) {
  const ref = useRef(null)
  const [delay] = useState(() => `${-(Math.random() * 3.4).toFixed(2)}s`)
  const look = useLook(ref, track && mood !== "sleep")

  const outfit = outfitFor(category, subcategory)
  const hatName = hat === undefined ? outfit.hat : hat
  const propName = prop === undefined ? outfit.prop : prop
  const face = FACE[mood] ?? "neutral"
  const walking = mood === "walk"
  const blinks = face === "neutral" || face === "thinking"
  const width = typeof size === "number" ? `${size}px` : size

  return (
    <svg
      ref={ref}
      viewBox={VIEW}
      className={`nodo block overflow-visible ${className}`}
      style={{ width, height: "auto", aspectRatio: "44 / 42", shapeRendering: "crispEdges", ...style }}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      {/* efectos detrás o encima del cuerpo */}
      {mood === "celebrate" && <Layer name="fx_confetti" className="nodo-confetti" />}
      {mood === "angry" && <Layer name="fx_steam" className="nodo-steam" />}
      {mood === "surprised" && <Layer name="fx_excl" className="nodo-excl" />}
      {mood === "thinking" && (
        <>
          <Layer name="fx_dot0" className="nodo-dot" />
          <Layer name="fx_dot1" className="nodo-dot nodo-d1" />
          <Layer name="fx_dot2" className="nodo-dot nodo-d2" />
        </>
      )}
      {mood === "sleep" && (
        <>
          <Layer name="fx_z1" className="nodo-zA" />
          <Layer name="fx_z2" className="nodo-zB" />
        </>
      )}
      {mood === "love" && <Layer name="fx_heart" className="nodo-heart" />}

      <g className={stroll && mood === "walk" ? "nodo-stroll" : undefined}>
      <g className={BODY_ANIM[mood] ?? "nodo-breathe"}>
        {walking ? (
          <>
            <Layer name="legsA" className="nodo-legA" />
            <Layer name="legsB" className="nodo-legB" />
          </>
        ) : (
          <Layer name={mood === "celebrate" || mood === "surprised" ? "legsB" : "legsA"} />
        )}
        <Layer name="body" />
        <g style={{ transform: `translate(${look[0]}px, ${look[1]}px)`, transition: "transform 120ms steps(1)" }}>
          {blinks ? (
            <>
              <Layer name={`face_${face}`} className="nodo-eyeOpen" style={{ animationDelay: delay }} />
              <Layer name="face_closed" className="nodo-eyeShut" style={{ animationDelay: delay }} />
            </>
          ) : (
            <Layer name={`face_${face}`} />
          )}
        </g>
        {mood === "sad" && <Layer name="fx_tear" className="nodo-tear" />}
        {hatName && <Layer name={`hat_${hatName}`} className="nodo-wear" key={`h-${hatName}`} />}
        {propName && <Layer name={`prop_${propName}`} className="nodo-wear" key={`p-${propName}`} />}
      </g>
      </g>
    </svg>
  )
}

/** Solo el objeto de una subcategoría, como icono pixelado. */
export function NodoProp({ name, size = 28, className = "" }) {
  if (!name) return null
  return (
    <svg viewBox="30 26 10 9" className={className} style={{ width: size, height: (size * 9) / 10, shapeRendering: "crispEdges" }} aria-hidden>
      <Layer name={`prop_${name}`} />
    </svg>
  )
}
