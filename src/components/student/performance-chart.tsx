"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Button } from "@/components/ui/button";
import { BarChart2, LineChart as LineChartIcon } from "lucide-react";

interface PerformanceData {
  name: string;
  percentage: number;
  rank?: number | null;
  averageMarks?: number | null;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-card p-3 border rounded-md shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Percentage: ${payload[0].value}%`}</p>
          {payload[0].payload.rank && (
            <p className="text-amber-600 dark:text-amber-400">{`Rank: ${payload[0].payload.rank}`}</p>
          )}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            type="button"
            variant={chartType === 'bar' ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setChartType('bar')}
          >
            <BarChart2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Bar</span>
          </Button>
          <Button
            type="button"
            variant={chartType === 'line' ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setChartType('line')}
          >
            <LineChartIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Line</span>
          </Button>
        </div>
      </div>
      
      <div className="h-72 md:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: -10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                tickCount={6}
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="percentage" 
                name="Performance"
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 20, right: 10, left: -10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                tickCount={6}
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                name="Performance"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
