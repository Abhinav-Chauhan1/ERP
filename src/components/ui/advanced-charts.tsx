"use client";

import { ReactNode, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  ReferenceLine,
  Brush
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Download,
  Maximize2,
  Settings,
  Filter,
  Calendar,
  RefreshCw
} from "lucide-react";

// Color palette for charts
export const chartColors = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#10b981', '#059669', '#047857', '#065f46'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  neutral: ['#6b7280', '#4b5563', '#374151', '#1f2937'],
  rainbow: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
} as const;

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeSeriesDataPoint {
  timestamp: string | Date;
  [key: string]: any;
}

// Enhanced Line Chart
interface AdvancedLineChartProps {
  data: TimeSeriesDataPoint[];
  lines: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  showBrush?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function AdvancedLineChart({
  data,
  lines,
  title,
  description,
  height = 300,
  showBrush = false,
  showGrid = true,
  showLegend = true,
  className,
}: AdvancedLineChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  const filteredData = useMemo(() => {
    if (selectedTimeRange === 'all') return data;
    
    const now = new Date();
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    
    const rangeMs = ranges[selectedTimeRange as keyof typeof ranges];
    if (!rangeMs) return data;
    
    const cutoff = new Date(now.getTime() - rangeMs);
    return data.filter(point => new Date(point.timestamp) >= cutoff);
  }, [data, selectedTimeRange]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
                <SelectItem value="90d">90d</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={filteredData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="timestamp" 
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name
              ]}
            />
            {showLegend && <Legend />}
            {lines.map((line, index) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color || chartColors.rainbow[index % chartColors.rainbow.length]}
                strokeWidth={line.strokeWidth || 2}
                strokeDasharray={line.strokeDasharray}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {showBrush && <Brush dataKey="timestamp" height={30} />}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Multi-metric Dashboard Chart
interface MultiMetricChartProps {
  data: TimeSeriesDataPoint[];
  metrics: Array<{
    key: string;
    name: string;
    type: 'line' | 'area' | 'bar';
    yAxisId?: 'left' | 'right';
    color?: string;
  }>;
  title?: string;
  height?: number;
  className?: string;
}

export function MultiMetricChart({
  data,
  metrics,
  title,
  height = 400,
  className,
}: MultiMetricChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis yAxisId="left" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" fontSize={12} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Legend />
            {metrics.map((metric, index) => {
              const color = metric.color || chartColors.rainbow[index % chartColors.rainbow.length];
              const yAxisId = metric.yAxisId || 'left';
              
              if (metric.type === 'line') {
                return (
                  <Line
                    key={metric.key}
                    yAxisId={yAxisId}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.name}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              } else if (metric.type === 'area') {
                return (
                  <Area
                    key={metric.key}
                    yAxisId={yAxisId}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.name}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                  />
                );
              } else {
                return (
                  <Bar
                    key={metric.key}
                    yAxisId={yAxisId}
                    dataKey={metric.key}
                    name={metric.name}
                    fill={color}
                  />
                );
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Interactive Pie Chart with Drill-down
interface InteractivePieChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  showPercentages?: boolean;
  onSegmentClick?: (data: ChartDataPoint) => void;
  className?: string;
}

export function InteractivePieChart({
  data,
  title,
  description,
  height = 300,
  showPercentages = true,
  onSegmentClick,
  className,
}: InteractivePieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (entry: any) => {
    if (!showPercentages) return '';
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width="60%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data) => onSegmentClick?.(data)}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={chartColors.rainbow[index % chartColors.rainbow.length]}
                    stroke={activeIndex === index ? '#000' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((entry, index) => (
              <div 
                key={entry.name}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                onClick={() => onSegmentClick?.(entry)}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chartColors.rainbow[index % chartColors.rainbow.length] }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Heatmap Chart
interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  className?: string;
}

export function HeatmapChart({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  className,
}: HeatmapChartProps) {
  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => d.x))).sort();
  const yValues = Array.from(new Set(data.map(d => d.y))).sort();
  
  // Find min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const getColor = (value: number) => {
    const intensity = (value - minValue) / (maxValue - minValue);
    const opacity = Math.max(0.1, intensity);
    return `rgba(59, 130, 246, ${opacity})`;
  };

  const getValue = (x: string, y: string) => {
    const point = data.find(d => d.x === x && d.y === y);
    return point?.value || 0;
  };

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${xValues.length}, 1fr)` }}>
            {/* Header row */}
            <div></div>
            {xValues.map(x => (
              <div key={x} className="text-xs text-center font-medium p-2">
                {x}
              </div>
            ))}
            
            {/* Data rows */}
            {yValues.map(y => (
              <>
                <div key={y} className="text-xs font-medium p-2 text-right">
                  {y}
                </div>
                {xValues.map(x => {
                  const value = getValue(x, y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square border border-border flex items-center justify-center text-xs font-medium cursor-pointer hover:border-primary"
                      style={{ backgroundColor: getColor(value) }}
                      title={`${x}, ${y}: ${value}`}
                    >
                      {value}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
          
          {/* Color scale legend */}
          <div className="flex items-center gap-2 text-xs">
            <span>Low</span>
            <div className="flex h-4 w-32 rounded overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: getColor(minValue + (maxValue - minValue) * (i / 9)) }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gauge Chart
interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  className?: string;
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  unit = '',
  thresholds = [],
  size = 200,
  className,
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  const getColor = () => {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) {
        return thresholds[i].color;
      }
    }
    return '#3b82f6';
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center p-6">
        {title && <h3 className="font-medium mb-4">{title}</h3>}
        
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          {/* Background arc */}
          <svg width={size} height={size / 2 + 20} className="absolute">
            <path
              d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Value arc */}
            <path
              d={`M 20 ${size / 2} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2}`}
              fill="none"
              stroke={getColor()}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * Math.PI * (size / 2 - 20)} ${Math.PI * (size / 2 - 20)}`}
              strokeLinecap="round"
            />
            {/* Needle */}
            <line
              x1={size / 2}
              y1={size / 2}
              x2={size / 2 + (size / 2 - 30) * Math.cos((angle * Math.PI) / 180)}
              y2={size / 2 + (size / 2 - 30) * Math.sin((angle * Math.PI) / 180)}
              stroke="#374151"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Center dot */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r="4"
              fill="#374151"
            />
          </svg>
          
          {/* Value display */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <div className="text-2xl font-bold">
              {value.toLocaleString()}{unit}
            </div>
            <div className="text-sm text-muted-foreground">
              {min} - {max}{unit}
            </div>
          </div>
        </div>
        
        {/* Threshold labels */}
        {thresholds.length > 0 && (
          <div className="flex gap-4 mt-4">
            {thresholds.map((threshold, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: threshold.color }}
                />
                <span>{threshold.label || `${threshold.value}${unit}`}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Chart Container with Controls
interface ChartContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  controls?: ReactNode;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  className?: string;
}

export function ChartContainer({
  children,
  title,
  description,
  controls,
  isLoading = false,
  error,
  onRefresh,
  onExport,
  onFullscreen,
  className,
}: ChartContainerProps) {
  if (error) {
    return (
      <Card className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading chart</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {controls}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onFullscreen && (
              <Button variant="outline" size="sm" onClick={onFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading chart...</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}