import { Link, useParams } from "react-router"
import { motion } from "motion/react"
import { ChevronLeft } from "lucide-react"
import SkillDetail from "../components/SkillDetail"
import { Skeleton } from "../components/ui"
import { useSkill } from "../hooks/useCatalog"
import NotFound from "./NotFound"

/** Ficha completa cuando se entra directo por la URL (enlace compartido). */
export default function SkillPage() {
  const { slug } = useParams()
  const { data: skill, isLoading } = useSkill(slug)

  if (isLoading) {
    return (
      <div className="container-page max-w-6xl space-y-4 pt-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72" />
      </div>
    )
  }
  if (!skill) return <NotFound what="skill" />

  return (
    <div className="container-page max-w-6xl pt-8">
      <Link to="/explorar" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ChevronLeft size={15} aria-hidden /> Explorar</Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.22, 1, 0.36, 1] }} className="card mt-5 overflow-hidden">
        <SkillDetail skill={skill} />
      </motion.div>
    </div>
  )
}
