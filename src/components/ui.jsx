import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, ShieldCheck, Star, Users } from "lucide-react"
import { categoryMeta } from "../lib/categories"
import { formatCompact } from "../lib/format"

export function CategoryIcon({ slug, color, size = 18, className = "", boxed = false }) {
  const Icon = categoryMeta(slug).icon
  if (!boxed) return <Icon size={size} className={className} style={{ color }} aria-hidden />
  return (
    <span
      className={`inline-grid place-items-center rounded-xl ${className}`}
      style={{ background: `${color}22`, color, width: size * 2, height: size * 2, boxShadow: `inset 0 0 0 1px ${color}44` }}
      aria-hidden
    >
      <Icon size={size} />
    </span>
  )
}

export function StarCount({ value, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-amber ${className}`} title={`${value} estrellas en GitHub`}>
      <Star size={14} className="fill-amber" aria-hidden />
      {formatCompact(value)}
    </span>
  )
}

const TRUST = {
  official: { label: "Oficial", icon: ShieldCheck, cls: "border-lagoon/50 bg-lagoon/10 text-lagoon" },
  verified: { label: "Verificada", icon: ShieldCheck, cls: "border-violet/50 bg-violet/10 text-violet" },
  community: { label: "Comunidad", icon: Users, cls: "border-line bg-dusk-2/60 text-haze" },
}

export function TrustBadge({ trust, className = "" }) {
  const t = TRUST[trust] ?? TRUST.community
  const Icon = t.icon
  return (
    <span className={`chip ${t.cls} ${className}`}>
      <Icon size={12} aria-hidden /> {t.label}
    </span>
  )
}

export function CopyButton({ text, label = "Copiar", className = "" }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* el navegador bloqueó el portapapeles */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`relative inline-grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-dusk-2 text-haze transition-colors hover:border-amber hover:text-amber cursor-pointer ${className}`}
      aria-label={copied ? "Copiado" : label}
      title={copied ? "Copiado" : label}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
            <Check size={16} className="text-lagoon" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy size={15} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export function CommandLine({ command }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink-deep/80 py-2 pl-4 pr-2">
      <span className="select-none font-mono text-sm text-lagoon" aria-hidden>$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-silk">{command}</code>
      <CopyButton text={command} label="Copiar comando" />
    </div>
  )
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-2 text-haze">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-[18px] bg-dusk/80 ${className}`} />
}
