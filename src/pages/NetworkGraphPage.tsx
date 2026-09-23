import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraphLink, GraphNode, NetworkGraph } from '@/components/charts/NetworkGraph'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

interface RawEdge {
  ticker_code: string
  investor_id: string
  investor_name: string
  percentage: number
}

export function NetworkGraphPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [focalTicker, setFocalTicker] = useState<string>('')
  const [depth, setDepth] = useState<1 | 2>(1)

  const { data: tickers } = useQuery({
    queryKey: ['network-tickers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tickers').select('code').order('code')
      if (error) throw error
      return data
    },
  })

  const { data: edges, isLoading } = useQuery({
    queryKey: ['network-edges'],
    queryFn: async (): Promise<RawEdge[]> => {
      const full = await supabase
        .from('holdings')
        .select('ticker_code, investor_id, percentage, investors(name)')
      const source = !full.error && full.data && full.data.length > 0 ? full.data : null

      if (source) {
        return source.map((r) => ({
          ticker_code: r.ticker_code,
          investor_id: r.investor_id,
          investor_name: (r.investors as unknown as { name: string })?.name ?? '-',
          percentage: Number(r.percentage),
        }))
      }

      const preview = await supabase
        .from('v_holdings_preview')
        .select('ticker_code, investor_id, investor_name, percentage')
      if (preview.error) throw preview.error
      return (preview.data ?? []).map((r) => ({ ...r, percentage: Number(r.percentage) }))
    },
  })

  const focal = focalTicker || tickers?.[0]?.code || ''

  const { nodes, links } = useMemo(() => {
    if (!edges || edges.length === 0) return { nodes: [] as GraphNode[], links: [] as GraphLink[] }

    // Build an adjacency map ticker<->investor, then BFS from the focal ticker up to `depth` hops.
    const adjacency = new Map<string, Set<string>>()
    const addEdge = (a: string, b: string) => {
      if (!adjacency.has(a)) adjacency.set(a, new Set())
      adjacency.get(a)!.add(b)
    }
    for (const e of edges) {
      addEdge(`t:${e.ticker_code}`, `i:${e.investor_id}`)
      addEdge(`i:${e.investor_id}`, `t:${e.ticker_code}`)
    }

    const start = `t:${focal}`
    const visited = new Map<string, number>([[start, 0]])
    let frontier = [start]
    for (let d = 1; d <= depth; d++) {
      const next: string[] = []
      for (const node of frontier) {
        for (const neighbor of adjacency.get(node) ?? []) {
          if (!visited.has(neighbor)) {
            visited.set(neighbor, d)
            next.push(neighbor)
          }
        }
      }
      frontier = next
    }

    const includedIds = new Set(visited.keys())
    const tickerWeight = new Map<string, number>()
    const investorLabel = new Map<string, string>()

    const filteredEdges = edges.filter(
      (e) => includedIds.has(`t:${e.ticker_code}`) && includedIds.has(`i:${e.investor_id}`),
    )
    for (const e of filteredEdges) {
      tickerWeight.set(e.ticker_code, (tickerWeight.get(e.ticker_code) ?? 0) + e.percentage)
      investorLabel.set(e.investor_id, e.investor_name)
    }

    const nodes: GraphNode[] = [
      ...Array.from(tickerWeight.entries()).map(([code, weight]) => ({
        id: `t:${code}`,
        label: code,
        kind: 'ticker' as const,
        weight,
      })),
      ...Array.from(investorLabel.entries()).map(([id, name]) => ({
        id: `i:${id}`,
        label: name,
        kind: 'investor' as const,
        weight: 8,
      })),
    ]

    const links: GraphLink[] = filteredEdges.map((e) => ({
      source: `t:${e.ticker_code}`,
      target: `i:${e.investor_id}`,
      value: e.percentage,
    }))

    return { nodes, links }
  }, [edges, focal, depth])

  return (
    <div className="container py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold">{t('network.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('network.subtitle')}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
        <Select value={focal} onValueChange={setFocalTicker}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih ticker" />
          </SelectTrigger>
          <SelectContent>
            {tickers?.map((tk) => (
              <SelectItem key={tk.code} value={tk.code}>
                {tk.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('network.depth')}:</span>
          {[1, 2].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d as 1 | 2)}
              className={`rounded-md px-3 py-1.5 font-medium ${depth === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}
          {nodes.length > 0 && (
            <NetworkGraph
              nodes={nodes}
              links={links}
              onNodeClick={(node) => {
                if (node.kind === 'ticker') navigate(`/ticker/${node.label}`)
                else navigate(`/investor/${node.id.slice(2)}`)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
