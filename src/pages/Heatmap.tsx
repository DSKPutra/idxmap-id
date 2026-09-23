import { useQuery } from '@tanstack/react-query'
import { Heatmap as HeatmapChart } from '@/components/charts/Heatmap'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export function Heatmap() {
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: async () => {
      const { data: latest } = await supabase
        .from('prices')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!latest) return []

      const { data: rows, error } = await supabase
        .from('prices')
        .select('ticker_code, change_pct, tickers(sector, market_cap)')
        .eq('date', latest.date)
      if (error) throw error

      return (rows ?? [])
        .filter((r) => r.tickers)
        .map((r) => ({
          code: r.ticker_code,
          sector: (r.tickers as unknown as { sector: string | null }).sector ?? 'Lainnya',
          marketCap: (r.tickers as unknown as { market_cap: number | null }).market_cap ?? 1,
          changePct: Number(r.change_pct ?? 0),
        }))
    },
  })

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t('heatmap.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('heatmap.subtitle')}</p>
        <Badge variant="outline" className="mt-3">
          {t('heatmap.dataLabel')}
        </Badge>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}
          {data && data.length > 0 && <HeatmapChart data={data} />}
          {data && data.length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada data harga EOD.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
