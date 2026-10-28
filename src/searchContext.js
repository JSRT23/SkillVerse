import { createContext, useContext } from "react"

export const SearchContext = createContext(() => {})

/** Devuelve la función que abre el buscador rápido (Ctrl+K). */
export const useSearch = () => useContext(SearchContext)
