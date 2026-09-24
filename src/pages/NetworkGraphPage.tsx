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
import { INVESTOR_TYPE_LABEL, useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

interface RawEdge {
  ticker_code: string
  investor_type: string
  local_foreign: 'L' | 'F'
  percentage: number
}

/**
 * Real per-investor names aren't publicly available in bulk (see
 * docs/developer/etl-import-ksei.md), so the graph connects each ticker to
 * the investor-type "buckets" that hold it (e.g. "CP-L", "MF-F") — 18 shared
 * type nodes across the whole market. Two tickers sharing a strong edge to
 * the same type node have a similar ownership profile (e.g. both heavily
 * foreign-broker-held).
 */
export function NetworkGraphPage() {
  const { t, lang } = useI18n()
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
      const { data, error } = await supabase
        .from('v_ownership_preview')
        .select('ticker_code, investor_type, local_foreign, percentage')
      if (error) throw error
      return (data ?? []).map((r) => ({ ...r, percentage: Number(r.percentage) }))
    },
  })

  const focal = focalTicker || tickers?.[0]?.code || ''

  const { nodes, links } = useMemo(() => {
    if (!edges || edges.length === 0) return { nodes: [] as GraphNode[], links: [] as GraphLink[] }

    const typeNodeId = (investorType: string, localForeign: string) =>
      `type:${investorType}-${localForeign}`

    const adjacency = new Map<string, Set<string>>()
    const addEdge = (a: string, b: string) => {
      if (!adjacency.has(a)) adjacency.set(a, new Set())
      adjacency.get(a)!.add(b)
    }
    for (const e of edges) {
      const tNode = `t:${e.ticker_code}`
      const typeNode = typeNodeId(e.investor_type, e.local_foreign)
      addEdge(tNode, typeNode)
      addEdge(typeNode, tNode)
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
    const typeWeight = new Map<string, number>()

    const filteredEdges = edges.filter(
      (e) =>
        includedIds.has(`t:${e.ticker_code}`) &&
        includedIds.has(typeNodeId(e.investor_type, e.local_foreign)),
    )
    for (const e of filteredEdges) {
      const typeNode = typeNodeId(e.investor_type, e.local_foreign)
      tickerWeight.set(e.ticker_code, (tickerWeight.get(e.ticker_code) ?? 0) + e.percentage)
      typeWeight.set(typeNode, (typeWeight.get(typeNode) ?? 0) + e.percentage)
    }

    const nodes: GraphNode[] = [
      ...Array.from(tickerWeight.entries()).map(([code, weight]) => ({
        id: `t:${code}`,
        label: code,
        kind: 'ticker' as const,
        weight,
      })),
      ...Array.from(typeWeight.entries()).map(([id, weight]) => {
        const [investorType, localForeign] = id.replace('type:', '').split('-')
        const label = `${INVESTOR_TYPE_LABEL[investorType!]?.[lang] ?? investorType} (${localForeign})`
        return { id, label, kind: 'investor' as const, weight }
      }),
    ]

    const links: GraphLink[] = filteredEdges.map((e) => ({
      source: `t:${e.ticker_code}`,
      target: typeNodeId(e.investor_type, e.local_foreign),
      value: e.percentage,
    }))

    return { nodes, links }
  }, [edges, focal, depth, lang])

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
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
