"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartType = "area" | "bar" | "pie";

interface ChartProps {
  title: string;
  description?: string;
  data: any[];
  type?: ChartType;
  categories?: string[];
  colors?: string[];
  xKey: string;
  yKey: string;
  className?: string;
}

const defaultColors = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#14b8a6", "#0ea5e9"];

// Helper for Pie Chart Math
function getCoordinatesForPercent(percent: number) {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
}

export function Chart({
  title,
  description,
  data,
  type = "area",
  categories = ["value"],
  colors = defaultColors,
  xKey,
  yKey,
  className,
}: ChartProps) {
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 300 });
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, dataLength: number, chartWidth: number, padding: number) => {
    if (dataLength === 0) return;
    const { left } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left - padding;
    const stepX = chartWidth / (dataLength - 1);
    const index = Math.round(x / stepX);

    if (index >= 0 && index < dataLength) {
      setActiveIndex(index);
    } else {
      setActiveIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions((prev) => ({ ...prev, width: width }));
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [mounted]);

  // Fallback if data is empty 
  if (!mounted || !data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground bg-muted/10 rounded-md">
            {!mounted ? "Loading..." : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderLegend = () => {
    // Only show legend for Pie charts
    if (type !== "pie") return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-muted-foreground">
              {item[xKey]} ({Number(item[categories[0]] || 0)})
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    if (dimensions.width === 0) return null;

    const padding = 40;
    const chartWidth = dimensions.width - padding * 2;
    const chartHeight = dimensions.height - padding * 2;

    // Find absolute max value for scaling
    const allValues = data.flatMap(d => categories.map(k => Number(d[k] || 0)));
    const maxValue = Math.max(...allValues, 1);

    if (type === "bar") {
      const barWidth = (chartWidth / data.length) * 0.6;
      const gap = (chartWidth / data.length) * 0.4;

      return (
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
          {/* Y Axis Line */}
          <line x1={padding} y1={padding} x2={padding} y2={dimensions.height - padding} stroke="hsl(var(--border))" />
          {/* X Axis Line */}
          <line x1={padding} y1={dimensions.height - padding} x2={dimensions.width - padding} y2={dimensions.height - padding} stroke="hsl(var(--border))" />

          {/* Bars */}
          {data.map((item, index) => {
            const val = Number(item[categories[0]] || 0);
            const barHeight = (val / maxValue) * chartHeight;
            const x = padding + (index * (chartWidth / data.length)) + (gap / 2);
            const y = dimensions.height - padding - barHeight;
            const color = colors[index % colors.length];

            return (
              <g key={index} className="group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={4}
                  className="transition-all duration-500 ease-out hover:opacity-80"
                >
                  <animate attributeName="height" from="0" to={barHeight} dur="0.5s" fill="freeze" />
                  <animate attributeName="y" from={dimensions.height - padding} to={y} dur="0.5s" fill="freeze" />
                </rect>
                <text x={x + barWidth / 2} y={dimensions.height - padding + 20} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                  {String(item[xKey]).substring(0, 5)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="hsl(var(--foreground))"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    if (type === "area") {
      const stepX = chartWidth / (data.length - 1);

      const points = data.map((item, index) => {
        const val = Number(item[categories[0]] || 0);
        const x = padding + (index * stepX);
        const y = dimensions.height - padding - ((val / maxValue) * chartHeight);
        return `${x},${y}`;
      }).join(" ");

      const areaPoints = `${padding},${dimensions.height - padding} ${points} ${padding + chartWidth},${dimensions.height - padding}`;
      const color = colors[0];

      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible cursor-crosshair"
          onMouseMove={(e) => handleMouseMove(e, data.length, chartWidth, padding)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <line x1={padding} y1={dimensions.height - padding} x2={dimensions.width - padding} y2={dimensions.height - padding} stroke="hsl(var(--border))" />
          <line x1={padding} y1={padding} x2={padding} y2={dimensions.height - padding} stroke="hsl(var(--border))" />

          {/* Area Path */}
          <polygon points={areaPoints} fill={color} fillOpacity={0.2} className="transition-all duration-500">
            <animate attributeName="opacity" from="0" to="0.2" dur="1s" />
          </polygon>

          {/* Line Path */}
          <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" from={`0, ${dimensions.width * 2}`} to={`${dimensions.width * 2}, 0`} dur="1.5s" />
          </polyline>

          {/* Static Points (only visible on group hover if no active index) */}
          {data.map((item, index) => {
            const val = Number(item[categories[0]] || 0);
            const x = padding + (index * stepX);
            const y = dimensions.height - padding - ((val / maxValue) * chartHeight);

            if (index % 2 !== 0 && data.length > 10) return null;

            // X Axis Labels
            return (
              <text key={index} x={x} y={dimensions.height - padding + 20} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                {String(item[xKey]).substring(0, 3)}
              </text>
            );
          })}

          {/* Interactive Elements (Tooltip & Crosshair) */}
          {activeIndex !== null && activeIndex >= 0 && activeIndex < data.length && (
            <g>
              {(() => {
                const item = data[activeIndex];
                const val = Number(item[categories[0]] || 0);
                const x = padding + (activeIndex * stepX);
                const y = dimensions.height - padding - ((val / maxValue) * chartHeight);

                return (
                  <>
                    {/* Crosshair Line */}
                    <line
                      x1={x} y1={padding}
                      x2={x} y2={dimensions.height - padding}
                      stroke="hsl(var(--foreground))"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.5}
                    />

                    {/* Active Point Circle */}
                    <circle cx={x} cy={y} r={6} fill="#fff" stroke={color} strokeWidth={2} />

                    {/* Tooltip Box */}
                    <g transform={`translate(${x > dimensions.width / 2 ? x - 130 : x + 10}, ${Math.max(padding, y - 40)})`}>
                      <rect width="120" height="50" rx="4" fill="hsl(var(--popover))" stroke="hsl(var(--border))" className="shadow-lg" />
                      <text x="10" y="20" fontSize="12" fontWeight="bold" fill="hsl(var(--popover-foreground))">{item[xKey]}</text>
                      <text x="10" y="38" fontSize="12" fill="hsl(var(--muted-foreground))">
                        {categories[0]}: <tspan fill="hsl(var(--foreground))" fontWeight="500">{val}</tspan>
                      </text>
                    </g>
                  </>
                );
              })()}
            </g>
          )}

          {/* Transparent Overlay for Event Catching */}
          <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="transparent" />
        </svg>
      );
    }

    if (type === "pie") {
      let cumulativePercent = 0;
      const total = data.reduce((sum, item) => sum + Number(item[categories[0]] || 0), 0);

      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2;

      // Handle empty data
      if (total === 0) {
        return (
          <svg width={dimensions.width} height={dimensions.height}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={2} strokeDasharray="4 4" />
            <text x={cx} y={cy} textAnchor="middle" alignmentBaseline="middle" fill="hsl(var(--muted-foreground))" fontSize="14">
              No Enrollment Data
            </text>
          </svg>
        );
      }

      // Special handling for single item (100% or just 1 item with value > 0)
      const validItems = data.filter(d => Number(d[categories[0]]) > 0);
      if (validItems.length === 1) {
        const activeItem = validItems[0];
        const activeIndex = data.indexOf(activeItem);
        return (
          <svg width={dimensions.width} height={dimensions.height}>
            <circle cx={cx} cy={cy} r={radius} fill={colors[activeIndex % colors.length]} className="animate-in zoom-in duration-500" />
            <text x={cx} y={cy} textAnchor="middle" alignmentBaseline="middle" fill="#fff" fontSize="14" fontWeight="bold">
              {activeItem[xKey]} ({activeItem[categories[0]]})
            </text>
          </svg>
        );
      }

      return (
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
          {data.map((item, index) => {
            const val = Number(item[categories[0]] || 0);
            const percent = val / total;

            if (percent === 0) return null;

            // Calculate start and end SVG coordinates
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);

            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

            // Handle large slices
            const largeArcFlag = percent > 0.5 ? 1 : 0;

            const startXPos = cx + radius * startX;
            const startYPos = cy + radius * startY;
            const endXPos = cx + radius * endX;
            const endYPos = cy + radius * endY;

            // SVG Path
            const pathData = `M ${cx} ${cy} L ${startXPos} ${startYPos} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endXPos} ${endYPos} Z`;
            const color = colors[index % colors.length];

            return (
              <path
                key={index}
                d={pathData}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                className="transition-all duration-300 hover:opacity-80 hover:scale-105 origin-center"
              />
            );
          })}
        </svg>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div ref={containerRef} style={{ width: '100%', height: 300 }}>
          {renderChart()}
        </div>
        {renderLegend()}
      </CardContent>
    </Card>
  );
}

