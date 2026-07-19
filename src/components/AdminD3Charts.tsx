import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TrendData {
  date: string;
  occupancy: number; // percentage
  revenue: number; // amount
}

export default function AdminD3Charts({ isDarkMode }: { isDarkMode: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    // Generate some 14-day mock historical data for the chart
    const mockData: TrendData[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      mockData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        occupancy: Math.floor(40 + Math.random() * 50), // 40-90%
        revenue: Math.floor(5000 + Math.random() * 15000) // 5k-20k
      });
    }
    setData(mockData);
  }, []);

  useEffect(() => {
    if (!data.length || !chartRef.current) return;

    // Clear any previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const container = chartRef.current;
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    
    // We use container width/height
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const textColor = isDarkMode ? '#a1a1aa' : '#52525b';
    const gridColor = isDarkMode ? '#27272a' : '#e4e4e7';
    const revenueColor = '#f59e0b'; // amber-500
    const occupancyColor = '#3b82f6'; // blue-500

    // X axis
    const x = d3.scaleBand<string>()
      .range([0, width])
      .domain(data.map(d => d.date))
      .padding(0.2);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .call(g => g.select('.domain').attr('stroke', gridColor))
      .selectAll('text')
      .attr('fill', textColor)
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('font-size', '10px');

    // Add X gridlines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', gridColor).attr('stroke-dasharray', '3,3').attr('opacity', 0.5));

    const maxRevenue = d3.max<TrendData, number>(data, d => d.revenue) || 0;
    // Y Axis - Revenue (Left)
    const yRevenue = d3.scaleLinear<number, number>()
      .domain([0, maxRevenue])
      .range([height, 0]);

    svg.append('g')
      .call(d3.axisLeft(yRevenue).ticks(5).tickFormat(d => `${(d as number)/1000}k`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .selectAll('text')
      .attr('fill', revenueColor)
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('font-size', '10px');

    // Add Y gridlines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yRevenue).tickSize(-width).ticks(5).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', gridColor).attr('stroke-dasharray', '3,3'));

    // Y Axis - Occupancy (Right)
    const yOccupancy = d3.scaleLinear<number, number>()
      .domain([0, 100])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yOccupancy).ticks(5).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .selectAll('text')
      .attr('fill', occupancyColor)
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('font-size', '10px');

    // Bars for Revenue
    svg.selectAll('.bar')
      .data<TrendData>(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.date)!)
      .attr('width', x.bandwidth())
      .attr('y', d => yRevenue(d.revenue))
      .attr('height', d => height - yRevenue(d.revenue))
      .attr('fill', revenueColor)
      .attr('rx', 3)
      .attr('opacity', 0.8)
      .on('mouseover', function() { d3.select(this).attr('opacity', 1); })
      .on('mouseout', function() { d3.select(this).attr('opacity', 0.8); });

    // Line for Occupancy
    const line = d3.line<TrendData>()
      .x(d => x(d.date)! + x.bandwidth() / 2)
      .y(d => yOccupancy(d.occupancy))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', occupancyColor)
      .attr('stroke-width', 3)
      .attr('d', line);

    // Dots for Occupancy
    svg.selectAll('.dot')
      .data<TrendData>(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date)! + x.bandwidth() / 2)
      .attr('cy', d => yOccupancy(d.occupancy))
      .attr('r', 4)
      .attr('fill', isDarkMode ? '#18181b' : '#ffffff')
      .attr('stroke', occupancyColor)
      .attr('stroke-width', 2);

    // Tooltip
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', isDarkMode ? '#18181b' : '#ffffff')
      .style('border', `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`)
      .style('border-radius', '8px')
      .style('padding', '8px')
      .style('color', isDarkMode ? '#e4e4e7' : '#18181b')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)')
      .style('pointer-events', 'none');

    // Interaction overlays
    svg.selectAll('.overlay')
      .data<TrendData>(data)
      .enter()
      .append('rect')
      .attr('class', 'overlay')
      .attr('x', d => x(d.date)!)
      .attr('width', x.bandwidth())
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('mouseover', (event: any, d: TrendData) => {
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${d.date}</div>
            <div style="color: ${revenueColor}; display: flex; justify-content: space-between; gap: 12px;">
              <span>Revenue:</span> <span style="font-weight: bold;">${d.revenue.toLocaleString()} ETB</span>
            </div>
            <div style="color: ${occupancyColor}; display: flex; justify-content: space-between; gap: 12px;">
              <span>Occupancy:</span> <span style="font-weight: bold;">${d.occupancy}%</span>
            </div>
          `);
      })
      .on('mousemove', (event: any) => {
        const [xPos, yPos] = d3.pointer(event, document.body);
        tooltip.style('top', (yPos - 10) + 'px')
               .style('left', (xPos + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    // Handle resize
    const handleResize = () => {
      // Very basic resize handler: re-render the chart by triggering a small state change if needed, 
      // or we can just let React handle it if we wrap it in a resize observer. 
      // For simplicity, we'll just draw once per mount or data change.
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, isDarkMode]);

  return (
    <div className="relative w-full h-[300px]">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}
