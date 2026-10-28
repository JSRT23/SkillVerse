import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useLocation } from "react-router"
import Nodo from "./Nodo"
import { useTaxonomyWithCounts } from "../hooks/useCatalog"
import { useNodo } from "../nodoContext"

/**
 * Nodo suelto por el sitio. Cuando no estás trabajando hace travesuras: baja colgado de un hilo,
 * cruza la pantalla, se asoma por un borde o se echa a dormir en una esquina. Cuando entras a una
 * categoría, subcategoría o skill, se viste para esa tarea y se queda abajo a la izquierda como ayudante.
 */

const NAV = 68
const rand = (a, b) => a + Math.random() * (b - a)
const pick = (list) => list[Math.floor(Math.random() * list.length)]

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return vp
}

// Cada paso: destino (x, y), segundos de viaje, milisegundos de espera al llegar y el ánimo.
const S = (x, y, opts = {}) => ({ x, y, move: 0, hold: 0, mood: "idle", ...opts })

function buildScene(name, { w, h, size, height, from }) {
  const ground = h - height - 12
  const offLeft = -size - 16
  const offRight = w + 16

  switch (name) {
    case "drop": {
      const x = rand(0.12, 0.82) * (w - size)
      const y = rand(0.2, 0.42) * h
      const top = NAV - height - 8
      return [
        S(x, top, { thread: true }),
        S(x, y, { move: 1.9, mood: "idle", thread: true, ease: "easeOut" }),
        S(x, y, { hold: 3400, mood: pick(["happy", "love", "thinking"]), thread: true, swing: true }),
        S(x, y, { hold: 1100, mood: "surprised", thread: true }),
        S(x, top, { move: 1.5, mood: "walk", thread: true, ease: "easeIn" }),
      ]
    }
    case "walk": {
      const ltr = Math.random() < 0.5
      const start = ltr ? offLeft : offRight
      const end = ltr ? offRight : offLeft
      const mid = ltr ? rand(0.3, 0.6) * w : rand(0.4, 0.7) * w
      const speed = size * 1.5 // px por segundo
      return [
        S(start, ground, { flip: !ltr }),
        S(mid, ground, { move: Math.abs(mid - start) / speed, mood: "walk", flip: !ltr, ease: "linear" }),
        S(mid, ground, { hold: 2200, mood: pick(["thinking", "happy", "surprised"]), flip: !ltr }),
        S(end, ground, { move: Math.abs(end - mid) / speed, mood: "walk", flip: !ltr, ease: "linear" }),
      ]
    }
    case "sleep": {
      const x = w - size - 24
      return [
        S(offRight, ground, { flip: true }),
        S(x, ground, { move: 1.4, mood: "walk", flip: true, ease: "linear" }),
        S(x, ground, { hold: 1200, mood: "thinking" }),
        S(x, ground, { hold: 8000, mood: "sleep" }),
        S(x, ground, { hold: 1100, mood: "surprised" }),
        S(offRight, ground, { move: 1, mood: "walk", ease: "linear" }),
      ]
    }
    case "peek": {
      const right = Math.random() < 0.5
      const y = rand(0.3, 0.65) * h
      const hide = right ? offRight : offLeft
      const peek = right ? w - size * 0.62 : -size * 0.38
      return [
        S(hide, y, { flip: right }),
        S(peek, y, { move: 0.5, mood: "thinking", flip: right, ease: "easeOut" }),
        S(peek, y, { hold: 2600, mood: pick(["love", "happy", "surprised"]), flip: right }),
        S(hide, y, { move: 0.4, mood: "walk", flip: right, ease: "easeIn" }),
      ]
    }
    case "helper": {
      const x = 16
      const steps = []
      if (!from?.visible) steps.push(S(offLeft, ground))
      steps.push(S(x, ground, { move: from?.visible ? 0.9 : 1.1, mood: "walk", ease: "easeOut" }))
      steps.push(S(x, ground, { hold: 5200, mood: "happy" }))
      steps.push(S(x, ground, { hold: Infinity, mood: "idle" }))
      return steps
    }
    case "leave":
      return [S(offLeft, ground, { move: 1.1, mood: "walk", flip: true, ease: "linear" })]
    case "pop": {
      // asoma desde abajo para reaccionar a algo
      return [
        S(16, h + 8),
        S(16, ground, { move: 0.35, mood: "surprised", ease: "easeOut" }),
        S(16, ground, { hold: 2600 }),
        S(16, h + 8, { move: 0.35, ease: "easeIn" }),
      ]
    }
    default:
      return [S(offLeft, ground, { hold: rand(5000, 11000) })]
  }
}

export default function NodoRoamer() {
  const { work, reaction, hidden, react } = useNodo()
  const reduced = false // Nodo siempre se anima; quien no lo quiera puede esconderlo
  const location = useLocation()
  const { data: taxonomy = [] } = useTaxonomyWithCounts()
  const vp = useViewport()
  const small = vp.w < 640
  const size = small ? 54 : 74
  const height = (size * 42) / 44

  const [scene, setScene] = useState(() => ({ name: "rest", steps: buildScene("rest", { ...vp, size, height }), i: 0, n: 0 }))
  const [bubble, setBubble] = useState(false)
  const clicks = useRef(0)
  const step = scene.steps[Math.min(scene.i, scene.steps.length - 1)]

  const isVisible = (s) => s.x > -size * 0.8 && s.x < vp.w - size * 0.2 && s.y < vp.h - height * 0.3 && s.y > NAV - height * 0.4
  const ctx = useRef({})
  ctx.current = { vp, size, height, path: location.pathname, work, step }

  const start = (name, extra = {}) => {
    const { vp: v, size: sz, height: ht } = ctx.current
    setScene((s) => ({ name, steps: buildScene(name, { ...v, size: sz, height: ht, ...extra }), i: 0, n: s.n + 1 }))
  }

  // Reproduce la escena paso a paso; al terminar, descansa o elige otra travesura
  useEffect(() => {
    if (hidden || reduced) return
    const ms = step.move * 1000 + step.hold
    if (!Number.isFinite(ms)) return
    const t = setTimeout(() => {
      if (scene.i + 1 < scene.steps.length) {
        setScene((s) => ({ ...s, i: s.i + 1 }))
        return
      }
      if (ctx.current.work) return
      if (scene.name !== "rest") return start("rest")
      // en la portada, mientras se ve la telaraña, Nodo ya está en el centro
      const blocked = ctx.current.path === "/" && window.scrollY < 560
      start(blocked ? "rest" : pick(["drop", "walk", "peek", "drop", "walk", "sleep"]))
    }, Math.max(ms, 16))
    return () => clearTimeout(t)
  }, [scene, hidden, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  // Modo ayudante: entra a la esquina vestido para la tarea; al salir, se va caminando
  const workKey = work ? `${work.category}/${work.subcategory ?? ""}` : ""
  useEffect(() => {
    if (hidden || reduced) return
    if (workKey) {
      start("helper", { from: { visible: isVisible(ctx.current.step) } })
      setBubble(true)
      const t = setTimeout(() => setBubble(false), 4200)
      return () => clearTimeout(t)
    }
    if (scene.name === "helper") start("leave")
  }, [workKey, hidden, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  // Si algo lo hace reaccionar y no está a la vista, se asoma desde abajo
  useEffect(() => {
    if (!reaction || hidden || reduced || work) return
    if (!isVisible(ctx.current.step)) start("pop")
  }, [reaction?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const label = useMemo(() => {
    if (!work) return null
    const cat = taxonomy.find((c) => c.slug === work.category)
    const sub = cat?.subcategories?.find((s) => s.slug === work.subcategory)
    return [cat?.name, sub?.name].filter(Boolean).join(" › ")
  }, [work, taxonomy])

  if (hidden) return null
  if (reduced && !work) return null

  const ground = vp.h - height - 12
  const pos = reduced ? { x: 16, y: ground } : { x: step.x, y: step.y }
  const mood = reaction?.mood ?? (reduced ? "idle" : step.mood)
  const message = reaction?.message ?? (bubble ? (work ? `Modo ayudante: ${label || "listo"}` : "¡Hola! Soy Nodo") : null)

  const onPoke = () => {
    if (mood === "sleep") return react("angry", "¡Estaba durmiendo!", 1800)
    clicks.current += 1
    const n = clicks.current
    if (n % 5 === 0) return react("love", "Bueno… te perdono", 2200)
    if (n % 5 === 4) return react("angry", "¡Ya, me haces cosquillas!", 1800)
    react(pick(["celebrate", "happy", "surprised"]), pick(["¡Jiji!", "¡Hey!", "¡Atrápame!", "¿Buscamos una skill?"]), 1600)
  }

  return (
    <MotionConfig reducedMotion="never">
    <div className="pointer-events-none fixed left-0 top-0 z-[35]" aria-hidden>
      <motion.div
        className="absolute left-0 top-0"
        style={{ width: size }}
        initial={false}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ duration: reduced ? 0 : step.move, ease: step.ease ?? "easeInOut" }}
      >
        {step.thread && !reduced && (
          <span
            className="absolute left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#c6b6ff] to-[#c6b6ff]"
            style={{ bottom: "74%", height: "100vh" }}
          />
        )}

        <AnimatePresence>
          {message && (
            <motion.span
              key={message}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={`shell absolute bottom-full mb-1 whitespace-nowrap rounded-2xl border border-line bg-elev px-3 py-1.5 text-xs font-semibold text-fg shadow-[0_14px_34px_-14px_rgb(4_3_18/0.9)] ${pos.x > vp.w / 2 ? "right-0" : "left-0"}`}
            >
              {message}
            </motion.span>
          )}
        </AnimatePresence>

        <button
          type="button"
          tabIndex={-1}
          onClick={onPoke}
          onMouseEnter={() => setBubble(true)}
          onMouseLeave={() => setBubble(false)}
          className="nodo-keep pointer-events-auto block w-full cursor-pointer"
          style={{
            transform: step.flip ? "scaleX(-1)" : undefined,
            transformOrigin: "50% 0",
            animation: step.swing && !reduced ? "nodo-swing 2.2s ease-in-out infinite" : undefined,
          }}
        >
          <Nodo
            size="100%"
            mood={mood}
            category={work?.category}
            subcategory={work?.subcategory}
            title=""
            className="drop-shadow-[0_6px_10px_rgb(4_3_18/0.45)]"
          />
        </button>
      </motion.div>
    </div>
    </MotionConfig>
  )
}
