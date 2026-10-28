import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link } from "react-router"
import { ArrowUpRight, Eye, EyeOff } from "lucide-react"
import Nodo, { NodoProp } from "../components/Nodo"
import { CategoryIcon } from "../components/ui"
import { useTaxonomyWithCounts } from "../hooks/useCatalog"
import { MAIN_CATEGORIES } from "../lib/categories"
import { CATEGORY_HAT, HAT_LABEL, MOODS, SUBCATEGORY_PROP } from "../lib/nodo"
import { useNodo } from "../nodoContext"

const TRICKS = [
  { mood: "walk", title: "Baja de la telaraña", text: "Se descuelga de un hilo por debajo del menú, se balancea un rato y vuelve a subir." },
  { mood: "happy", title: "Cruza la pantalla", text: "Camina por el borde de abajo, se detiene a mirar y sigue su camino." },
  { mood: "thinking", title: "Se asoma", text: "Saca medio cuerpo por un costado para ver qué estás buscando." },
  { mood: "sleep", title: "Se echa una siesta", text: "Se acomoda en una esquina y ronca. Si lo tocas, se despierta enojado." },
  { mood: "celebrate", title: "Celebra contigo", text: "Salta con confeti cuando copias un comando de instalación." },
  { mood: "sad", title: "Se pone triste", text: "Llora un poquito si tu búsqueda no encuentra nada." },
]

export default function NodoPage() {
  const { data: categories = [] } = useTaxonomyWithCounts()
  const { hidden, setHidden } = useNodo()
  const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
  const [cat, setCat] = useState(null)
  const [sub, setSub] = useState(null)
  const [mood, setMood] = useState("happy")
  const current = main.find((c) => c.slug === cat)

  const tryOn = (category, subcategory = null) => {
    setCat(category)
    setSub(subcategory)
    setMood("celebrate")
    setTimeout(() => setMood("happy"), 1400)
  }

  return (
    <div className="container-page pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold sm:text-[3.4rem]" style={{ letterSpacing: "-0.045em" }}>Conoce a Nodo</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Nodo es la araña saltarina de SkillVerse. Teje la red que une las categorías, hace travesuras por todo el sitio y,
            cuando te pones a trabajar, se viste de ayudante: el gorro dice la categoría y el objeto en su pata, la subcategoría.
          </p>

          <div className="mt-9">
            <h2 className="text-sm font-semibold">Estado de ánimo</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button key={m.id} type="button" onClick={() => setMood(m.id)} aria-pressed={mood === m.id} title={m.hint}
                  className={`relative rounded-full border px-3.5 py-2 text-sm font-medium cursor-pointer transition-colors ${mood === m.id ? "border-transparent text-white" : "border-line bg-elev text-muted hover:text-fg"}`}>
                  {mood === m.id && <motion.span layoutId="mood-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-orchid" />}
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-semibold">Categoría (gorro)</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setCat(null); setSub(null) }} aria-pressed={!cat}
                className={`chip cursor-pointer px-3.5 py-2 text-sm ${!cat ? "border-brand bg-brand/12 text-brand" : "border-line bg-elev text-muted hover:text-fg"}`}>
                Sin gorro
              </button>
              {main.map((c) => (
                <motion.button key={c.slug} type="button" whileTap={{ scale: 0.92 }} onClick={() => tryOn(c.slug)} aria-pressed={cat === c.slug}
                  className="chip cursor-pointer px-3.5 py-2 text-sm transition-colors"
                  style={cat === c.slug ? { borderColor: c.color, background: `${c.color}1f`, color: c.color } : { borderColor: "var(--line)", color: "var(--fg-muted)", background: "var(--bg-elev)" }}>
                  <CategoryIcon slug={c.slug} color={c.color} size={13} /> {c.name}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {current && (
              <motion.div key={current.slug} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <h2 className="mt-7 text-sm font-semibold">Subcategoría (objeto)</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.subcategories.map((s) => (
                    <button key={s.slug} type="button" onClick={() => tryOn(current.slug, s.slug)} aria-pressed={sub === s.slug}
                      className={`chip cursor-pointer py-1.5 pl-1.5 pr-3 text-sm transition-colors ${sub === s.slug ? "text-fg" : "border-line bg-elev text-muted hover:text-fg"}`}
                      style={sub === s.slug ? { borderColor: current.color, background: `${current.color}1f` } : undefined}>
                      <span className="grid h-7 w-8 place-items-center rounded-lg bg-soft"><NodoProp name={SUBCATEGORY_PROP[s.slug]} size={22} /></span>
                      {s.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="button" onClick={() => setHidden(!hidden)} className="btn-ghost mt-9">
            {hidden ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
            {hidden ? "Dejar que Nodo pasee por el sitio" : "Que Nodo deje de pasear por el sitio"}
          </button>
        </div>

        <div className="relative grid min-h-[440px] place-items-center">
          <div className="absolute h-80 w-80 rounded-full blur-3xl transition-colors duration-700" style={{ background: `${current?.color ?? "#7C5CFF"}45` }} aria-hidden />
          <div className="relative w-[min(400px,82vw)]">
            <Nodo size="100%" category={cat} subcategory={sub} mood={mood} track title={current ? `Nodo vestido para ${current.name}` : "Nodo"} />
          </div>
          {current && (
            <Link to={`/categoria/${current.slug}${sub ? `?sub=${sub}` : ""}`} className="btn-ghost relative">
              Ver skills de {current.subcategories.find((s) => s.slug === sub)?.name ?? current.name} <ArrowUpRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <section className="mt-24">
        <h2 className="section-title">Sus travesuras</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Mientras navegas, Nodo anda suelto. Tócalo para jugar con él. Cuando entras a una categoría o abres una skill, deja de jugar y se queda abajo a la izquierda como tu ayudante.
        </p>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRICKS.map((t, i) => (
            <motion.div key={t.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.06 }}
              className="card flex items-center gap-4 p-5">
              <Nodo size={84} mood={t.mood} title="" className="shrink-0" />
              <div>
                <h3 className="font-display text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="section-title">El vestuario completo</h2>
        <p className="mt-3 text-muted">Un gorro para cada una de las 8 categorías y un objeto para cada subcategoría. Toca uno para probárselo.</p>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {main.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="card flex flex-col p-5"
            >
              <button type="button" onClick={() => { tryOn(c.slug); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                className="flex cursor-pointer items-center gap-3 text-left">
                <Nodo size={84} category={c.slug} prop={null} title="" className="shrink-0" />
                <span>
                  <span className="block font-display text-lg font-semibold leading-tight" style={{ color: c.color }}>{c.name}</span>
                  <span className="text-sm text-muted">{HAT_LABEL[CATEGORY_HAT[c.slug]]}</span>
                </span>
              </button>
              <ul className="mt-4 space-y-1.5">
                {c.subcategories.map((s) => (
                  <li key={s.slug}>
                    <button type="button" onClick={() => { tryOn(c.slug, s.slug); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-1 text-left text-sm text-muted transition-colors hover:bg-soft hover:text-fg">
                      <span className="grid h-8 w-9 shrink-0 place-items-center rounded-lg bg-soft"><NodoProp name={SUBCATEGORY_PROP[s.slug]} size={24} /></span>
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
