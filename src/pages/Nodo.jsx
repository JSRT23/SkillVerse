import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link } from "react-router"
import Mascot from "../components/Mascot"
import { CategoryIcon } from "../components/ui"
import { useCategoriesWithCounts } from "../hooks/useCatalog"
import { categoryMeta } from "../lib/categories"

const MOODS = [
  { id: "idle", label: "Atento" },
  { id: "happy", label: "Contento" },
  { id: "search", label: "Buscando" },
  { id: "sleep", label: "Dormido" },
]

export default function Nodo() {
  const { data: categories = [] } = useCategoriesWithCounts()
  const [selected, setSelected] = useState(null)
  const [mood, setMood] = useState("happy")
  const current = categories.find((c) => c.slug === selected)

  return (
    <div className="container-page pt-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl">Conoce a Nodo</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-haze">
            Nodo es una araña-agente: teje la red que conecta todas las skills. Sus ocho patas articuladas le permiten trabajar en varias tareas a la vez, y su núcleo ámbar se enciende cuando encuentra lo que buscas.
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-haze">
            Para cada categoría usa un accesorio distinto. Pruébaselos.
          </p>

          <div className="mt-8">
            <p className="text-sm font-semibold text-haze">Estado de ánimo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  aria-pressed={mood === m.id}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold cursor-pointer ${mood === m.id ? "text-ink-deep" : "border border-line bg-dusk/60 text-haze hover:text-silk"}`}
                >
                  {mood === m.id && <motion.span layoutId="mood-pill" className="absolute inset-0 rounded-full bg-lagoon" />}
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-haze">Accesorio</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-pressed={!selected}
                className={`chip cursor-pointer px-3.5 py-2 text-sm ${!selected ? "border-amber bg-amber/15 text-amber" : "border-line bg-dusk/60 text-haze hover:text-silk"}`}
              >
                Sin accesorio
              </button>
              {categories.map((c) => (
                <motion.button
                  key={c.slug}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelected(c.slug)}
                  aria-pressed={selected === c.slug}
                  className="chip cursor-pointer px-3.5 py-2 text-sm transition-colors"
                  style={selected === c.slug ? { borderColor: c.color, background: `${c.color}26`, color: c.color } : { borderColor: "var(--color-line)", color: "var(--color-haze)" }}
                >
                  <CategoryIcon slug={c.slug} color={c.color} size={13} /> {c.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative grid place-items-center">
          <div className="absolute h-72 w-72 rounded-full blur-3xl transition-colors duration-700" style={{ background: `${current?.color ?? "#7B6CF6"}40` }} aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selected}-${mood}`}
              initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative"
            >
              <Mascot size={340} outfit={current ? categoryMeta(current.slug).outfit : undefined} accent={current?.color} mood={mood} />
            </motion.div>
          </AnimatePresence>
          {current && (
            <Link to={`/categoria/${current.slug}`} className="btn-ghost relative mt-2">
              Ver skills de {current.name}
            </Link>
          )}
        </div>
      </div>

      <section className="mt-20">
        <h2 className="section-title">El vestuario completo</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <motion.button
              key={c.slug}
              type="button"
              onClick={() => { setSelected(c.slug); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
              whileHover={{ y: -6 }}
              className="panel flex cursor-pointer flex-col items-center gap-2 p-4 text-center"
            >
              <Mascot size={110} outfit={categoryMeta(c.slug).outfit} accent={c.color} bob={false} title="" />
              <span className="text-sm font-semibold" style={{ color: c.color }}>{c.name}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}
