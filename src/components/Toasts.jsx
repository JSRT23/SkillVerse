import { AnimatePresence, motion } from "motion/react"
import { Link, useLocation } from "react-router"
import { X } from "lucide-react"
import Mascot from "./Mascot"

export default function Toasts({ toasts, onDismiss }) {
  const location = useLocation()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-3" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto panel flex items-center gap-3 p-3 pr-2"
          >
            <Mascot size={52} mood="happy" outfit="party" accent="#38D6C4" bob={false} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-lagoon">Nueva skill en el catálogo</p>
              <Link to={`/skill/${t.slug}`} state={{ background: location }} className="block truncate font-semibold hover:text-amber" onClick={() => onDismiss(t.id)}>
                {t.name}
              </Link>
            </div>
            <button type="button" onClick={() => onDismiss(t.id)} className="grid h-8 w-8 place-items-center rounded-full text-haze hover:bg-dusk-2 hover:text-silk cursor-pointer" aria-label="Cerrar aviso">
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
