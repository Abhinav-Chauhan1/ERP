"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface PerformanceData {
  term: string;
  percentage: number;
  averageMarks?: number | null;
  rank?: number | null;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Add an average line if we have multiple terms
  const avgPercentage = data.length > 0 
    ? data.reduce((sum, item) => sum + item.percentage, 0) / data.length 
    : 0;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="term" 
            tick={{ fontSize: 12 }} 
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]} 
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, "Performance"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar 
            dataKey="percentage" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
          {data.length > 1 && (
            <ReferenceLine y={avgPercentage} stroke="#ff8c00" strokeDasharray="3 3" label={{
              position: 'right',
              value: `Avg: ${avgPercentage.toFixed(1)}%`, 
              fill: '#ff8c00',
              fontSize: 12
            }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
