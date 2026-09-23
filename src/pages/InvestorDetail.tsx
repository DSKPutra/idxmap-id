import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
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
import { INVESTOR_TYPE_LABEL, useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatNumber, formatPercent } from '@/lib/utils'

interface PortfolioRow {
  ticker_code: string
  ticker_name: string
  shares: number
  percentage: number
}

export function InvestorDetail() {
  const { id = '' } = useParams()
  const { t, lang } = useI18n()

  const { data: investor, isLoading: investorLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['investor-portfolio', id],
    queryFn: async (): Promise<{ rows: PortfolioRow[]; isFull: boolean }> => {
      const full = await supabase
        .from('holdings')
        .select('shares, percentage, ticker_code, tickers(name)')
        .eq('investor_id', id)
        .order('percentage', { ascending: false })

      if (!full.error && full.data && full.data.length > 0) {
        return {
          isFull: true,
          rows: full.data.map((h) => ({
            ticker_code: h.ticker_code,
            ticker_name: (h.tickers as unknown as { name: string })?.name ?? h.ticker_code,
            shares: h.shares,
            percentage: Number(h.percentage),
          })),
        }
      }

      const preview = await supabase
        .from('v_holdings_preview')
        .select('ticker_code, shares, percentage')
        .eq('investor_id', id)
        .order('percentage', { ascending: false })
      if (preview.error) throw preview.error
      return {
        isFull: false,
        rows: (preview.data ?? []).map((r) => ({
          ...r,
          ticker_name: r.ticker_code,
          percentage: Number(r.percentage),
        })),
      }
    },
    enabled: Boolean(id),
  })

  if (investorLoading)
    return (
      <div className="container py-16 text-center text-muted-foreground">{t('common.loading')}</div>
    )
  if (!investor)
    return (
      <div className="container py-16 text-center text-muted-foreground">
        {t('search.noResults')}
      </div>
    )

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">{investor.name}</h1>
        <div className="mt-3 flex gap-2">
          <Badge variant="secondary">
            {INVESTOR_TYPE_LABEL[investor.type]?.[lang] ?? investor.type}
          </Badge>
          <Badge variant={investor.local_foreign === 'L' ? 'local' : 'foreign'}>
            {investor.local_foreign === 'L' ? t('ticker.local') : t('ticker.foreign')}
          </Badge>
          {investor.nationality && <Badge variant="outline">{investor.nationality}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portofolio</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
          {portfolio && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">{t('ticker.shares')}</TableHead>
                    <TableHead className="text-right">{t('ticker.percentage')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.rows.map((row) => (
                    <TableRow key={row.ticker_code}>
                      <TableCell>
                        <Link
                          to={`/ticker/${row.ticker_code}`}
                          className="font-mono font-semibold hover:text-primary hover:underline"
                        >
                          {row.ticker_code}
                        </Link>
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

              {!portfolio.isFull && portfolio.rows.length > 0 && (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
                  <Lock className="h-6 w-6 text-primary" />
                  <p className="font-semibold">{t('paywall.title')}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t('paywall.desc')}</p>
                  <Button asChild>
                    <Link to="/harga">{t('paywall.cta')}</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
