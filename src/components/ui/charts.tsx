"use client";

import React from "react";

// ============================================================================
// Types
// ============================================================================

// Generic chart data type - allows indexing with any string key
interface ChartDataItem {
    [key: string]: unknown;
}

interface BarChartProps {
    data: ChartDataItem[];
    dataKey: string;
    xAxisKey: string;
    fill?: string;
    height?: number;
    showTooltip?: boolean;
    showLegend?: boolean;
    legendLabel?: string;
    formatter?: (value: number) => string;
}

interface MultiBarChartProps {
    data: ChartDataItem[];
    bars: Array<{ dataKey: string; fill: string; name?: string; stackId?: string }>;
    xAxisKey: string;
    height?: number;
    showTooltip?: boolean;
    showLegend?: boolean;
    formatter?: (value: number) => string;
}

interface PieChartProps {
    data: ChartDataItem[];
    dataKey: string;
    nameKey: string;
    colors?: string[];
    height?: number;
    showLabels?: boolean;
    labelKey?: string;
    showLegend?: boolean;
}

interface LineChartProps {
    data: ChartDataItem[];
    lines: Array<{ dataKey: string; stroke: string; name?: string; strokeDasharray?: string }>;
    xAxisKey: string;
    height?: number;
    showTooltip?: boolean;
    showLegend?: boolean;
}

// ============================================================================
// Bar Chart Component
// ============================================================================

export function SimpleBarChart({
    data,
    dataKey,
    xAxisKey,
    fill = "#3b82f6",
    height = 300,
    showTooltip = true,
    showLegend = true,
    legendLabel,
    formatter = (v) => v.toString(),
}: BarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const values = data.map((d) => Number(d[dataKey]) || 0);
    const maxValue = Math.max(...values, 1);

    return (
        <div className="w-full" style={{ height }}>
            {showLegend && (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: fill }} />
                        <span className="text-sm text-muted-foreground">{legendLabel || dataKey}</span>
                    </div>
                </div>
            )}
            <div className="flex items-end justify-between gap-2 h-[calc(100%-60px)]">
                {data.map((item, index) => {
                    const value = Number(item[dataKey]) || 0;
                    const percentage = (value / maxValue) * 100;

                    return (
                        <div
                            key={index}
                            className="flex-1 flex flex-col items-center group relative"
                        >
                            <div className="w-full flex justify-center mb-2">
                                <div
                                    className="w-full max-w-[60px] rounded-t transition-all duration-500 ease-out"
                                    style={{
                                        backgroundColor: fill,
                                        height: `${Math.max(percentage, 5)}%`,
                                        animation: `growUp 0.6s ease-out ${index * 0.1}s both`,
                                    }}
                                />
                            </div>
                            {showTooltip && (
                                <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {formatter(value)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                        <span className="text-xs text-muted-foreground truncate block px-1">
                            {String(item[xAxisKey])}
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}

// ============================================================================
// Multi-Bar Chart Component
// ============================================================================

export function MultiBarChart({
    data,
    bars,
    xAxisKey,
    height = 300,
    showTooltip = true,
    showLegend = true,
    formatter = (v) => v.toString(),
}: MultiBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const allValues = bars.flatMap((bar) =>
        data.map((d) => Number(d[bar.dataKey]) || 0)
    );
    const maxValue = Math.max(...allValues, 1);

    // Check if bars should be stacked
    const isStacked = bars.some((b) => b.stackId);

    return (
        <div className="w-full" style={{ height }}>
            {showLegend && (
                <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                    {bars.map((bar, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: bar.fill }} />
                            <span className="text-sm text-muted-foreground">{bar.name || bar.dataKey}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-end justify-between gap-4 h-[calc(100%-60px)]">
                {data.map((item, dataIndex) => {
                    if (isStacked) {
                        // Stacked bar chart
                        const stackedValues = bars.map((bar) => Number(item[bar.dataKey]) || 0);
                        const totalValue = stackedValues.reduce((sum, v) => sum + v, 0);
                        const totalMaxValue = Math.max(...data.map(d =>
                            bars.reduce((sum, bar) => sum + (Number(d[bar.dataKey]) || 0), 0)
                        ), 1);
                        const totalPercentage = (totalValue / totalMaxValue) * 100;

                        return (
                            <div key={dataIndex} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className="w-full max-w-[60px] flex flex-col-reverse rounded-t overflow-hidden"
                                    style={{ height: `${Math.max(totalPercentage, 5)}%` }}
                                >
                                    {bars.map((bar, barIndex) => {
                                        const value = Number(item[bar.dataKey]) || 0;
                                        const barPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

                                        return (
                                            <div
                                                key={barIndex}
                                                className="w-full transition-all duration-500 ease-out"
                                                style={{
                                                    backgroundColor: bar.fill,
                                                    height: `${barPercentage}%`,
                                                    animation: `fadeIn 0.6s ease-out ${dataIndex * 0.1}s both`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                {showTooltip && (
                                    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {bars.map((bar, idx) => (
                                            <div key={idx}>
                                                {bar.name || bar.dataKey}: {formatter(Number(item[bar.dataKey]) || 0)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    } else {
                        // Grouped bar chart
                        return (
                            <div key={dataIndex} className="flex-1 flex items-end justify-center gap-1 group relative">
                                {bars.map((bar, barIndex) => {
                                    const value = Number(item[bar.dataKey]) || 0;
                                    const percentage = (value / maxValue) * 100;

                                    return (
                                        <div
                                            key={barIndex}
                                            className="flex-1 max-w-[30px] rounded-t transition-all duration-500 ease-out"
                                            style={{
                                                backgroundColor: bar.fill,
                                                height: `${Math.max(percentage, 3)}%`,
                                                animation: `growUp 0.6s ease-out ${(dataIndex * bars.length + barIndex) * 0.05}s both`,
                                            }}
                                        />
                                    );
                                })}
                                {showTooltip && (
                                    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {bars.map((bar, idx) => (
                                            <div key={idx}>
                                                {bar.name || bar.dataKey}: {formatter(Number(item[bar.dataKey]) || 0)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                })}
            </div>
            <div className="flex justify-between mt-2">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                        <span className="text-xs text-muted-foreground truncate block px-1">
                            {String(item[xAxisKey])}
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}

// ============================================================================
// Pie Chart Component
// ============================================================================

export function SimplePieChart({
    data,
    dataKey,
    nameKey,
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
    height = 300,
    showLabels = true,
    showLegend = true,
}: PieChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
    let currentAngle = 0;

    const segments = data.map((item, index) => {
        const value = Number(item[dataKey]) || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        return {
            name: String(item[nameKey] || ''),
            value,
            percentage,
            startAngle,
            endAngle: currentAngle,
            color: colors[index % colors.length],
        };
    });

    const createArcPath = (startAngle: number, endAngle: number, radius: number, cx: number, cy: number) => {
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    const size = Math.min(height - 60, 300);
    const radius = size / 2 - 20;
    const cx = size / 2;
    const cy = size / 2;

    return (
        <div className="w-full flex flex-col items-center" style={{ height }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
            >
                {segments.map((segment, index) => {
                    if (segment.percentage < 0.5) return null; // Skip very small segments

                    return (
                        <g key={index}>
                            <path
                                d={createArcPath(segment.startAngle, segment.endAngle, radius, cx, cy)}
                                fill={segment.color}
                                className="transition-all duration-300 hover:opacity-80"
                                style={{
                                    animation: `pieSlice 0.8s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                <title>{`${segment.name}: ${segment.percentage.toFixed(1)}%`}</title>
                            </path>
                            {showLabels && segment.percentage > 5 && (
                                <text
                                    x={cx + (radius * 0.65) * Math.cos(((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI / 180)}
                                    y={cy + (radius * 0.65) * Math.sin(((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI / 180)}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs fill-white font-medium pointer-events-none"
                                >
                                    {segment.percentage.toFixed(0)}%
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            {showLegend && (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                                {segment.name} ({segment.percentage.toFixed(1)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <style jsx>{`
        @keyframes pieSlice {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
}

// ============================================================================
// Line Chart Component
// ============================================================================

export function SimpleLineChart({
    data,
    lines,
    xAxisKey,
    height = 300,
    showTooltip = true,
    showLegend = true,
}: LineChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const allValues = lines.flatMap((line) =>
        data.map((d) => Number(d[line.dataKey]) || 0)
    );
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1;

    const chartWidth = 100;
    const chartHeight = height - 80;
    const pointGap = chartWidth / (data.length - 1 || 1);

    const getY = (value: number) => {
        const normalized = (value - minValue) / range;
        return chartHeight - normalized * chartHeight;
    };

    return (
        <div className="w-full" style={{ height }}>
            {showLegend && (
                <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                    {lines.map((line, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div
                                className="w-4 h-0.5"
                                style={{
                                    backgroundColor: line.stroke,
                                    borderStyle: line.strokeDasharray ? "dashed" : "solid",
                                }}
                            />
                            <span className="text-sm text-muted-foreground">{line.name || line.dataKey}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative w-full" style={{ height: chartHeight }}>
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                        <line
                            key={idx}
                            x1={0}
                            y1={chartHeight * ratio}
                            x2={chartWidth}
                            y2={chartHeight * ratio}
                            stroke="#e5e7eb"
                            strokeWidth="0.2"
                        />
                    ))}

                    {/* Lines */}
                    {lines.map((line, lineIndex) => {
                        const points = data.map((item, index) => ({
                            x: index * pointGap,
                            y: getY(Number(item[line.dataKey]) || 0),
                            value: Number(item[line.dataKey]) || 0,
                        }));

                        const pathD = points
                            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                            .join(" ");

                        return (
                            <g key={lineIndex}>
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.stroke}
                                    strokeWidth="0.8"
                                    strokeDasharray={line.strokeDasharray || "none"}
                                    className="transition-all duration-300"
                                    style={{
                                        strokeDashoffset: 1000,
                                        animation: `drawLine 1.5s ease-out forwards`,
                                    }}
                                />
                                {points.map((p, pointIndex) => (
                                    <circle
                                        key={pointIndex}
                                        cx={p.x}
                                        cy={p.y}
                                        r="1.2"
                                        fill={line.stroke}
                                        className="transition-all duration-300 hover:r-2"
                                        style={{
                                            animation: `fadeIn 0.3s ease-out ${pointIndex * 0.05}s both`,
                                        }}
                                    >
                                        {showTooltip && <title>{`${line.name || line.dataKey}: ${p.value}`}</title>}
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="flex justify-between mt-2">
                {data.map((item, index) => (
                    <div key={index} className="text-center" style={{ width: `${100 / data.length}%` }}>
                        <span className="text-xs text-muted-foreground truncate block">
                            {String(item[xAxisKey])}
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
}

// ============================================================================
// Donut Chart Component
// ============================================================================

export function SimpleDonutChart({
    data,
    dataKey,
    nameKey,
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
    height = 300,
    showLabels = true,
    showLegend = true,
}: PieChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
    let currentPercentage = 0;

    const size = Math.min(height - 60, 250);
    const strokeWidth = size / 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="w-full flex flex-col items-center" style={{ height }}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {data.map((item, index) => {
                        const value = Number(item[dataKey]) || 0;
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((currentPercentage / 100) * circumference);
                        currentPercentage += percentage;

                        return (
                            <circle
                                key={index}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                                style={{
                                    animation: `donutFill 1s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                <title>{`${item[nameKey]}: ${percentage.toFixed(1)}%`}</title>
                            </circle>
                        );
                    })}
                </svg>
                {showLabels && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{total}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                    </div>
                )}
            </div>
            {showLegend && (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {data.map((item, index) => {
                        const value = Number(item[dataKey]) || 0;
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        return (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {String(item[nameKey])} ({percentage.toFixed(1)}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
            <style jsx>{`
        @keyframes donutFill {
          from {
            stroke-dasharray: 0 ${circumference};
          }
        }
      `}</style>
        </div>
    );
}
