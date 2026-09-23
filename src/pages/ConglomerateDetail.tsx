import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatCompactNumber } from '@/lib/utils'

export function ConglomerateDetail() {
  const { slug = '' } = useParams()
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['conglomerate', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conglomerates')
        .select(
          'id, name, description, founder, conglomerate_members(role, ticker_code, tickers(name, sector, market_cap))',
        )
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  if (isLoading)
    return (
      <div className="container py-16 text-center text-muted-foreground">{t('common.loading')}</div>
    )
  if (!data)
    return (
      <div className="container py-16 text-center text-muted-foreground">
        {t('search.noResults')}
      </div>
    )

  const members = (data.conglomerate_members ?? []).map((m) => ({
    ticker_code: m.ticker_code as string,
    role: m.role as string,
    tickers: (Array.isArray(m.tickers) ? m.tickers[0] : m.tickers) as {
      name: string
      sector: string | null
      market_cap: number | null
    } | null,
  }))
  const core = members.filter((m) => m.role === 'core')
  const affiliates = members.filter((m) => m.role !== 'core')

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">{data.name}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{data.description}</p>
        {data.founder && (
          <p className="mt-1 text-sm text-muted-foreground">Pendiri: {data.founder}</p>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Emiten Inti</h2>
          <div className="space-y-3">
            {core.map((m) => (
              <MemberCard key={m.ticker_code} member={m} />
            ))}
            {core.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Afiliasi</h2>
          <div className="space-y-3">
            {affiliates.map((m) => (
              <MemberCard key={m.ticker_code} member={m} />
            ))}
            {affiliates.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberCard({
  member,
}: {
  member: {
    ticker_code: string
    role: string
    tickers: { name: string; sector: string | null; market_cap: number | null } | null
  }
}) {
  return (
    <Link to={`/ticker/${member.ticker_code}`}>
      <Card className="transition-colors hover:border-primary">
        <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
          <div>
            <CardTitle className="font-mono text-base">{member.ticker_code}</CardTitle>
            <p className="text-sm text-muted-foreground">{member.tickers?.name}</p>
          </div>
          {member.tickers?.sector && <Badge variant="outline">{member.tickers.sector}</Badge>}
        </CardHeader>
        {member.tickers?.market_cap && (
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Kap. Pasar: Rp {formatCompactNumber(member.tickers.market_cap)}
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
