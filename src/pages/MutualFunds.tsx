import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatPercent } from '@/lib/utils'

export function MutualFunds() {
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['mutual-funds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_mutual_fund_positions')
        .select('*')
        .order('position_count', { ascending: false })
      if (error) throw error
      return data
    },
  })

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t('mutualFunds.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('mutualFunds.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('ticker.investor')}</TableHead>
                <TableHead className="text-right">{t('mutualFunds.positions')}</TableHead>
                <TableHead>{t('mutualFunds.topHolding')}</TableHead>
                <TableHead className="text-right">{t('ticker.percentage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((row) => (
                <TableRow key={row.investor_id}>
                  <TableCell>
                    <Link
                      to={`/investor/${row.investor_id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.investor_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{row.position_count}</TableCell>
                  <TableCell>
                    {row.top_holding_ticker && (
                      <Link
                        to={`/ticker/${row.top_holding_ticker}`}
                        className="font-mono font-semibold hover:text-primary hover:underline"
                      >
                        {row.top_holding_ticker}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.top_holding_pct ? formatPercent(Number(row.top_holding_pct)) : '-'}
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
