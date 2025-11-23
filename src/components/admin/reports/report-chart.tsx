"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/lib/actions/reportBuilderActions";

interface ReportChartProps {
  data: any[];
  chartConfig: ChartConfig;
  title?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(221, 83%, 53%)",
  "hsl(48, 96%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 65%, 60%)",
];

export function ReportChart({ data, chartConfig, title }: ReportChartProps) {
  const { type, xAxisField, yAxisField } = chartConfig;

  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      name: item[xAxisField]?.toString() || "N/A",
      value: parseFloat(item[yAxisField]) || 0,
    }));
  }, [data, xAxisField, yAxisField]);

  if (!chartConfig.enabled || chartData.length === 0) {
    return null;
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "none",
                }}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
                name={yAxisField}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "none",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], r: 4 }}
                activeDot={{ r: 6 }}
                name={yAxisField}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "none",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                fill="url(#colorValue)"
                name={yAxisField}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "none",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title || `${yAxisField} by ${xAxisField}`}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
