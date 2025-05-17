"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Subject Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[250px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                barSize={30}
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
                />
                <Bar 
                  dataKey="percentage" 
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                >
                  <LabelList dataKey="percentage" position="top" formatter={(value: number) => `${value}%`} />
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
          <div className="py-8 text-center text-gray-500">
            <p>No performance data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
