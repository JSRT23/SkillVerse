const compact = new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("es")
const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

export const formatCompact = (n) => compact.format(n ?? 0)
export const formatNumber = (n) => full.format(n ?? 0)

export function timeAgo(date) {
  if (!date) return ""
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  const units = [
    ["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return "hace un momento"
}

/** Quita acentos y pasa a minúsculas para comparar textos. */
export const normalize = (s) =>
  (s ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Puntuación simple de coincidencia: nombre pesa más que descripción. */
export function matchScore(skill, query) {
  const q = normalize(query).trim()
  if (!q) return 1
  const terms = q.split(/\s+/)
  const name = normalize(skill.name)
  const hay = `${name} ${normalize(skill.description)} ${normalize(skill.repo_full_name)} ${normalize(skill.category_name)}`
  let score = 0
  for (const t of terms) {
    if (!hay.includes(t)) return 0
    score += name.includes(t) ? (name.startsWith(t) ? 6 : 4) : 1
  }
  return score
}
