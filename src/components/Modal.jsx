import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { X } from "lucide-react"

/** Modal accesible: Esc para cerrar, foco atrapado, scroll del fondo bloqueado. */
export default function Modal({ onClose, label, children, width = "max-w-3xl", align = "center" }) {
  const panel = useRef(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const prevFocus = document.activeElement
    // Respeta el foco si un hijo ya lo tomó (por ejemplo, el campo del buscador)
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()

    const onKey = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
      prevFocus?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center overflow-y-auto p-3 sm:p-6 ${align === "top" ? "items-start pt-[10vh]" : "items-start sm:items-center"}`}>
      <motion.div
        className="fixed inset-0 bg-ink-deep/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className={`relative w-full ${align === "top" ? "" : "my-auto"} ${width} rounded-[28px] border border-line bg-dusk shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),var(--shadow-glow)] outline-none`}
      >
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ rotate: 90 }}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-dusk-2 text-haze hover:text-silk cursor-pointer"
          aria-label="Cerrar"
        >
          <X size={18} />
        </motion.button>
        {children}
      </motion.div>
    </div>,
    document.body,
  )
}
