import { useMemo } from "react"
import { motion } from "motion/react"
import { Link } from "react-router"
import { BookOpen, Compass, Search, TrendingUp } from "lucide-react"
import WebHero from "../components/WebHero"
import SkillCard from "../components/SkillCard"
import Mascot from "../components/Mascot"
import { RepoAvatar } from "../components/RepoAvatar"
import { CategoryIcon, CommandLine, SectionHeader, Skeleton, StarCount, TrustBadge } from "../components/ui"
import { pickNewest, pickPopular, useCatalog, useCategoriesWithCounts, useRepoTrends } from "../hooks/useCatalog"
import { categoryMeta } from "../lib/categories"
import { formatCompact, formatNumber } from "../lib/format"
import { useSearch } from "../searchContext"

function Hero({ skills, categories, repos }) {
  const realCategories = categories.filter((c) => c.slug !== "other").length
  const openSearch = useSearch()
  return (
    <section className="container-page grid items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-14">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-dusk/60 px-3 py-1.5 text-sm text-haze">
          <span className="h-2 w-2 rounded-full bg-lagoon" aria-hidden />
          Directorio independiente, sincronizado con GitHub
        </p>
        <h1 className="mt-6 text-4xl font-bold leading-[1.1] sm:text-5xl xl:text-[3.5rem]">
          Encuentra la skill que tu agente necesita
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze">
          Cada skill es un paquete de instrucciones que le enseña a tu agente un trabajo nuevo. Aquí ves qué hace cada una, cuántas estrellas tiene y cómo instalarla en un minuto.
        </p>

        <motion.button
          type="button"
          onClick={openSearch}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-8 flex w-full max-w-xl items-center gap-3 rounded-full border border-line bg-dusk/80 py-2 pl-5 pr-2 text-left text-haze shadow-[var(--shadow-glow)] transition-colors hover:border-violet cursor-pointer"
        >
          <Search size={20} className="text-amber" aria-hidden />
          <span className="flex-1">Prueba con “pdf”, “testing” o “diseño”</span>
          <span className="btn-primary pointer-events-none py-2">Buscar</span>
        </motion.button>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/explorar" className="btn-ghost"><Compass size={16} aria-hidden /> Explorar el catálogo</Link>
          <Link to="/guia" className="btn-ghost"><BookOpen size={16} aria-hidden /> Qué es una skill</Link>
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {[
            [formatNumber(skills), "skills"],
            [formatNumber(repos), "repositorios"],
            [formatNumber(realCategories), "categorías"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-2xl font-bold">{value} <span className="font-sans text-sm font-medium text-haze">{label}</span></dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <WebHero categories={categories} />
    </section>
  )
}

function Popular({ skills, loading }) {
  const popular = useMemo(() => pickPopular(skills, 8), [skills])
  return (
    <section className="container-page py-14">
      <SectionHeader
        title="Las más populares"
        description="Skills de los repositorios con más estrellas en GitHub. Las estrellas son del repositorio completo."
        action={<Link to="/explorar?orden=stars" className="btn-ghost">Ver todas</Link>}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)
          : popular.map((s, i) => <SkillCard key={s.id} skill={s} index={i} />)}
      </div>
    </section>
  )
}

function Newest({ skills, loading, newIds }) {
  const newest = useMemo(() => pickNewest(skills, 6), [skills])
  return (
    <section className="container-page py-14">
      <SectionHeader
        title="Recién llegadas"
        description="Las últimas skills que encontró el rastreador. Cuando aparece una nueva, la ves aquí sin recargar."
        action={<Link to="/explorar?orden=newest" className="btn-ghost">Ver recientes</Link>}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-60" />)
          : newest.map((s, i) => <SkillCard key={s.id} skill={s} index={i} isNew={newIds?.has(s.id)} />)}
      </div>
    </section>
  )
}

function Categories({ categories }) {
  return (
    <section className="container-page py-14">
      <SectionHeader
        title="Categorías"
        description="Nodo tiene un traje para cada tipo de trabajo. Elige uno y mira todas sus skills."
        action={<Link to="/categorias" className="btn-ghost">Ver categorías</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 4) * 0.06 }}
          >
            <CategoryTile category={c} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function CategoryTile({ category: c }) {
  return (
    <Link
      to={`/categoria/${c.slug}`}
      className="group panel relative flex h-full items-center gap-4 overflow-hidden p-4 transition-colors hover:border-[var(--c)]"
      style={{ "--c": c.color }}
    >
      <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" style={{ background: c.color }} aria-hidden />
      <motion.span className="relative shrink-0" whileHover={{ scale: 1.08, rotate: -4 }}>
        <Mascot size={78} outfit={categoryMeta(c.slug).outfit} accent={c.color} bob={false} title="" />
      </motion.span>
      <span className="relative min-w-0">
        <span className="flex items-center gap-2 font-display text-[15px] font-semibold leading-tight">
          <CategoryIcon slug={c.slug} color={c.color} size={15} />
          {c.name}
        </span>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-haze">{c.description}</span>
        <span className="mt-2 block text-xs font-semibold" style={{ color: c.color }}>
          {c.count} {c.count === 1 ? "skill" : "skills"}
        </span>
      </span>
    </Link>
  )
}

function Repos({ repos, loading }) {
  const max = Math.max(...repos.map((r) => r.stars ?? 0), 1)
  return (
    <section className="container-page py-14">
      <SectionHeader
        title="Repositorios en tendencia"
        description="Ordenados por estrellas en GitHub, con lo que ganaron en los últimos 7 días."
      />
      <ol className="panel divide-y divide-line/60 overflow-hidden">
        {loading && <li className="p-6"><Skeleton className="h-12" /></li>}
        {repos.map((r, i) => (
          <motion.li
            key={r.repo_id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-4 sm:grid-cols-[auto_1.2fr_2fr_auto] sm:p-5"
          >
            <span className="w-8 font-display text-2xl font-bold text-haze/60">{i + 1}</span>
            <a href={`https://github.com/${r.full_name}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 hover:text-amber">
              <RepoAvatar owner={r.full_name} src={r.owner_avatar_url} size={34} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{r.full_name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-haze">
                  {r.skill_count} skills <TrustBadge trust={r.trust} />
                </span>
              </span>
            </a>
            <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-ink-deep sm:col-span-1" aria-hidden>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet to-amber"
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.stars / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
              />
            </div>
            <span className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:justify-end">
              <StarCount value={r.stars} />
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${r.stars_gained_7d > 0 ? "text-lagoon" : "text-haze"}`}>
                <TrendingUp size={13} aria-hidden /> +{formatCompact(r.stars_gained_7d ?? 0)} en 7 días
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
    { title: "Elige una skill", text: "Busca por tema o explora por categoría. Revisa qué hace y si incluye scripts." },
    { title: "Instálala con un comando", text: "Copia el comando de su ficha. La skill queda en la carpeta de skills de tu agente." },
    { title: "Pídeselo a tu agente", text: "No hay que activarla: cuando tu pedido encaja con su descripción, tu agente la usa sola." },
  ]
  return (
    <section className="container-page py-14">
      <div className="panel relative overflow-hidden p-6 sm:p-10">
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="section-title">Instala tu primera skill en un minuto</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-amber font-display font-bold text-ink-deep">{i + 1}</span>
                  <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-haze">{s.text}</p>
                </motion.li>
              ))}
            </ol>
            <div className="mt-8 max-w-xl">
              <CommandLine command="npx skills add anthropics/skills --skill pdf" />
            </div>
          </div>
          <div className="hidden justify-self-center lg:block">
            <Mascot size={200} outfit="hardhat" accent="#FFC447" mood="happy" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home({ newIds }) {
  const { data: skills = [], isLoading } = useCatalog()
  const { data: categories = [] } = useCategoriesWithCounts()
  const { data: repos = [], isLoading: reposLoading } = useRepoTrends()

  return (
    <>
      <Hero skills={skills.length} categories={categories} repos={repos.length} />
      <Popular skills={skills} loading={isLoading} />
      <Newest skills={skills} loading={isLoading} newIds={newIds} />
      <Categories categories={categories} />
      <Repos repos={repos} loading={reposLoading} />
      <InstallSteps />
    </>
  )
}
