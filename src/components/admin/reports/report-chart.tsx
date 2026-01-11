"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/lib/actions/reportBuilderActions";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/ui/charts";

interface ReportChartProps {
  data: any[];
  chartConfig: ChartConfig;
  title?: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function ReportChart({ data, chartConfig, title }: ReportChartProps) {
  const { type, xAxisField, yAxisField } = chartConfig;

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
    switch (type) {
      case "bar":
        return (
          <SimpleBarChart
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            fill={COLORS[0]}
            height={350}
            legendLabel={yAxisField}
          />
        );
      case "line":
      case "area":
        return (
          <SimpleLineChart
            data={chartData}
            lines={[{ dataKey: "value", stroke: COLORS[0], name: yAxisField }]}
            xAxisKey="name"
            height={350}
          />
        );
      case "pie":
        return (
          <SimplePieChart
            data={chartData}
            dataKey="value"
            nameKey="name"
            colors={COLORS}
            height={350}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title || `${yAxisField} by ${xAxisField}`}</CardTitle>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
