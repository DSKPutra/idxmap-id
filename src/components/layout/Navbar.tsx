import { Globe, LogOut, Map, Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SearchBar } from '@/components/SearchBar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

const NAV_LINKS: {
  to: string
  key:
    | 'nav.conglomerates'
    | 'nav.network'
    | 'nav.localForeign'
    | 'nav.mutualFunds'
    | 'nav.floatScreener'
    | 'nav.heatmap'
    | 'nav.aiQa'
}[] = [
  { to: '/konglomerasi', key: 'nav.conglomerates' },
  { to: '/jaringan', key: 'nav.network' },
  { to: '/lokal-asing', key: 'nav.localForeign' },
  { to: '/reksa-dana', key: 'nav.mutualFunds' },
  { to: '/float-screener', key: 'nav.floatScreener' },
  { to: '/heatmap', key: 'nav.heatmap' },
  { to: '/tanya', key: 'nav.aiQa' },
]

export function Navbar() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold">
          <Map className="h-6 w-6 text-primary" />
          <span>IDXMap.ID</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground',
                  isActive && 'bg-secondary text-foreground',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            title="ID / EN"
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Tema">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-1 h-4 w-4" />
              {t('nav.logout')}
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/masuk">{t('nav.login')}</Link>
            </Button>
          )}
        </div>

        <button
          className="ml-auto p-2 lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container flex flex-col gap-3 py-4">
            <SearchBar autoFocus />
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-secondary' : 'text-muted-foreground',
                    )
                  }
                >
                  {t(link.key)}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              >
                <Globe className="mr-1 h-4 w-4" />
                {lang.toUpperCase()}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="mr-1 h-4 w-4" />
                ) : (
                  <Moon className="mr-1 h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              {user ? (
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  {t('nav.logout')}
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/masuk" onClick={() => setMobileOpen(false)}>
                    {t('nav.login')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
