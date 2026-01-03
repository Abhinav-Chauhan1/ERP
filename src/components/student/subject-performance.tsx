"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";

interface SubjectPerformanceProps {
  data: any[];
}

export function SubjectPerformance({ data }: SubjectPerformanceProps) {
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#22c55e";
    if (percentage >= 75) return "#3b82f6";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const maxValue = Math.max(...data.map(d => d.percentage), 100);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Subject Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[280px] w-full pt-4">
            <div className="h-full flex items-end justify-between gap-2 pb-16">
              {data.map((entry, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-2 py-1 bg-card border rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <span className="font-medium">{entry.subject}</span>
                    <br />
                    <span className="text-sm">{entry.percentage}% Performance</span>
                  </div>

                  {/* Value label */}
                  <div className="text-xs font-semibold mb-1" style={{ color: getBarColor(entry.percentage) }}>
                    {entry.percentage}%
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out"
                    style={{
                      height: `${(entry.percentage / maxValue) * 100}%`,
                      backgroundColor: getBarColor(entry.percentage),
                      opacity: 0.9,
                      animation: `growUp 0.6s ease-out ${index * 0.1}s both`,
                    }}
                  />

                  {/* X-axis label */}
                  <div className="absolute -bottom-14 w-full text-center">
                    <span
                      className="text-xs text-muted-foreground block truncate max-w-[60px] transform -rotate-45 origin-top-left"
                      title={entry.subject}
                    >
                      {entry.subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <style jsx>{`
              @keyframes growUp {
                from {
                  height: 0;
                  opacity: 0;
                }
                to {
                  opacity: 0.9;
                }
              }
            `}</style>
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
