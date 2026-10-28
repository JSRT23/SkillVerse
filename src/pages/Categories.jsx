import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link, useParams, useSearchParams } from "react-router"
import { ChevronLeft, LoaderCircle } from "lucide-react"
import SkillCard from "../components/SkillCard"
import Ocho from "../components/Ocho"
import { CategoryIcon, Skeleton } from "../components/ui"
import { CategoryPanel } from "./Home"
import { useSkillList, useTaxonomyWithCounts } from "../hooks/useCatalog"
import { categoryMeta, MAIN_CATEGORIES } from "../lib/categories"
import { formatNumber } from "../lib/format"
import NotFound from "./NotFound"

export function Categories() {
  const { data: categories = [], isLoading } = useTaxonomyWithCounts()
  const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
  const other = categories.find((c) => c.slug === "other")
  return (
    <div className="container-page pt-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold sm:text-[3.2rem]" style={{ letterSpacing: "-0.04em" }}>Categorías</h1>
          <p className="mt-3 max-w-xl text-muted">
            Ocho categorías y {formatNumber(categories.reduce((n, c) => n + c.subcategories.length, 0))} subcategorías. Un modelo de IA lee cada skill y la ubica donde mejor encaja.
          </p>
        </div>
        <Ocho size={130} mood="happy" track className="hidden shrink-0 md:block" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)}
        {main.map((c, i) => <CategoryPanel key={c.slug} category={c} index={i} />)}
      </div>
      {other?.count > 0 && (
        <Link to="/categoria/other" className="card mt-4 flex items-center justify-between gap-4 p-5 transition-colors hover:border-brand/50">
          <span>
            <span className="font-display font-semibold">Otras</span>
            <span className="ml-2 text-sm text-muted">{formatNumber(other.count)} skills que no encajan claramente en ninguna categoría</span>
          </span>
          <Ocho size={56} outfit="party" accent="#E255C8" tentacles={false} bob={false} title="" />
        </Link>
      )}
    </div>
  )
}

export function Category({ newIds }) {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const sub = params.get("sub") ?? ""
  const { data: categories = [], isLoading: loadingCats } = useTaxonomyWithCounts()
  const category = categories.find((c) => c.slug === slug)
  const list = useSkillList({ category: slug, subcategory: sub, sort: "stars" })
  const sentinel = useRef(null)
  const { items, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = list

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() }, { rootMargin: "600px" })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!loadingCats && categories.length && !category) return <NotFound />

  const color = category?.color ?? "#7C5CFF"
  const meta = categoryMeta(slug)
  const others = categories.filter((c) => c.slug !== slug && c.count > 0 && c.slug !== "other")
  const setSub = (s) => {
    const next = new URLSearchParams(params)
    s ? next.set("sub", s) : next.delete("sub")
    setParams(next, { replace: true })
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(700px 320px at 78% 45%, ${color}55, transparent 70%)` }} aria-hidden />
        <div className="container-page relative grid grid-cols-[minmax(0,1fr)] items-center gap-6 py-12 md:grid-cols-[1fr_auto]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: [0.22, 1, 0.36, 1] }}>
            <Link to="/categorias" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ChevronLeft size={15} aria-hidden /> Categorías</Link>
            <h1 className="mt-5 flex items-center gap-4 text-4xl font-bold sm:text-[3.2rem]" style={{ letterSpacing: "-0.04em" }}>
              <CategoryIcon slug={slug} color={color} size={24} boxed />
              {category?.name ?? "…"}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{category?.description}</p>
            <p className="mt-4 font-display text-lg font-semibold" style={{ color }}>{formatNumber(category?.count ?? 0)} skills</p>
          </motion.div>
          <motion.div initial={{ scale: 0.6, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }} className="justify-self-center">
            <Ocho size={230} outfit={meta.outfit} accent={color} mood="happy" track />
          </motion.div>
        </div>
      </section>

      {/* Pestañas de subcategoría */}
      {category?.subcategories.length > 0 && (
        <div className="sticky top-[68px] z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="container-page flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]" role="tablist" aria-label="Subcategorías">
            {[{ slug: "", name: "Todas", count: category.count }, ...category.subcategories].map((s) => {
              const on = sub === s.slug
              return (
                <button key={s.slug || "all"} role="tab" aria-selected={on} type="button" onClick={() => setSub(s.slug)}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${on ? "text-white" : "text-muted hover:text-fg"}`}>
                  {on && <motion.span layoutId="sub-pill" className="absolute inset-0 rounded-full" style={{ background: color }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{s.name} <span className={`tabular-nums ${on ? "opacity-80" : "text-subtle"}`}>{formatNumber(s.count)}</span></span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="container-page py-10">
        {sub && category && (
          <p className="mb-6 max-w-2xl text-muted">{category.subcategories.find((s) => s.slug === sub)?.description}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-52" />)
            : <AnimatePresence mode="popLayout">{items.map((s, i) => <SkillCard key={s.id} skill={s} index={i % 24} isNew={newIds?.has(s.id)} />)}</AnimatePresence>}
        </div>
        {!isLoading && items.length === 0 && (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <Ocho size={130} mood="sleep" outfit={meta.outfit} accent={color} />
            <p className="font-semibold">Todavía no hay skills aquí.</p>
            <p className="text-sm text-muted">El rastreador sigue sumando skills cada minuto. Vuelve pronto o mira otra subcategoría.</p>
          </div>
        )}
        <div ref={sentinel} className="flex h-20 items-center justify-center">
          {isFetchingNextPage && <LoaderCircle className="animate-spin text-brand" aria-label="Cargando más" />}
        </div>
        {!isLoading && total > 0 && !hasNextPage && <p className="text-center text-sm text-subtle">Viste las {formatNumber(total)} skills.</p>}

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-semibold">Otras categorías</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((c) => (
                <Link key={c.slug} to={`/categoria/${c.slug}`} className="chip border-line bg-elev px-3.5 py-2 text-sm text-muted transition-colors hover:border-brand/50 hover:text-fg">
                  <CategoryIcon slug={c.slug} color={c.color} size={14} /> {c.name} <span className="text-xs text-subtle">{formatNumber(c.count)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
