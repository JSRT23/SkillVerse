import { motion } from "motion/react"
import { Link, useParams } from "react-router"
import { AnimatePresence } from "motion/react"
import SkillCard from "../components/SkillCard"
import Mascot from "../components/Mascot"
import { CategoryIcon, Skeleton } from "../components/ui"
import { CategoryTile } from "./Home"
import { useCatalog, useCategoriesWithCounts } from "../hooks/useCatalog"
import { categoryMeta } from "../lib/categories"
import NotFound from "./NotFound"

export function Categories() {
  const { data: categories = [], isLoading } = useCategoriesWithCounts()
  return (
    <div className="container-page pt-10">
      <h1 className="text-4xl font-bold sm:text-5xl">Categorías</h1>
      <p className="mt-3 max-w-xl text-haze">
        Cada skill cae en una categoría según su nombre y su descripción. Nodo se viste distinto para cada una.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-28" />)}
        {categories.map((c, i) => (
          <motion.div key={c.slug} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <CategoryTile category={c} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function Category({ newIds }) {
  const { slug } = useParams()
  const { data: categories = [], isLoading: loadingCats } = useCategoriesWithCounts()
  const { data: skills = [], isLoading } = useCatalog()
  const category = categories.find((c) => c.slug === slug)

  if (!loadingCats && categories.length && !category) return <NotFound />

  const list = skills.filter((s) => s.category_slug === slug).sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
  const color = category?.color ?? "#7B6CF6"
  const meta = categoryMeta(slug)
  const others = categories.filter((c) => c.slug !== slug && c.count > 0)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(700px 300px at 75% 40%, ${color}, transparent 70%)` }} aria-hidden />
        <div className="container-page relative grid items-center gap-6 py-12 md:grid-cols-[1fr_auto]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/categorias" className="text-sm font-semibold text-haze hover:text-silk">Todas las categorías</Link>
            <h1 className="mt-4 flex items-center gap-4 text-4xl font-bold sm:text-5xl">
              <CategoryIcon slug={slug} color={color} size={26} boxed />
              {category?.name ?? "…"}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-haze">{category?.description}</p>
            <p className="mt-4 font-semibold" style={{ color }}>{list.length} {list.length === 1 ? "skill" : "skills"}</p>
          </motion.div>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="justify-self-center">
            <Mascot size={200} outfit={meta.outfit} accent={color} mood="happy" />
          </motion.div>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)
            : <AnimatePresence>{list.map((s, i) => <SkillCard key={s.id} skill={s} index={i} isNew={newIds?.has(s.id)} />)}</AnimatePresence>}
        </div>
        {!isLoading && list.length === 0 && (
          <div className="panel flex flex-col items-center gap-3 p-10 text-center">
            <Mascot size={120} mood="sleep" outfit={meta.outfit} accent={color} />
            <p className="font-semibold">Todavía no hay skills en esta categoría.</p>
            <p className="text-sm text-haze">El rastreador revisa GitHub cada 30 minutos. Vuelve pronto o explora otra.</p>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-semibold">Otras categorías</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((c) => (
                <Link key={c.slug} to={`/categoria/${c.slug}`} className="chip border-line bg-dusk/60 px-3.5 py-2 text-sm text-haze transition-colors hover:text-silk" style={{ "--c": c.color }}>
                  <CategoryIcon slug={c.slug} color={c.color} size={13} /> {c.name} <span className="text-xs">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
