"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface SubjectPerformanceProps {
  data: any[];
}

export function SubjectPerformance({ data }: SubjectPerformanceProps) {
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 75) return "#3b82f6"; // blue
    if (percentage >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Subject Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                barSize={32}
              >
                <XAxis 
                  dataKey="subject" 
                  angle={-45} 
                  textAnchor="end" 
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Performance']}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar 
                  dataKey="percentage" 
                  radius={[6, 6, 0, 0]}
                  fillOpacity={0.9}
                >
                  <LabelList 
                    dataKey="percentage" 
                    position="top" 
                    formatter={(value: number) => `${value}%`}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={getBarColor(entry.percentage)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="rounded-full bg-muted p-6 mx-auto w-fit mb-4">
              <BarChartIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No performance data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
