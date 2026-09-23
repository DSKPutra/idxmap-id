import { useQuery } from '@tanstack/react-query'
import { Search, TrendingUp, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  className?: string
  autoFocus?: boolean
}

export function SearchBar({ className, autoFocus }: SearchBarProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(query, 200)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: async () => {
      const q = debounced.trim()
      if (q.length < 2) return { tickers: [], investors: [] }

      const [tickerRes, investorRes] = await Promise.all([
        supabase.from('v_ticker_summary').select('code, name').ilike('code', `${q}%`).limit(5),
        supabase.from('investors').select('id, name, type').ilike('name', `%${q}%`).limit(5),
      ])

      if (q.length >= 2) {
        supabase
          .from('search_logs')
          .insert({
            query: q,
            query_type: tickerRes.data?.length
              ? 'ticker'
              : investorRes.data?.length
                ? 'investor'
                : 'other',
          })
          .then(() => {})
      }

      return { tickers: tickerRes.data ?? [], investors: investorRes.data ?? [] }
    },
    enabled: debounced.trim().length >= 2,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasResults = (data?.tickers.length ?? 0) > 0 || (data?.investors.length ?? 0) > 0

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('search.placeholder')}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {open && debounced.trim().length >= 2 && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {isFetching && (
            <div className="p-3 text-sm text-muted-foreground">{t('common.loading')}</div>
          )}
          {!isFetching && !hasResults && (
            <div className="p-3 text-sm text-muted-foreground">{t('search.noResults')}</div>
          )}
          {!isFetching && data && data.tickers.length > 0 && (
            <div>
              <div className="bg-muted px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                {t('search.tickers')}
              </div>
              {data.tickers.map((tk) => (
                <button
                  key={tk.code}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  onClick={() => {
                    navigate(`/ticker/${tk.code}`)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold">{tk.code}</span>
                  <span className="truncate text-muted-foreground">{tk.name}</span>
                </button>
              ))}
            </div>
          )}
          {!isFetching && data && data.investors.length > 0 && (
            <div>
              <div className="bg-muted px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                {t('search.investors')}
              </div>
              {data.investors.map((inv) => (
                <button
                  key={inv.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  onClick={() => {
                    navigate(`/investor/${inv.id}`)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <UserIcon className="h-4 w-4 text-accent" />
                  <span className="truncate">{inv.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
