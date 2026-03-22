import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeCard } from '../types';
import { Network, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphViewProps {
  cards: KnowledgeCard[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  group: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export default function GraphView({ cards }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || cards.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Prepare data
    const nodes: Node[] = cards.map(c => ({
      id: c.id,
      title: c.title,
      group: (c.tags || [])[0] || 'general'
    }));

    // Create links based on shared tags AND explicit links
    const links: Link[] = [];
    const linkSet = new Set<string>();

    cards.forEach(card => {
      // 1. Explicit links
      (card.links || []).forEach(targetId => {
        if (cards.some(c => c.id === targetId)) {
          const pair = [card.id, targetId].sort().join('-');
          if (!linkSet.has(pair)) {
            links.push({ source: card.id, target: targetId });
            linkSet.add(pair);
          }
        }
      });

      // 2. Shared tags (implicit links)
      cards.forEach(otherCard => {
        if (card.id === otherCard.id) return;
        const tagsA = card.tags || [];
        const tagsB = otherCard.tags || [];
        const sharedTags = tagsA.filter(t => tagsB.includes(t));
        
        if (sharedTags.length > 0) {
          const pair = [card.id, otherCard.id].sort().join('-');
          if (!linkSet.has(pair)) {
            links.push({ source: card.id, target: otherCard.id });
            linkSet.add(pair);
          }
        }
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = g.append("g")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 8)
      .attr("fill", "#6366F1")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm shadow-indigo-200");

    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text(d => d.title)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "#4B5563")
      .attr("class", "pointer-events-none select-none uppercase tracking-wider");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [cards]);

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-600" />
            Knowledge Graph
          </h2>
          <p className="text-sm text-gray-400">Visualize the connections between your ideas and notes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-12">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto">
                <Network className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">No connections yet</h3>
                <p className="text-gray-400 max-w-xs mx-auto">Add more cards with shared tags to see your knowledge network grow.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
