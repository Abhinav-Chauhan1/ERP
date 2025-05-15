"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface AttendanceTrendChartProps {
  data: {
    month: string;
    percentage: number;
  }[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  // Function to determine the bar color based on attendance percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#22c55e"; // Green
    if (percentage >= 75) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md border rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: getBarColor(payload[0].value) }}>
              {payload[0].value}% Attendance
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" />
          <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" />
          <Bar 
            dataKey="percentage" 
            name="Attendance"
            radius={[4, 4, 0, 0]}
            barSize={30}
            fill="#6366f1" // Default color
            fillOpacity={0.9}
            animationDuration={1000}
            shape={(props: any) => {
              const { x, y, width, height, index } = props;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={getBarColor(data[index].percentage)}
                  rx={4}
                  ry={4}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
