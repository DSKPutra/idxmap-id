import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export interface HeatmapNode {
  code: string
  sector: string
  marketCap: number
  changePct: number
}

interface HeatmapProps {
  data: HeatmapNode[]
  width?: number
  height?: number
}

interface TreeDatum {
  name: string
  children?: TreeDatum[]
  leaf?: HeatmapNode
}

export function Heatmap({ data, width = 900, height = 520 }: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const bySector = d3.group(data, (d) => d.sector)

    const root = d3
      .hierarchy<TreeDatum>({
        name: 'root',
        children: Array.from(bySector, ([sector, nodes]) => ({
          name: sector,
          children: nodes.map((n) => ({ name: n.code, leaf: n })),
        })),
      })
      .sum((d) => d.leaf?.marketCap ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    d3.treemap<TreeDatum>().size([width, height]).paddingOuter(6).paddingTop(22).paddingInner(2)(
      root,
    )

    const color = d3
      .scaleLinear<string>()
      .domain([-3, 0, 3])
      .range(['#dc2626', '#94a3b8', '#16a34a'])
      .clamp(true)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    type RectNode = d3.HierarchyRectangularNode<TreeDatum>
    const sectorNodes = (root.children ?? []) as RectNode[]
    const leaves = root.leaves() as RectNode[]

    // Sector group labels
    svg
      .selectAll('text.sector-label')
      .data(sectorNodes)
      .join('text')
      .attr('class', 'sector-label')
      .attr('x', (d) => d.x0 + 4)
      .attr('y', (d) => d.y0 + 14)
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('fill', 'currentColor')
      .attr('opacity', 0.6)
      .text((d) => d.data.name)

    const cell = svg
      .selectAll('g.cell')
      .data(leaves)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => d.data.leaf && navigate(`/ticker/${d.data.leaf.code}`))

    cell
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) => color(d.data.leaf?.changePct ?? 0))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('rx', 3)

    cell
      .filter((d) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 24)
      .append('text')
      .attr('x', 6)
      .attr('y', 18)
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .attr('fill', 'white')
      .text((d) => d.data.leaf?.code ?? '')

    cell
      .filter((d) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 38)
      .append('text')
      .attr('x', 6)
      .attr('y', 34)
      .attr('font-size', 11)
      .attr('fill', 'white')
      .attr('opacity', 0.9)
      .text((d) => {
        const pct = d.data.leaf?.changePct ?? 0
        return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`
      })

    cell
      .append('title')
      .text((d) => `${d.data.leaf?.code ?? ''} — ${(d.data.leaf?.changePct ?? 0).toFixed(2)}%`)
  }, [data, width, height, navigate])

  return <svg ref={svgRef} className="w-full" role="img" aria-label="Market heatmap" />
}
