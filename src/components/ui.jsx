import { useEffect, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react"
import { BadgeCheck, Check, Copy, ShieldCheck, Star, Users } from "lucide-react"
import { categoryMeta } from "../lib/categories"
import { formatCompact, formatNumber } from "../lib/format"

/** Icono de categoría en una pastilla con su color. */
export function CategoryIcon({ slug, color = "#7C5CFF", size = 18, boxed = false, className = "" }) {
  const Icon = categoryMeta(slug).icon
  if (!boxed) return <Icon size={size} className={className} style={{ color }} aria-hidden />
  const box = Math.round(size * 2.1)
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-[12px] ${className}`}
      style={{
        width: box, height: box, color,
        background: `linear-gradient(145deg, ${color}2e, ${color}12)`,
        boxShadow: `inset 0 0 0 1px ${color}40, 0 6px 16px -8px ${color}`,
      }}
      aria-hidden
    >
      <Icon size={size} />
    </span>
  )
}

export function StarCount({ value, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${className}`} title={`${formatNumber(value)} estrellas en GitHub`}>
      <Star size={13} className="fill-amber text-amber" aria-hidden />
      {formatCompact(value)}
    </span>
  )
}

const TRUST = {
  official: { label: "Oficial", icon: ShieldCheck, cls: "border-teal/40 bg-teal/10 text-teal", hint: "Publicada por Anthropic" },
  verified: { label: "Verificada", icon: BadgeCheck, cls: "border-brand/40 bg-brand/10 text-brand", hint: "Publicada por una organización reconocida" },
  community: { label: "Comunidad", icon: Users, cls: "border-line bg-soft text-muted", hint: "Publicada por la comunidad" },
}

export function TrustBadge({ trust, className = "" }) {
  const t = TRUST[trust] ?? TRUST.community
  const Icon = t.icon
  return (
    <span className={`chip ${t.cls} ${className}`} title={t.hint}>
      <Icon size={12} aria-hidden /> {t.label}
    </span>
  )
}

export function CopyButton({ text, label = "Copiar", className = "", onCopied }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 1600)
    } catch { /* el navegador bloqueó el portapapeles */ }
  }
  return (
    <button type="button" onClick={copy} className={`btn-icon h-9 w-9 ${copied ? "border-teal/60 text-teal" : ""} ${className}`} aria-label={copied ? "Copiado" : label} title={copied ? "Copiado" : label}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
            <Check size={15} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy size={14} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export function CommandLine({ command, className = "" }) {
  return (
    <div className={`group flex items-center gap-3 rounded-2xl border border-line bg-[#0c0a20] py-1.5 pl-4 pr-1.5 ${className}`}>
      <span className="select-none font-mono text-sm text-teal" aria-hidden>$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1.5 font-mono text-[13px] text-[#f3f1ff] [scrollbar-width:none]">{command}</code>
      <CopyButton text={command} label="Copiar comando" className="border-white/10 bg-white/5 text-[#a7a2d0] hover:text-white" />
    </div>
  )
}

export function SectionHeader({ title, description, action, className = "" }) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-2xl">
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-[22px] bg-soft ${className}`} />
}

/** Número que cuenta hacia arriba cuando entra en pantalla. */
export function AnimatedNumber({ value = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (reduced) { setDisplay(value); return }
    const controls = animate(display, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(Math.round(v)) })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduced])
  return <span ref={ref} className={`tabular-nums ${className}`}>{formatNumber(display)}</span>
}

export function Kbd({ children }) {
  return <kbd className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>
}
