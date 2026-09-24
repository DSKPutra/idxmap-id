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
// `p` holds the path+query that came after the repo base (see public/404.html);
// re-prefix it with BASE_URL so BrowserRouter's basename matches correctly.
// A no-op on every other host, which never sets `p` in the first place.
;(function decodeGithubPagesRedirect() {
  const params = new URLSearchParams(window.location.search)
  const encodedPath = params.get('p')
  if (encodedPath === null) return

  const decoded = decodeURIComponent(encodedPath)
  const queryIndex = decoded.indexOf('?')
  const pathPart = queryIndex === -1 ? decoded : decoded.slice(0, queryIndex)
  const searchPart = queryIndex === -1 ? '' : decoded.slice(queryIndex)

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  window.history.replaceState(null, '', base + pathPart + searchPart + window.location.hash)
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
