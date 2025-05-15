"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

const defaultColors = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444"];

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
  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {categories.map((category, index) => (
                  <linearGradient
                    key={`gradient-${category}`}
                    id={`gradient-${category}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colors[index % colors.length]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors[index % colors.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
                padding={{ left: 10, right: 10 }}
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
              {categories.map((category, index) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={colors[index % colors.length]}
                  fill={`url(#gradient-${category})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
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
              {categories.map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey={yKey}
                nameKey={xKey}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              <Tooltip
                contentStyle={{
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "none",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {renderChart()}
      </CardContent>
    </Card>
  );
}
