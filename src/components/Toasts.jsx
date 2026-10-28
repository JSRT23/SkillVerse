import { AnimatePresence, motion } from "motion/react"
import { Link, useLocation } from "react-router"
import { X } from "lucide-react"
import Nodo from "./Nodo"
import { formatNumber } from "../lib/format"

export default function Toasts({ toast, onDismiss }) {
  const location = useLocation()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[min(92vw,380px)]" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="shell pointer-events-auto flex items-center gap-3 rounded-[22px] border border-line bg-elev p-3 pr-2 text-fg shadow-[0_24px_60px_-20px_rgb(4_3_18/0.9)]"
          >
            <Nodo size={58} mood="surprised" title="" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-teal">
                {toast.count > 1 ? `${formatNumber(toast.count)} skills nuevas en el catálogo` : "Nueva skill en el catálogo"}
              </p>
              <Link
                to={`/skill/${toast.latest.slug}`}
                state={{ background: location }}
                onClick={onDismiss}
                className="block truncate font-semibold hover:text-amber"
              >
                {toast.count > 1 ? `La más reciente: ${toast.latest.name}` : toast.latest.name}
              </Link>
            </div>
            <button type="button" onClick={onDismiss} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg cursor-pointer" aria-label="Cerrar aviso">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
