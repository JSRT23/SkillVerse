import { motion } from "motion/react"
import { Link, useLocation } from "react-router"
import { FileCode2, Sparkle } from "lucide-react"
import { CategoryIcon, StarCount, TrustBadge } from "./ui"
import { RepoAvatar } from "./RepoAvatar"

export default function SkillCard({ skill, index = 0, isNew = false }) {
  const location = useLocation()
  const color = skill.category_color ?? "#7B6CF6"

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.03, layout: { type: "spring", stiffness: 380, damping: 34 } }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link
        to={`/skill/${skill.slug}`}
        state={{ background: location }}
        className="panel relative flex h-full flex-col overflow-hidden p-5 transition-[border-color,box-shadow] duration-300 hover:border-[var(--c)] hover:shadow-[0_22px_60px_-20px_var(--c)]"
        style={{ "--c": `${color}aa` }}
      >
        {/* hilo de color de la categoría */}
        <span
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
          style={{ background: color }}
          aria-hidden
        />

        <div className="flex items-start justify-between gap-3">
          <motion.span whileHover={{ rotate: -8, scale: 1.08 }} className="inline-block">
            <CategoryIcon slug={skill.category_slug} color={color} size={18} boxed />
          </motion.span>
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="chip border-lagoon/50 bg-lagoon/10 text-lagoon">
                <Sparkle size={11} className="fill-lagoon" aria-hidden /> Nueva
              </span>
            )}
            <StarCount value={skill.stars} className="text-sm" />
          </div>
        </div>

        <h3 className="mt-4 break-words font-display text-lg font-semibold leading-snug">{skill.name}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-haze">
          {skill.description || "El autor no agregó una descripción."}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/60 pt-4">
          <span className="flex min-w-0 items-center gap-2 text-xs text-haze">
            <RepoAvatar skill={skill} size={22} />
            <span className="truncate">{skill.repo_full_name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {skill.has_scripts && (
              <span title="Incluye scripts" className="text-haze">
                <FileCode2 size={15} aria-label="Incluye scripts" />
              </span>
            )}
            <TrustBadge trust={skill.trust} />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}
