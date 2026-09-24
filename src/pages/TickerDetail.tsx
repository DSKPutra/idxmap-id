import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Lock } from 'lucide-react'
import {
  Cell,
  Legend,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from 'recharts'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { classifyFreeFloatBand, LOW_FLOAT_WARNING_THRESHOLD } from '@/lib/freeFloat'
import { INVESTOR_TYPE_LABEL, useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatDateId, formatNumber, formatPercent } from '@/lib/utils'

interface BreakdownRow {
  investor_type: string
  local_foreign: 'L' | 'F'
  shares: number
  percentage: number
}

export function TickerDetail() {
  const { code = '' } = useParams()
  const { t, lang } = useI18n()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ticker-summary', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_ticker_summary')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['ticker-breakdown', code],
    queryFn: async (): Promise<{ rows: BreakdownRow[]; isFull: boolean }> => {
      const full = await supabase
        .from('ownership_breakdown')
        .select('investor_type, local_foreign, shares, percentage')
        .eq('ticker_code', code.toUpperCase())
        .order('percentage', { ascending: false })

      if (!full.error && full.data && full.data.length > 0) {
        return {
          isFull: true,
          rows: full.data.map((r) => ({ ...r, percentage: Number(r.percentage) })),
        }
      }

      const preview = await supabase
        .from('v_ownership_preview')
        .select('investor_type, local_foreign, shares, percentage')
        .eq('ticker_code', code.toUpperCase())
        .order('percentage', { ascending: false })
      if (preview.error) throw preview.error
      return {
        isFull: false,
        rows: (preview.data ?? []).map((r) => ({ ...r, percentage: Number(r.percentage) })),
      }
    },
  })

  if (summaryLoading)
    return (
      <div className="container py-16 text-center text-muted-foreground">{t('common.loading')}</div>
    )
  if (!summary)
    return (
      <div className="container py-16 text-center text-muted-foreground">
        {t('search.noResults')}
      </div>
    )

  const localPct = Number(summary.local_pct)
  const foreignPct = Number(summary.foreign_pct)
  const freeFloatPct = Number(summary.free_float_pct)
  const band = classifyFreeFloatBand(freeFloatPct)
  const isLowFloat = freeFloatPct < LOW_FLOAT_WARNING_THRESHOLD

  const pieData = [
    { name: t('ticker.local'), value: localPct, color: 'hsl(var(--local))' },
    { name: t('ticker.foreign'), value: foreignPct, color: 'hsl(var(--foreign))' },
  ]

  return (
    <div className="container py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl font-extrabold">{summary.code}</h1>
            {isLowFloat && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {t('float.warning')}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{summary.name}</p>
          {summary.sector && (
            <Badge variant="secondary" className="mt-2">
              {summary.sector}
            </Badge>
          )}
        </div>
        {summary.report_date && (
          <p className="text-sm text-muted-foreground">
            {t('ticker.reportDate')} {formatDateId(summary.report_date)}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ticker.freeFloat')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPercent(freeFloatPct, 1)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ticker.marketCap')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {summary.market_cap
              ? `Rp ${formatNumber(Math.round(summary.market_cap / 1_000_000_000))} M`
              : '-'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ticker.local')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatPercent(localPct, 1)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Float Band</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold capitalize">
            {band.replace('_', ' ')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('ticker.localForeign')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v: number) => formatPercent(v, 1)} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('ticker.holders')}</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
            {breakdown && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ticker.investor')}</TableHead>
                      <TableHead>{t('ticker.status')}</TableHead>
                      <TableHead className="text-right">{t('ticker.shares')}</TableHead>
                      <TableHead className="text-right">{t('ticker.percentage')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown.rows.map((row) => (
                      <TableRow key={`${row.investor_type}-${row.local_foreign}`}>
                        <TableCell>
                          {INVESTOR_TYPE_LABEL[row.investor_type]?.[lang] ?? row.investor_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.local_foreign === 'L' ? 'local' : 'foreign'}>
                            {row.local_foreign === 'L' ? t('ticker.local') : t('ticker.foreign')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(row.shares)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatPercent(row.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {!breakdown.isFull && (
                  <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
                    <Lock className="h-6 w-6 text-primary" />
                    <p className="font-semibold">{t('paywall.title')}</p>
                    <p className="max-w-sm text-sm text-muted-foreground">{t('paywall.desc')}</p>
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link to="/harga">{t('paywall.cta')}</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/masuk">{t('paywall.loginPrompt')}</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
