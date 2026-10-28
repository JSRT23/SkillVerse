import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link, useLocation } from "react-router"
import {
  CalendarClock, ChevronRight, ExternalLink, FileCode2, FileText, Files, GitFork, Lightbulb, Radar, Scale, Sparkles, TriangleAlert,
} from "lucide-react"
import Ocho from "./Ocho"
import { RepoAvatar } from "./RepoAvatar"
import { CategoryIcon, CommandLine, Skeleton, StarCount, TrustBadge } from "./ui"
import { useSimilar } from "../hooks/useCatalog"
import { categoryMeta } from "../lib/categories"
import { formatNumber, timeAgo } from "../lib/format"

function installOptions(skill) {
  const repoName = skill.repo_full_name.split("/")[1]
  const folder = skill.path ? skill.path.split("/").pop() : skill.name
  const src = skill.path ? `/tmp/${repoName}/${skill.path}` : `/tmp/${repoName}`
  const clone = `git clone --depth 1 https://github.com/${skill.repo_full_name}.git /tmp/${repoName}`
  return [
    { id: "cli", label: "Skills CLI", help: "Detecta tu agente (Claude Code, Codex, Copilot, Cursor…) y la instala donde corresponde.", commands: [skill.install_command] },
    { id: "personal", label: "Claude Code", help: "Disponible en todos tus proyectos.", commands: [clone, `mkdir -p ~/.claude/skills && cp -r ${src} ~/.claude/skills/${folder}`] },
    { id: "project", label: "Este proyecto", help: "Se guarda en el repo y la comparte tu equipo.", commands: [clone, `mkdir -p .claude/skills && cp -r ${src} .claude/skills/${folder}`] },
  ]
}

const HOW_IT_WORKS = [
  { icon: Radar, text: "Tu agente lee solo el nombre y la descripción de cada skill instalada." },
  { icon: Lightbulb, text: "Si tu pedido encaja con esa descripción, carga el SKILL.md completo." },
  { icon: Sparkles, text: "Sigue sus instrucciones y usa sus archivos para hacer el trabajo." },
]

function Install({ skill, layoutKey }) {
  const [tab, setTab] = useState("cli")
  const options = installOptions(skill)
  const active = options.find((o) => o.id === tab)
  return (
    <div className="card p-4">
      <h2 className="font-display text-base font-semibold">Instalar</h2>
      <div role="tablist" aria-label="Formas de instalar" className="mt-3 grid grid-cols-3 rounded-full bg-soft p-1">
        {options.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={tab === o.id}
            onClick={() => setTab(o.id)}
            className={`relative rounded-full px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${tab === o.id ? "text-fg" : "text-muted hover:text-fg"}`}
          >
            {tab === o.id && <motion.span layoutId={`install-${layoutKey}`} className="absolute inset-0 rounded-full bg-elev shadow-sm ring-1 ring-line" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{o.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="mt-3 space-y-2">
          <p className="text-xs leading-relaxed text-muted">{active.help}</p>
          {active.commands.map((c) => <CommandLine key={c} command={c} />)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Facts({ skill }) {
  const rows = [
    { icon: GitFork, label: "Forks", value: formatNumber(skill.forks) },
    { icon: Files, label: "Archivos", value: formatNumber(skill.file_count) },
    { icon: Scale, label: "Licencia", value: skill.skill_license || skill.repo_license || "Sin declarar" },
    { icon: CalendarClock, label: "Repo actualizado", value: timeAgo(skill.pushed_at) },
    { icon: Radar, label: "En SkillVerse desde", value: timeAgo(skill.first_seen_at) },
  ]
  return (
    <dl className="card divide-y divide-line px-4">
      <div className="flex items-center justify-between py-3">
        <dt className="text-sm text-muted">Estrellas del repo</dt>
        <dd><StarCount value={skill.stars} className="text-base" /></dd>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-3">
          <dt className="flex items-center gap-2 text-sm text-muted"><r.icon size={14} aria-hidden />{r.label}</dt>
          <dd className="truncate text-sm font-semibold" title={String(r.value)}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Similar({ skill }) {
  const location = useLocation()
  const { data = [], isLoading } = useSimilar(skill.id)
  if (!isLoading && !data.length) return null
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Skills parecidas</h2>
      <p className="mt-1 text-sm text-muted">Encontradas por significado, no solo por palabras.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[74px]" />)}
        {data.map((s) => (
          <Link
            key={s.id}
            to={`/skill/${s.slug}`}
            state={{ background: location.state?.background ?? location }}
            replace
            className="group flex items-center gap-3 rounded-2xl border border-line bg-bg p-3 transition-colors hover:border-brand/50"
          >
            <CategoryIcon slug={s.category_slug} color={s.category_color} size={14} boxed />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold group-hover:text-brand">{s.name}</span>
              <span className="block truncate text-xs text-subtle">{s.repo_full_name}</span>
            </span>
            <StarCount value={s.stars} className="text-xs text-muted" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function SkillDetail({ skill, inModal = false }) {
  const meta = categoryMeta(skill.category_slug)
  const color = skill.category_color ?? "#7C5CFF"

  return (
    <div>
      {/* Encabezado con el color de la categoría */}
      <header className="relative overflow-hidden border-b border-line px-6 pb-7 pt-8 sm:px-9">
        <div className="absolute inset-0 bg-grid opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: `${color}33` }} aria-hidden />
        <motion.div
          className="absolute -bottom-10 right-6 hidden sm:block"
          initial={{ y: 40, opacity: 0, rotate: 8 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.1 }}
        >
          <Ocho size={inModal ? 170 : 200} outfit={meta.outfit} accent={color} mood="happy" track title="" />
        </motion.div>

        <div className="relative max-w-2xl">
          <nav aria-label="Ubicación" className="flex flex-wrap items-center gap-1.5 text-sm">
            <Link to={`/categoria/${skill.category_slug}`} className="flex items-center gap-1.5 font-semibold hover:underline" style={{ color }}>
              <CategoryIcon slug={skill.category_slug} color={color} size={14} />
              {skill.category_name}
            </Link>
            {skill.subcategory_slug && (
              <>
                <ChevronRight size={14} className="text-subtle" aria-hidden />
                <Link to={`/categoria/${skill.category_slug}?sub=${skill.subcategory_slug}`} className="font-medium text-muted hover:text-fg">
                  {skill.subcategory_name}
                </Link>
              </>
            )}
          </nav>
          <h1 className="mt-3 break-words text-[2rem] font-bold leading-[1.05] sm:text-[2.6rem]">{skill.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={skill.repo_url} target="_blank" rel="noreferrer" className="chip border-line bg-elev py-1 pl-1 pr-3 text-sm text-fg hover:border-brand/50">
              <RepoAvatar skill={skill} size={20} />
              {skill.repo_full_name}
              <ExternalLink size={12} className="text-subtle" aria-hidden />
            </a>
            <TrustBadge trust={skill.trust} />
            {skill.has_scripts && (
              <span className="chip border-amber/40 bg-amber/10 text-amber-deep"><FileCode2 size={12} aria-hidden /> Con scripts</span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-7 sm:px-9 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-9">
          <section>
            <h2 className="font-display text-lg font-semibold">Qué hace</h2>
            <p className="mt-3 text-[15.5px] leading-[1.7] text-fg/90">{skill.description || "El autor no agregó una descripción."}</p>
            <p className="mt-2 text-xs text-subtle">Texto del SKILL.md, tal como lo escribió su autor.</p>
          </section>

          {skill.has_scripts && (
            <div className="flex gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm leading-relaxed">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-deep" aria-hidden />
              <p>Incluye scripts que tu agente puede ejecutar en tu equipo. Ábrelos en GitHub y revísalos antes de instalarla.</p>
            </div>
          )}

          <section>
            <h2 className="font-display text-lg font-semibold">Pídele algo como</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {meta.prompts.map((p) => (
                <li key={p} className="relative rounded-2xl border border-line bg-bg p-4 pl-10 text-sm leading-relaxed">
                  <span className="absolute left-4 top-3.5 font-display text-2xl leading-none" style={{ color }} aria-hidden>“</span>
                  {p}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Cómo funciona una skill</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.text} className="rounded-2xl border border-line bg-bg p-4 text-sm leading-relaxed">
                  <span className="flex items-center gap-2 font-display text-xs font-bold text-subtle">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-brand">{i + 1}</span>
                    <step.icon size={15} className="text-brand" aria-hidden />
                  </span>
                  <p className="mt-2.5">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <Similar skill={skill} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Install skill={skill} layoutKey={inModal ? "m" : "p"} />
          <Facts skill={skill} />
          <div className="grid grid-cols-2 gap-2">
            <a href={skill.html_url} target="_blank" rel="noreferrer" className="btn-brand"><ExternalLink size={15} aria-hidden /> GitHub</a>
            <a href={skill.raw_url} target="_blank" rel="noreferrer" className="btn-ghost"><FileText size={15} aria-hidden /> SKILL.md</a>
          </div>
        </aside>
      </div>
    </div>
  )
}
