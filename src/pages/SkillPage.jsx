import { useParams, Link } from "react-router"
import { motion } from "motion/react"
import SkillDetail from "../components/SkillDetail"
import SkillCard from "../components/SkillCard"
import { Skeleton } from "../components/ui"
import { useCatalog } from "../hooks/useCatalog"
import NotFound from "./NotFound"

export function useSkill(slug) {
  const query = useCatalog()
  const skill = query.data?.find((s) => s.slug === slug)
  return { ...query, skill }
}

/** Ficha completa cuando se entra directo por la URL (enlace compartido). */
export default function SkillPage() {
  const { slug } = useParams()
  const { skill, isLoading, data = [] } = useSkill(slug)

  if (isLoading) {
    return (
      <div className="container-page max-w-4xl space-y-4 pt-10">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  if (!skill) return <NotFound what="skill" />

  const related = data.filter((s) => s.category_slug === skill.category_slug && s.id !== skill.id).slice(0, 3)

  return (
    <div className="container-page max-w-5xl pt-8">
      <Link to="/explorar" className="text-sm font-semibold text-haze hover:text-silk">Volver al explorador</Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel mt-6 p-6 sm:p-10">
        <SkillDetail skill={skill} />
      </motion.div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title">Más de {skill.category_name}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s, i) => <SkillCard key={s.id} skill={s} index={i} />)}
          </div>
        </section>
      )}
    </div>
  )
}
