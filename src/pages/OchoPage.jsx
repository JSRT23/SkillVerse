import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link } from "react-router"
import { ArrowUpRight, Moon } from "lucide-react"
import Ocho from "../components/Ocho"
import { CategoryIcon } from "../components/ui"
import { useTaxonomyWithCounts } from "../hooks/useCatalog"
import { categoryMeta, MAIN_CATEGORIES } from "../lib/categories"

const MOODS = [
  { id: "idle", label: "Atento" },
  { id: "happy", label: "Contento" },
  { id: "curious", label: "Curioso" },
  { id: "sleep", label: "Dormido" },
]

export default function OchoPage() {
  const { data: categories = [] } = useTaxonomyWithCounts()
  const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
  const [selected, setSelected] = useState(null)
  const [mood, setMood] = useState("happy")
  const current = main.find((c) => c.slug === selected)
  const outfit = selected === "nightcap" ? "nightcap" : current ? categoryMeta(current.slug).outfit : undefined

  return (
    <div className="container-page pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold sm:text-[3.4rem]" style={{ letterSpacing: "-0.045em" }}>Conoce a Ocho</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Ocho es el pulpo de SkillVerse. Tiene un tentáculo para cada una de las ocho categorías y los usa todos a la vez, como un buen agente que maneja muchas skills. Mueve los ojos siguiendo tu cursor.
          </p>

          <div className="mt-9">
            <h2 className="text-sm font-semibold">Estado de ánimo</h2>
            <div className="mt-3 inline-flex rounded-full border border-line bg-elev p-1">
              {MOODS.map((m) => (
                <button key={m.id} type="button" onClick={() => setMood(m.id)} aria-pressed={mood === m.id}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium cursor-pointer ${mood === m.id ? "text-white" : "text-muted hover:text-fg"}`}>
                  {mood === m.id && <motion.span layoutId="mood-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-orchid" />}
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-semibold">Accesorio</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelected(null)} aria-pressed={!selected}
                className={`chip cursor-pointer px-3.5 py-2 text-sm ${!selected ? "border-brand bg-brand/12 text-brand" : "border-line bg-elev text-muted hover:text-fg"}`}>
                Sin accesorio
              </button>
              {main.map((c) => (
                <motion.button key={c.slug} type="button" whileTap={{ scale: 0.92 }} onClick={() => setSelected(c.slug)} aria-pressed={selected === c.slug}
                  className="chip cursor-pointer px-3.5 py-2 text-sm transition-colors"
                  style={selected === c.slug ? { borderColor: c.color, background: `${c.color}1f`, color: c.color } : { borderColor: "var(--line)", color: "var(--fg-muted)", background: "var(--bg-elev)" }}>
                  <CategoryIcon slug={c.slug} color={c.color} size={13} /> {c.name}
                </motion.button>
              ))}
              <button type="button" onClick={() => setSelected("nightcap")} aria-pressed={selected === "nightcap"}
                className={`chip cursor-pointer px-3.5 py-2 text-sm ${selected === "nightcap" ? "border-brand bg-brand/12 text-brand" : "border-line bg-elev text-muted hover:text-fg"}`}>
                <Moon size={13} aria-hidden /> Gorro de dormir
              </button>
            </div>
          </div>
        </div>

        <div className="relative grid min-h-[420px] place-items-center">
          <div className="absolute h-80 w-80 rounded-full blur-3xl transition-colors duration-700" style={{ background: `${current?.color ?? "#7C5CFF"}45` }} aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selected}-${mood}`}
              initial={{ scale: 0.86, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className="relative"
            >
              <div className="w-[min(380px,82vw)]"><Ocho size="100%" outfit={outfit} accent={current?.color} mood={mood} track /></div>
            </motion.div>
          </AnimatePresence>
          {current && (
            <Link to={`/categoria/${current.slug}`} className="btn-ghost relative -mt-4">
              Ver skills de {current.name} <ArrowUpRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <section className="mt-24">
        <h2 className="section-title">El vestuario completo</h2>
        <p className="mt-3 text-muted">Un accesorio por categoría. Toca uno para probárselo.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {main.map((c, i) => (
            <motion.button
              key={c.slug}
              type="button"
              onClick={() => { setSelected(c.slug); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="card group flex cursor-pointer flex-col items-center gap-2 p-5 text-center transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--c)]"
              style={{ "--c": c.color }}
            >
              <Ocho size={140} outfit={categoryMeta(c.slug).outfit} accent={c.color} bob={false} title="" />
              <span className="text-sm font-semibold" style={{ color: c.color }}>{c.name}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}
