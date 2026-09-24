import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { INVESTOR_TYPE_LABEL, useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatPercent } from '@/lib/utils'

export function LocalForeign() {
  const { t, lang } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['local-foreign-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_local_foreign_overview').select('*')
      if (error) throw error
      return data
    },
  })

  const chartData = data?.map((row) => ({
    type: `${INVESTOR_TYPE_LABEL[row.investor_type]?.[lang] ?? row.investor_type} (${row.local_foreign})`,
    pct: Number(row.total_pct),
  }))

  const totalLocal =
    data?.filter((d) => d.local_foreign === 'L').reduce((s, d) => s + Number(d.total_pct), 0) ?? 0
  const totalForeign =
    data?.filter((d) => d.local_foreign === 'F').reduce((s, d) => s + Number(d.total_pct), 0) ?? 0
  const tickerCount = data?.[0] ? Math.max(...data.map((d) => d.ticker_count)) : 0

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t('localForeign.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('localForeign.subtitle')}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ticker.local')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold" style={{ color: 'hsl(var(--local))' }}>
            {formatPercent(totalLocal / (tickerCount || 1), 1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ticker.foreign')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold" style={{ color: 'hsl(var(--foreign))' }}>
            {formatPercent(totalForeign / (tickerCount || 1), 1)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribusi per Tipe Investor</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
          {chartData && (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="type" width={160} tick={{ fontSize: 12 }} />
                <ReTooltip formatter={(v: number) => formatPercent(v, 2)} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('ticker.type')}</TableHead>
                <TableHead>{t('ticker.status')}</TableHead>
                <TableHead className="text-right">Jumlah Ticker</TableHead>
                <TableHead className="text-right">Total %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((row) => (
                <TableRow key={`${row.investor_type}-${row.local_foreign}`}>
                  <TableCell>
                    {INVESTOR_TYPE_LABEL[row.investor_type]?.[lang] ?? row.investor_type}
                  </TableCell>
                  <TableCell>
                    {row.local_foreign === 'L' ? t('ticker.local') : t('ticker.foreign')}
                  </TableCell>
                  <TableCell className="text-right">{row.ticker_count}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercent(Number(row.total_pct), 2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
