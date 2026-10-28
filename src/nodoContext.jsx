import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from "react"

/**
 * Estado compartido de Nodo, la mascota que recorre el sitio.
 *  - work: cuando estás en una categoría, subcategoría o skill, Nodo se viste de ayudante.
 *  - reaction: un gesto breve (celebrar al copiar, ponerse triste sin resultados…).
 *  - hidden: el visitante puede esconderlo; se recuerda en este navegador.
 */
const NodoContext = createContext({
  work: null,
  reaction: null,
  hidden: false,
  pushWork: () => {},
  popWork: () => {},
  react: () => {},
  setHidden: () => {},
})

const KEY = "skillverse-nodo-oculto"

function readHidden() {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function NodoProvider({ children }) {
  // pila: la ficha de una skill abierta en modal tapa a la categoría de fondo
  const [stack, setStack] = useState([])
  const pushWork = useCallback((entry) => setStack((s) => [...s.filter((e) => e.id !== entry.id), entry]), [])
  const popWork = useCallback((id) => setStack((s) => s.filter((e) => e.id !== id)), [])
  const work = stack.length ? stack[stack.length - 1] : null
  const [reaction, setReaction] = useState(null)
  const [hidden, setHiddenState] = useState(readHidden)

  const setHidden = useCallback((value) => {
    setHiddenState(value)
    try {
      localStorage.setItem(KEY, value ? "1" : "0")
    } catch { /* almacenamiento bloqueado */ }
  }, [])

  const react = useCallback((mood, message, ms = 2400) => {
    setReaction({ mood, message, ms, id: Date.now() + Math.random() })
  }, [])

  // la reacción se borra sola
  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(null), reaction.ms)
    return () => clearTimeout(t)
  }, [reaction])

  const value = useMemo(
    () => ({ work, pushWork, popWork, reaction, react, hidden, setHidden }),
    [work, pushWork, popWork, reaction, react, hidden, setHidden],
  )
  return <NodoContext.Provider value={value}>{children}</NodoContext.Provider>
}

export const useNodo = () => useContext(NodoContext)

/** Pone a Nodo en modo ayudante mientras el componente está en pantalla. */
export function useNodoWork(category, subcategory) {
  const { pushWork, popWork } = useNodo()
  const id = useId()
  useEffect(() => {
    if (!category) return
    pushWork({ id, category, subcategory: subcategory || null })
    return () => popWork(id)
  }, [id, category, subcategory, pushWork, popWork])
}
