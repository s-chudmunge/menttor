// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface PackedCircleLayoutProps {
  data: any; // Hierarchical data
  width: number;
  height: number;
  onSelectModel: (id: string, name: string) => void;
  currentModelId: string;
  setHoveredModel: (model: any) => void;
}

const PackedCircleLayout: React.FC<PackedCircleLayoutProps> = ({
  data,
  width,
  height,
  onSelectModel,
  currentModelId,
  setHoveredModel,
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear SVG contents for redraw

    const pack = d3.pack()
      .size([width, height])
      .padding(3);

    const root = d3.hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a, b) => b.value - a.value);

    const nodes = pack(root).descendants();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const node = svg.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", d => `node ${d.children ? (d.depth === 0 ? 'root' : 'parent') : 'leaf'}`)
      .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
      .attr("id", d => `node-${d.data.name.replace(/\s/g, '')}`)
      .attr("r", d => d.r)
      .attr("fill", d => d.children ? "#ccc" : color(d.data.modelData?.provider || d.data.name))
      .attr("opacity", d => d.children ? 0.2 : 0.8)
      .attr("stroke", d => currentModelId === d.data.modelData?.id ? "#FBBF24" : (d.children ? "#aaa" : "#fff"))
      .attr("stroke-width", d => currentModelId === d.data.modelData?.id ? 4 : 1.5)
      .on("click", (event, d) => {
        if (d.data.modelData) {
          onSelectModel(d.data.modelData.id, d.data.modelData.name);
        }
      })
      .on("mouseenter", (event, d) => {
        if (d.data.modelData) {
          setHoveredModel(d.data.modelData);
        }
      })
      .on("mouseleave", () => {
        setHoveredModel(null);
      });

    node.append("clipPath")
      .attr("id", d => `clip-${d.data.name.replace(/\s/g, '')}`)
      .append("use")
      .attr("xlink:href", d => `#node-${d.data.name.replace(/\s/g, '')}`);

    node.append("text")
      .attr("clip-path", d => `url(#clip-${d.data.name.replace(/\s/g, '')})`)
      .filter(d => !d.children || d.depth === 1) // Only show labels for leaf nodes and first level parents
      .attr("text-anchor", "middle")
      .attr("fill", d => d.children ? "#333" : "#fff")
      .attr("font-size", d => d.children ? "12px" : "10px")
      .attr("dy", "0.3em")
      .text(d => d.data.name)
      .each(function(d) { // Wrap text if it overflows
        const text = d3.select(this);
        const words = d.data.name.split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const x = text.attr("x");
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > d.r * 1.8) { // Check against circle diameter
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });

  }, [data, width, height, onSelectModel, currentModelId, setHoveredModel]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default PackedCircleLayout;