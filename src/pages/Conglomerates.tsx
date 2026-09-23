import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export function Conglomerates() {
  const { t } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['conglomerates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conglomerates')
        .select('id, slug, name, description, founder, conglomerate_members(ticker_code)')
        .order('name')
      if (error) throw error
      return data
    },
  })

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold">{t('conglomerates.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('conglomerates.subtitle')}</p>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <Link key={c.id} to={`/konglomerasi/${c.slug}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <Building2 className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {c.conglomerate_members?.slice(0, 6).map((m) => (
                    <Badge key={m.ticker_code} variant="secondary" className="font-mono">
                      {m.ticker_code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
