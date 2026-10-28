import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { flushSync } from "react-dom"

const ThemeContext = createContext({ theme: "night", toggle: () => {} })
const KEY = "skillverse-theme"

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === "day" || saved === "night") return saved
  } catch { /* almacenamiento bloqueado */ }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "day" : "night"
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || initialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "day" ? "#F6F5FC" : "#0C0A20")
    try { localStorage.setItem(KEY, theme) } catch { /* sin almacenamiento */ }
  }, [theme])

  /** Cambia el tema con un círculo que se expande desde el botón (View Transitions API). */
  const toggle = useCallback((event) => {
    const next = theme === "day" ? "night" : "day"
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (!document.startViewTransition || reduced) { setTheme(next); return }

    const x = event?.clientX ?? window.innerWidth - 60
    const y = event?.clientY ?? 32
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next))
      document.documentElement.dataset.theme = next
    })
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      )
    })
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
