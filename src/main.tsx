import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AuthProvider } from './hooks/useAuth'
import { I18nProvider } from './lib/i18n'
import { queryClient } from './lib/queryClient'
import './index.css'

// Undo the /404.html query-string trick used for SPA routing on GitHub
// Pages (no server-side rewrites there) before React Router reads the URL.
;(function decodeGithubPagesRedirect() {
  const params = new URLSearchParams(window.location.search)
  const encodedPath = params.get('p')
  if (!encodedPath) return
  const restoredSearch = params.get('q') ? `?${params.get('q')!.replace(/~and~/g, '&')}` : ''
  const restoredPath = encodedPath.replace(/~and~/g, '&')
  window.history.replaceState(null, '', restoredPath + restoredSearch + window.location.hash)
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <TooltipProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
