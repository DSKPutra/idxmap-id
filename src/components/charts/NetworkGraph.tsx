import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  kind: 'ticker' | 'investor'
  weight: number
}

export interface GraphLink {
  source: string
  target: string
  value: number
}

interface NetworkGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick: (node: GraphNode) => void
  width?: number
  height?: number
}

export function NetworkGraph({
  nodes,
  links,
  onNodeClick,
  width = 900,
  height = 560,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const container = svg.append('g')

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => container.attr('transform', event.transform)),
    )

    // d3-force mutates these arrays' objects in place; clone so React state stays untouched.
    const nodeData = nodes.map((n) => ({ ...n }))
    const linkData = links.map((l) => ({ ...l }))

    const simulation = d3
      .forceSimulation(nodeData)
      .force(
        'link',
        d3
          .forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode> & GraphLink>(linkData as never)
          .id((d) => d.id)
          .distance(90)
          .strength(0.4),
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<GraphNode>().radius((d) => 8 + Math.sqrt(d.weight) * 3),
      )

    const link = container
      .append('g')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.2)
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke-width', (d) => Math.max(1, Math.sqrt(d.value)))

    const node = container
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodeData)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )
      .on('click', (_event, d) => onNodeClick(d))

    node
      .append('circle')
      .attr('r', (d) => 6 + Math.sqrt(d.weight) * 2.5)
      .attr('fill', (d) => (d.kind === 'ticker' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'))
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)

    node
      .append('text')
      .text((d) => d.label)
      .attr('x', (d) => 10 + Math.sqrt(d.weight) * 2.5)
      .attr('y', 4)
      .attr('font-size', 11)
      .attr('fill', 'currentColor')

    node.append('title').text((d) => d.label)

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as unknown as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as unknown as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as unknown as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as unknown as GraphNode).y ?? 0)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, links, onNodeClick, width, height])

  return (
    <svg
      ref={svgRef}
      className="w-full touch-none text-muted-foreground"
      role="img"
      aria-label="Network graph"
    />
  )
}
