import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export function HotSearches() {
  const { t } = useI18n()
  const { data } = useQuery({
    queryKey: ['hot-searches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_hot_searches')
        .select('query, query_type, search_count')
      if (error) throw error
      return data
    },
  })

  if (!data || data.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Flame className="h-4 w-4 text-accent" />
        {t('hotSearches.title')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {data.map((row) => (
          <Link
            key={`${row.query_type}-${row.query}`}
            to={row.query_type === 'ticker' ? `/ticker/${row.query.toUpperCase()}` : '/'}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
          >
            {row.query} <span className="text-primary">· {row.search_count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
