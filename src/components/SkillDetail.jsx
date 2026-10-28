import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Link } from "react-router"
import { ExternalLink, FileCode2, Files, GitFork, Scale, TriangleAlert, Clock, FileText } from "lucide-react"
import Mascot from "./Mascot"
import { RepoAvatar } from "./RepoAvatar"
import { CategoryIcon, CommandLine, StarCount, TrustBadge } from "./ui"
import { categoryMeta } from "../lib/categories"
import { formatNumber, timeAgo } from "../lib/format"

function installOptions(skill) {
  const repoName = skill.repo_full_name.split("/")[1]
  const folder = skill.path ? skill.path.split("/").pop() : skill.name
  const src = skill.path ? `/tmp/${repoName}/${skill.path}` : `/tmp/${repoName}`
  const clone = `git clone --depth 1 https://github.com/${skill.repo_full_name}.git /tmp/${repoName}`
  return [
    {
      id: "cli",
      label: "Con skills CLI",
      help: "Funciona con Claude Code, Codex, Copilot, Cursor y otros agentes compatibles.",
      commands: [skill.install_command],
    },
    {
      id: "personal",
      label: "Claude Code (todas tus carpetas)",
      help: "Queda disponible en todos tus proyectos.",
      commands: [clone, `mkdir -p ~/.claude/skills && cp -r ${src} ~/.claude/skills/${folder}`],
    },
    {
      id: "project",
      label: "Solo este proyecto",
      help: "Se guarda en el repo y la comparte todo tu equipo.",
      commands: [clone, `mkdir -p .claude/skills && cp -r ${src} .claude/skills/${folder}`],
    },
  ]
}

const HOW_IT_WORKS = [
  "Tu agente lee solo el nombre y la descripción de cada skill instalada.",
  "Cuando tu pedido encaja con esa descripción, carga el SKILL.md completo.",
  "Sigue sus instrucciones y usa sus archivos o scripts para hacer el trabajo.",
]

export default function SkillDetail({ skill, compact = false }) {
  const [tab, setTab] = useState("cli")
  const meta = categoryMeta(skill.category_slug)
  const color = skill.category_color ?? "#7B6CF6"
  const options = installOptions(skill)
  const active = options.find((o) => o.id === tab)

  return (
    <div>
      {/* Encabezado */}
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/categoria/${skill.category_slug}`}
              className="chip transition-transform hover:scale-105"
              style={{ borderColor: `${color}66`, background: `${color}1a`, color }}
            >
              <CategoryIcon slug={skill.category_slug} color={color} size={12} />
              {skill.category_name}
            </Link>
            <TrustBadge trust={skill.trust} />
          </div>
          <h1 className={`mt-4 break-words font-display font-bold leading-tight ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"}`}>
            {skill.name}
          </h1>
          <a
            href={skill.repo_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-haze transition-colors hover:text-silk"
          >
            <RepoAvatar skill={skill} size={22} />
            {skill.repo_full_name}
            <ExternalLink size={13} aria-hidden />
          </a>
        </div>
        <div className="hidden shrink-0 sm:block">
          <Mascot size={compact ? 120 : 150} outfit={meta.outfit} accent={color} mood="happy" />
        </div>
      </div>

      {/* Datos */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: null, label: "Estrellas del repo", value: <StarCount value={skill.stars} className="text-base" /> },
          { icon: GitFork, label: "Forks", value: formatNumber(skill.forks) },
          { icon: Files, label: "Archivos", value: formatNumber(skill.file_count) },
          { icon: Scale, label: "Licencia", value: skill.skill_license || skill.repo_license || "Sin declarar" },
        ].map((d) => (
          <div key={d.label} className="rounded-2xl border border-line/70 bg-ink-deep/50 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-haze">
              {d.icon && <d.icon size={13} aria-hidden />} {d.label}
            </dt>
            <dd className="mt-1 truncate font-semibold">{d.value}</dd>
          </div>
        ))}
      </dl>

      {/* Qué hace */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Qué hace</h2>
        <p className="mt-2 leading-relaxed text-silk/90">{skill.description || "El autor no agregó una descripción."}</p>
        <p className="mt-2 text-xs text-haze">Descripción tomada del SKILL.md, tal como la escribió su autor.</p>
      </section>

      {skill.has_scripts && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber" aria-hidden />
          <p>
            Esta skill incluye scripts que tu agente puede ejecutar en tu equipo. Revísalos en GitHub antes de instalarla.
          </p>
        </div>
      )}

      {/* Instalación */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Instálala</h2>
        <div role="tablist" aria-label="Formas de instalar" className="mt-3 flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={tab === o.id}
              onClick={() => setTab(o.id)}
              className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${tab === o.id ? "text-ink-deep" : "text-haze hover:text-silk"}`}
            >
              {tab === o.id && (
                <motion.span layoutId={`tab-pill-${compact ? "m" : "p"}`} className="absolute inset-0 rounded-full bg-amber" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
              )}
              <span className="relative">{o.label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-2"
          >
            <p className="text-sm text-haze">{active.help}</p>
            {active.commands.map((c) => <CommandLine key={c} command={c} />)}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Ideas */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Pídele algo como</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {meta.prompts.map((p) => (
            <li key={p} className="rounded-2xl border border-line/70 bg-dusk-2/50 p-4 text-sm leading-relaxed">
              “{p}”
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-haze">Ejemplos para esta categoría. Lee el SKILL.md para ver exactamente qué cubre.</p>
      </section>

      {/* Cómo funciona */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Cómo funciona una skill</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="flex gap-3 rounded-2xl border border-line/70 bg-ink-deep/40 p-4 text-sm leading-relaxed">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet/20 font-display text-xs font-bold text-violet">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Acciones */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line/60 pt-6">
        <a href={skill.html_url} target="_blank" rel="noreferrer" className="btn-primary">
          <ExternalLink size={16} aria-hidden /> Abrir en GitHub
        </a>
        <a href={skill.raw_url} target="_blank" rel="noreferrer" className="btn-ghost">
          <FileText size={16} aria-hidden /> Ver SKILL.md
        </a>
        {skill.has_scripts && (
          <span className="inline-flex items-center gap-1.5 text-xs text-haze">
            <FileCode2 size={14} aria-hidden /> Con scripts
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-haze">
          <Clock size={13} aria-hidden /> Repo actualizado {timeAgo(skill.pushed_at)}
        </span>
      </div>
    </div>
  )
}
