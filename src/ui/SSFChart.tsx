import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SSFChartProps {
  rh: number;
  deltaR: number;
  currentR: number;
}

export const SSFChart = ({ rh, deltaR, currentR }: SSFChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 10, right: 10, bottom: 20, left: 20 };
    const width = 200 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    // Draw curve
    const line = d3.line<[number, number]>()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(d3.curveBasis);

    const data: [number, number][] = d3.range(0, 1.05, 0.05).map(r => {
      const val = 0.5 * (1 + Math.tanh((r - rh) / (deltaR || 0.1)));
      return [r, Math.max(0, Math.min(1, val))];
    });

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--accent)")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Current point
    const currentSc = 0.5 * (1 + Math.tanh((currentR - rh) / (deltaR || 0.1)));
    
    g.append("circle")
      .attr("cx", x(currentR))
      .attr("cy", y(currentSc))
      .attr("r", 3)
      .attr("fill", "var(--accent)")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "text-[6px] opacity-30")
      .call(d3.axisBottom(x).ticks(5));

    g.append("g")
      .attr("class", "text-[6px] opacity-30")
      .call(d3.axisLeft(y).ticks(2));

  }, [rh, deltaR, currentR]);

  return <svg ref={svgRef} width="200" height="100" className="overflow-visible" />;
};
