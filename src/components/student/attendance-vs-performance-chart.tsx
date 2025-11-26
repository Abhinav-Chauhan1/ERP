"use client";

import dynamic from 'next/dynamic';

// Dynamically import recharts to avoid SSR issues
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

interface AttendancePerformanceData {
  month: string;
  year: number;
  attendance: number;
  performance: number | null;
}

interface AttendanceVsPerformanceChartProps {
  data: AttendancePerformanceData[];
}

export function AttendanceVsPerformanceChart({ data }: AttendanceVsPerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-green-600">{`Attendance: ${payload[0].value}%`}</p>
          {payload[1]?.value && (
            <p className="text-blue-600">{`Performance: ${payload[1].value}%`}</p>
          )}
        </div>
      );
    }
  
    return null;
  };

  // If no data provided, use sample data
  const chartData = data?.length > 0 ? data : [
    { month: 'Jan', year: 2023, attendance: 95, performance: 88 },
    { month: 'Feb', year: 2023, attendance: 92, performance: 85 },
    { month: 'Mar', year: 2023, attendance: 88, performance: 82 },
    { month: 'Apr', year: 2023, attendance: 90, performance: 84 },
    { month: 'May', year: 2023, attendance: 94, performance: 87 },
    { month: 'Jun', year: 2023, attendance: 96, performance: 90 },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            domain={[0, 100]} 
            tickCount={6}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ bottom: 0 }} />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            name="Attendance"
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="performance" 
            name="Performance"
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
