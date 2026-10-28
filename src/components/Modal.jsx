import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { X } from "lucide-react"

/**
 * Modal accesible: Esc para cerrar, foco atrapado y scroll del fondo bloqueado.
 * En pantallas chicas se comporta como una hoja que sube desde abajo.
 */
export default function Modal({ onClose, label, children, width = "max-w-5xl", align = "center", closeButton = true }) {
  const panel = useRef(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const prevFocus = document.activeElement
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()

    const onKey = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  const top = align === "top"

  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center ${top ? "items-start p-3 pt-[9vh] sm:p-6 sm:pt-[11vh]" : "items-end sm:items-center sm:p-6"}`}>
      <motion.div
        className="absolute inset-0 bg-[#07061a]/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        initial={{ opacity: 0, y: top ? -12 : 48, scale: top ? 0.98 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: top ? -8 : 32, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className={`relative flex w-full ${width} flex-col overflow-hidden border border-line bg-elev text-fg outline-none
          shadow-[0_50px_140px_-30px_rgb(4_3_18/0.85)]
          ${top ? "max-h-[80dvh] rounded-[24px]" : "max-h-[94dvh] rounded-t-[28px] sm:max-h-[90dvh] sm:rounded-[28px]"}`}
      >
        {!top && <span className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />}
        {closeButton && (
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="btn-icon absolute right-4 top-4 z-20 bg-elev/80 backdrop-blur"
            aria-label="Cerrar"
          >
            <X size={18} />
          </motion.button>
        )}
        {children}
      </motion.div>
    </div>,
    document.body,
  )
}
