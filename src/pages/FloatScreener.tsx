import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  classifyFreeFloatBand,
  LOW_FLOAT_WARNING_THRESHOLD,
  type FreeFloatBand,
} from '@/lib/freeFloat'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn, formatCompactNumber, formatPercent } from '@/lib/utils'

type SortKey = 'code' | 'market_cap' | 'free_float_pct' | 'holder_count'

const FILTERS: {
  value: FreeFloatBand | 'all'
  labelKey:
    | 'float.filterAll'
    | 'float.filterVeryLow'
    | 'float.filterLow'
    | 'float.filterMedium'
    | 'float.filterHigh'
}[] = [
  { value: 'all', labelKey: 'float.filterAll' },
  { value: 'sangat_rendah', labelKey: 'float.filterVeryLow' },
  { value: 'rendah', labelKey: 'float.filterLow' },
  { value: 'menengah', labelKey: 'float.filterMedium' },
  { value: 'tinggi', labelKey: 'float.filterHigh' },
]

export function FloatScreener() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<FreeFloatBand | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('free_float_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading } = useQuery({
    queryKey: ['float-screener'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_ticker_summary').select('*')
      if (error) throw error
      return data
    },
  })

  const rows = useMemo(() => {
    if (!data) return []
    let filtered = data.map((d) => ({
      ...d,
      band: classifyFreeFloatBand(Number(d.free_float_pct)),
    }))
    if (filter !== 'all') filtered = filtered.filter((d) => d.band === filter)
    return filtered.sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : Number(av) - Number(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, filter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t('float.title')}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{t('float.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {t(f.labelKey)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Ticker"
                  active={sortKey === 'code'}
                  onClick={() => toggleSort('code')}
                />
                <TableHead>{t('ticker.sector')}</TableHead>
                <SortableHead
                  label={t('ticker.marketCap')}
                  active={sortKey === 'market_cap'}
                  onClick={() => toggleSort('market_cap')}
                  align="right"
                />
                <SortableHead
                  label={t('ticker.holders')}
                  active={sortKey === 'holder_count'}
                  onClick={() => toggleSort('holder_count')}
                  align="right"
                />
                <SortableHead
                  label={t('ticker.freeFloat')}
                  active={sortKey === 'free_float_pct'}
                  onClick={() => toggleSort('free_float_pct')}
                  align="right"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isLow = Number(row.free_float_pct) < LOW_FLOAT_WARNING_THRESHOLD
                return (
                  <TableRow key={row.code}>
                    <TableCell>
                      <Link
                        to={`/ticker/${row.code}`}
                        className="font-mono font-semibold hover:text-primary hover:underline"
                      >
                        {row.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.sector}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.market_cap ? formatCompactNumber(row.market_cap) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{row.holder_count}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-semibold',
                        isLow && 'text-destructive',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {isLow && <AlertTriangle className="h-3 w-3" />}
                        {formatPercent(Number(row.free_float_pct), 1)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SortableHead({
  label,
  active,
  onClick,
  align,
}: {
  label: string
  active: boolean
  onClick: () => void
  align?: 'right'
}) {
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active && 'text-foreground',
        )}
        onClick={onClick}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  )
}
