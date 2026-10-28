import { useState } from "react"
import { motion } from "motion/react"
import { Link, useLocation, useNavigate } from "react-router"
import { ArrowUpRight, BookOpen, Compass, Search, Sparkles, TrendingUp } from "lucide-react"
import WebHero from "../components/WebHero"
import Nodo from "../components/Nodo"
import SkillCard from "../components/SkillCard"
import { RepoAvatar } from "../components/RepoAvatar"
import { AnimatedNumber, CategoryIcon, CommandLine, Kbd, SectionHeader, Skeleton, StarCount, TrustBadge } from "../components/ui"
import { useNewest, usePopular, useRepoTrends, useSyncStatus, useTaxonomyWithCounts } from "../hooks/useCatalog"
import { MAIN_CATEGORIES } from "../lib/categories"
import { formatCompact, formatNumber, timeAgo } from "../lib/format"
import { useSearch } from "../searchContext"

const QUICK = ["pdf", "testing", "react", "seguridad", "mcp", "diseño"]

function Hero({ categories, status }) {
  const openSearch = useSearch()
  const navigate = useNavigate()
  const subcats = categories.reduce((n, c) => n + c.subcategories.length, 0)
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" aria-hidden />
      <div className="container-page relative grid grid-cols-[minmax(0,1fr)] items-center gap-8 pb-16 pt-10 lg:grid-cols-[1.02fr_1fr] lg:gap-4 lg:pb-24 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <Link to="/explorar?orden=newest" className="group inline-flex items-center gap-2 rounded-full border border-line bg-elev py-1.5 pl-1.5 pr-3.5 text-sm text-muted shadow-sm hover:border-brand/50">
            <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-semibold text-teal">En vivo</span>
            {status ? `${formatNumber(status.total_skills)} skills de ${formatNumber(status.total_repos)} repos` : "Catálogo sincronizado con GitHub"}
            <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>

          <h1 className="mt-7 text-[2.7rem] font-bold leading-[1.02] sm:text-6xl xl:text-[4.4rem]" style={{ letterSpacing: "-0.045em" }}>
            Encuentra la skill exacta para tu agente
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Miles de Agent Skills de GitHub, clasificadas con IA en categorías y subcategorías. Ves qué hace cada una, qué tan popular es y cómo instalarla en un comando.
          </p>

          <motion.button
            type="button"
            onClick={openSearch}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            className="card mt-9 flex w-full max-w-xl items-center gap-3 py-2 pl-5 pr-2 text-left cursor-pointer"
            style={{ borderRadius: 999 }}
          >
            <Search size={20} className="text-brand" aria-hidden />
            <span className="flex-1 truncate text-muted">Describe lo que necesitas hacer…</span>
            <span className="hidden sm:inline"><Kbd>Ctrl K</Kbd></span>
            <span className="btn-brand pointer-events-none py-2.5"><Sparkles size={15} aria-hidden /> Buscar</span>
          </motion.button>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-subtle">Prueba:</span>
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => navigate(`/explorar?q=${encodeURIComponent(q)}`)} className="chip border-line bg-elev px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand/50 hover:text-fg cursor-pointer">
                {q}
              </button>
            ))}
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              [status?.total_skills ?? 0, "skills"],
              [status?.total_repos ?? 0, "repositorios"],
              [subcats, "subcategorías"],
            ].map(([value, label]) => (
              <div key={label}>
                <dd className="font-display text-3xl font-bold tracking-tight sm:text-4xl"><AnimatedNumber value={value} /></dd>
                <dt className="mt-1 text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </motion.div>

        <WebHero categories={categories} />
      </div>
    </section>
  )
}

/** Cinta con las últimas skills encontradas. */
function Ticker() {
  const { data = [] } = useNewest(14)
  const location = useLocation()
  if (!data.length) return null
  const items = [...data, ...data]
  return (
    <div className="relative overflow-hidden border-y border-line bg-elev/60 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
        {items.map((s, i) => (
          <Link key={`${s.id}-${i}`} to={`/skill/${s.slug}`} state={{ background: location }} className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1.5 text-sm transition-colors hover:border-brand/50">
            <CategoryIcon slug={s.category_slug} color={s.category_color} size={13} />
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-subtle">{timeAgo(s.first_seen_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Popular() {
  const { data = [], isLoading } = usePopular(9)
  return (
    <section className="container-page py-20">
      <SectionHeader
        title="Las más populares"
        description="De los repositorios con más estrellas en GitHub. Mostramos hasta dos skills por repositorio para que veas variedad."
        action={<Link to="/explorar" className="btn-ghost">Ver todas <ArrowUpRight size={15} aria-hidden /></Link>}
      />
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className={i === 0 ? "h-56 sm:col-span-2 lg:row-span-2 lg:h-auto" : "h-56"} />)
          : data.slice(0, 9).map((s, i) => <SkillCard key={s.id} skill={s} index={i} featured={i === 0} />)}
      </div>
    </section>
  )
}

function Newest({ newIds }) {
  const { data = [], isLoading } = useNewest(6)
  return (
    <section className="container-page py-20">
      <SectionHeader
        title="Recién llegadas"
        description="El rastreador revisa GitHub sin parar. Lo nuevo aparece aquí sin recargar la página."
        action={<Link to="/explorar?orden=newest" className="btn-ghost">Ver recientes <ArrowUpRight size={15} aria-hidden /></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52" />)
          : data.map((s, i) => <SkillCard key={s.id} skill={s} index={i} isNew={newIds?.has(s.id)} />)}
      </div>
    </section>
  )
}

export function CategoryPanel({ category: c, index = 0 }) {
  const [sub, setSub] = useState(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group card relative flex h-full flex-col overflow-hidden p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[var(--c)] hover:shadow-[0_30px_70px_-34px_var(--c)]"
      style={{ "--c": `${c.color}90` }}
    >
      <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80" style={{ background: c.color }} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <Link to={`/categoria/${c.slug}`} className="min-w-0">
          <CategoryIcon slug={c.slug} color={c.color} size={18} boxed />
          <h3 className="mt-4 font-display text-xl font-semibold leading-tight">{c.name}</h3>
          <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: c.color }}>{formatNumber(c.count)} skills</p>
        </Link>
        <motion.span className="-mr-2 -mt-2 shrink-0" whileHover={{ rotate: -6, scale: 1.08 }}>
          <Nodo size={96} category={c.slug} subcategory={sub} mood={sub ? "happy" : "idle"} title="" />
        </motion.span>
      </div>
      <ul className="relative mt-4 flex flex-wrap gap-1.5">
        {c.subcategories.map((s) => (
          <li key={s.slug}>
            <Link
              to={`/categoria/${c.slug}?sub=${s.slug}`}
              onMouseEnter={() => setSub(s.slug)}
              onMouseLeave={() => setSub(null)}
              onFocus={() => setSub(s.slug)}
              onBlur={() => setSub(null)}
              className="chip border-line bg-bg px-2.5 py-1 text-[12.5px] text-muted transition-colors hover:border-[var(--c)] hover:text-fg"
            >
              {s.name}
              <span className="tabular-nums text-subtle">{formatCompact(s.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function Categories({ categories }) {
  const main = MAIN_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean)
  return (
    <section className="container-page py-20">
      <SectionHeader
        title="Ocho categorías, un gorro para cada una"
        description="Cada skill se clasifica con IA según lo que hace. Pasa el cursor por una subcategoría y Nodo saca su herramienta."
        action={<Link to="/categorias" className="btn-ghost">Todas las categorías <ArrowUpRight size={15} aria-hidden /></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {main.length
          ? main.map((c, i) => <CategoryPanel key={c.slug} category={c} index={i} />)
          : Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </section>
  )
}

function Repos() {
  const { data: repos = [], isLoading } = useRepoTrends(8)
  const max = Math.max(...repos.map((r) => r.stars ?? 0), 1)
  return (
    <section className="container-page py-20">
      <SectionHeader title="Repositorios destacados" description="Las colecciones de skills con más estrellas en GitHub y lo que ganaron en los últimos 7 días." />
      <ol className="card divide-y divide-line overflow-hidden">
        {isLoading && Array.from({ length: 4 }, (_, i) => <li key={i} className="p-5"><Skeleton className="h-10" /></li>)}
        {repos.map((r, i) => (
          <motion.li
            key={r.repo_id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-soft sm:grid-cols-[2.5rem_minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:p-5"
          >
            <span className="font-display text-2xl font-bold tabular-nums text-subtle">{i + 1}</span>
            <a href={`https://github.com/${r.full_name}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3">
              <RepoAvatar owner={r.full_name} src={r.owner_avatar_url} size={36} />
              <span className="min-w-0">
                <span className="block truncate font-semibold hover:text-brand">{r.full_name}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted">{formatNumber(r.skill_count)} skills <TrustBadge trust={r.trust} /></span>
              </span>
            </a>
            <div className="col-span-3 h-2 overflow-hidden rounded-full bg-soft sm:col-span-1" aria-hidden>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--color-brand), var(--color-orchid), var(--color-amber))" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(4, (r.stars / max) * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="col-start-3 row-start-1 flex flex-col items-end gap-1 sm:col-start-auto sm:row-start-auto">
              <StarCount value={r.stars} className="text-sm" />
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${r.stars_gained_7d > 0 ? "text-teal" : "text-subtle"}`}>
                <TrendingUp size={12} aria-hidden /> +{formatCompact(r.stars_gained_7d ?? 0)} esta semana
              </span>
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

function InstallSteps() {
  const steps = [
    { title: "Encuéntrala", text: "Busca con tus palabras o entra por categoría. Revisa qué hace y si incluye scripts." },
    { title: "Instálala", text: "Copia el comando de su ficha. Queda en la carpeta de skills de tu agente." },
    { title: "Úsala", text: "No hay que activarla: cuando tu pedido encaja con su descripción, tu agente la usa sola." },
  ]
  return (
    <section className="container-page py-20">
      <div className="shell relative overflow-hidden rounded-[32px] border border-line bg-[#0c0a20] p-7 text-fg sm:p-12">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-orchid/20 blur-3xl" aria-hidden />
        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="section-title max-w-xl">Tu primera skill, instalada en un minuto</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <motion.li key={s.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-orchid font-display font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </motion.li>
              ))}
            </ol>
            <div className="mt-10 max-w-xl"><CommandLine command="npx skills add anthropics/skills --skill pdf" /></div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/explorar" className="btn-primary"><Compass size={16} aria-hidden /> Explorar skills</Link>
              <Link to="/guia" className="btn-ghost"><BookOpen size={16} aria-hidden /> Leer la guía</Link>
            </div>
          </div>
          <div className="hidden justify-self-center lg:block">
            <Nodo size={250} hat="hardhat" prop="check" mood="happy" track title="Nodo listo para instalar" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home({ newIds }) {
  const { data: categories = [] } = useTaxonomyWithCounts()
  const { data: status } = useSyncStatus()
  return (
    <>
      <Hero categories={categories} status={status} />
      <Ticker />
      <Popular />
      <Categories categories={categories} />
      <Newest newIds={newIds} />
      <Repos />
      <InstallSteps />
    </>
  )
}
