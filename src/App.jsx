import { Suspense, lazy, useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router"
import { Footer, Navbar } from "./components/Layout"
import CommandPalette from "./components/CommandPalette"
import Modal from "./components/Modal"
import Nodo from "./components/Nodo"
import NodoRoamer from "./components/NodoRoamer"
import SkillDetail from "./components/SkillDetail"
import Toasts from "./components/Toasts"
import { Skeleton } from "./components/ui"
import { useSkill } from "./hooks/useCatalog"
import { useRealtime } from "./hooks/useRealtime"
import { SearchContext } from "./searchContext"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"

const Explore = lazy(() => import("./pages/Explore"))
const Categories = lazy(() => import("./pages/Categories").then((m) => ({ default: m.Categories })))
const Category = lazy(() => import("./pages/Categories").then((m) => ({ default: m.Category })))
const SkillPage = lazy(() => import("./pages/SkillPage"))
const Guide = lazy(() => import("./pages/Guide"))
const NodoPage = lazy(() => import("./pages/NodoPage"))

/** Ficha de una skill abierta como modal sobre la página donde estabas. */
function SkillModal() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: skill, isLoading } = useSkill(slug)
  const close = useCallback(() => navigate(-1), [navigate])

  return (
    <Modal onClose={close} label={skill ? `Skill ${skill.name}` : "Skill"}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading && (
          <div className="space-y-4 p-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-64" />
          </div>
        )}
        {!isLoading && !skill && <NotFound what="skill" />}
        {skill && <SkillDetail skill={skill} inModal />}
      </div>
    </Modal>
  )
}

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Nodo size={120} mood="thinking" title="Cargando" />
    </div>
  )
}

function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </motion.main>
  )
}

export default function App() {
  const location = useLocation()
  const background = location.state?.background
  const [searchOpen, setSearchOpen] = useState(false)
  const { toast, dismiss, newIds } = useRealtime()
  const openSearch = useCallback(() => setSearchOpen(true), [])

  // Ctrl/⌘ + K o "/" abren el buscador
  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Al cambiar de página (no al abrir un modal) vuelve arriba
  const pageLocation = background ?? location
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 })
  }, [pageLocation.pathname, location.hash])

  return (
    <SearchContext.Provider value={openSearch}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-night">
        Saltar al contenido
      </a>
      <Navbar onSearch={openSearch} />
      <div id="contenido" className="min-h-[70vh]">
        <AnimatePresence mode="wait">
          <Routes location={pageLocation} key={pageLocation.pathname}>
            <Route path="/" element={<Page><Home newIds={newIds} /></Page>} />
            <Route path="/explorar" element={<Page><Explore newIds={newIds} /></Page>} />
            <Route path="/categorias" element={<Page><Categories /></Page>} />
            <Route path="/categoria/:slug" element={<Page><Category newIds={newIds} /></Page>} />
            <Route path="/skill/:slug" element={<Page><SkillPage /></Page>} />
            <Route path="/guia" element={<Page><Guide /></Page>} />
            <Route path="/nodo" element={<Page><NodoPage /></Page>} />
            <Route path="/ocho" element={<Navigate to="/nodo" replace />} />
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Routes>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {background && (
          <Routes location={location} key={location.pathname}>
            <Route path="/skill/:slug" element={<SkillModal />} />
          </Routes>
        )}
      </AnimatePresence>

      <Footer />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toasts toast={toast} onDismiss={dismiss} />
      <NodoRoamer />
    </SearchContext.Provider>
  )
}
