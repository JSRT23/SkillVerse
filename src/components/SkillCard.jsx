import { memo, useRef } from "react"
import { motion } from "motion/react"
import { Link, useLocation } from "react-router"
import { BadgeCheck, FileCode2, ShieldCheck, Sparkle } from "lucide-react"
import Nodo from "./Nodo"
import { RepoAvatar } from "./RepoAvatar"
import { CategoryIcon, CopyButton, StarCount } from "./ui"
import { timeAgo } from "../lib/format"

/** Luz que sigue al cursor dentro de la tarjeta. */
function useSpotlight() {
  const ref = useRef(null)
  const onPointerMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - r.left}px`)
    el.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return { ref, onPointerMove }
}

function SubcategoryChip({ skill, color }) {
  if (!skill.subcategory_name) return null
  return (
    <span className="chip max-w-[11rem] truncate border-transparent" style={{ background: `${color}18`, color }}>
      {skill.subcategory_name}
    </span>
  )
}

function SkillCard({ skill, index = 0, isNew = false, featured = false }) {
  const location = useLocation()
  const spot = useSpotlight()
  const color = skill.category_color ?? "#7C5CFF"

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: Math.min(index, 10) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative h-full ${featured ? "sm:col-span-2 lg:row-span-2" : ""}`}
    >
      <Link
        ref={spot.ref}
        onPointerMove={spot.onPointerMove}
        to={`/skill/${skill.slug}`}
        state={{ background: location }}
        className="card relative flex h-full flex-col overflow-hidden p-5 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-spring)] hover:-translate-y-1 hover:border-[var(--c)] hover:shadow-[0_24px_60px_-28px_var(--c)]"
        style={{ "--c": `${color}80` }}
      >
        {/* luz de cursor */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), ${color}1f, transparent 45%)` }}
          aria-hidden
        />

        {featured && (
          <>
            <span className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: `${color}30` }} aria-hidden />
            <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/3 transition-transform duration-500 group-hover:-translate-y-[40%] group-hover:rotate-3 sm:block">
              <Nodo size={190} category={skill.category_slug} subcategory={skill.subcategory_slug} mood="happy" title="" />
            </span>
          </>
        )}

        <div className="relative flex items-start gap-3">
          <CategoryIcon slug={skill.category_slug} color={color} size={featured ? 20 : 17} boxed />
          <div className="min-w-0 flex-1">
            <h3 className={`line-clamp-2 font-display font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] ${featured ? "text-2xl sm:text-[1.75rem]" : "text-[17px]"}`} title={skill.name}>
              {skill.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-subtle">
              <RepoAvatar skill={skill} size={14} />
              <span className="truncate">{skill.repo_full_name}</span>
              {skill.trust === "official" && <ShieldCheck size={13} className="shrink-0 text-teal" aria-label="Oficial" title="Oficial" />}
              {skill.trust === "verified" && <BadgeCheck size={13} className="shrink-0 text-brand" aria-label="Verificada" title="Verificada" />}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              <CopyButton text={skill.install_command} label="Copiar comando de instalación" />
            </span>
          </div>
        </div>

        <p className={`relative mt-4 flex-1 leading-relaxed text-muted ${featured ? "line-clamp-5 max-w-md text-[15.5px] sm:pr-44" : "line-clamp-3 text-sm"}`}>
          {skill.description || "El autor no agregó una descripción."}
        </p>

        <div className={`relative mt-5 flex flex-wrap items-center gap-2 ${featured ? "sm:pr-52" : ""}`}>
          <StarCount value={skill.stars} className="mr-1 text-sm text-fg" />
          {isNew && (
            <span className="chip border-teal/40 bg-teal/10 text-teal">
              <Sparkle size={11} className="fill-teal" aria-hidden /> Nueva
            </span>
          )}
          <SubcategoryChip skill={skill} color={color} />
          {!skill.category_slug && <span className="chip border-line bg-soft text-subtle">Clasificando…</span>}
          <span className="ml-auto flex items-center gap-2">
            {skill.has_scripts && <FileCode2 size={15} className="text-subtle" aria-label="Incluye scripts" />}
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

export default memo(SkillCard)

/** Fila compacta para la vista de lista. */
export const SkillRow = memo(function SkillRow({ skill, index = 0 }) {
  const location = useLocation()
  const color = skill.category_color ?? "#7C5CFF"
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.02 }}
    >
      <Link
        to={`/skill/${skill.slug}`}
        state={{ background: location }}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-soft sm:px-4"
      >
        <CategoryIcon slug={skill.category_slug} color={color} size={15} boxed />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{skill.name}</span>
            {skill.subcategory_name && <span className="hidden text-xs sm:inline" style={{ color }}>{skill.subcategory_name}</span>}
          </div>
          <p className="truncate text-sm text-muted">{skill.description}</p>
        </div>
        <span className="hidden w-44 truncate text-xs text-subtle md:block">{skill.repo_full_name}</span>
        <span className="hidden w-24 text-right text-xs text-subtle lg:block">{timeAgo(skill.first_seen_at)}</span>
        <StarCount value={skill.stars} className="w-16 justify-end text-sm" />
      </Link>
    </motion.li>
  )
})
