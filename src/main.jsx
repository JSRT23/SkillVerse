import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import App from "./App"
import { ThemeProvider } from "./theme"
import { NodoProvider } from "./nodoContext"
import "@fontsource-variable/bricolage-grotesque"
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <NodoProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NodoProvider>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)
