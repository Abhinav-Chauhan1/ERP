"use client";

import { useState } from "react";
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
  const maxValue = Math.max(...data.map(d => d.percentage), 100);
  const chartHeight = 250;
  const getY = (v: number) => chartHeight - (v / maxValue) * chartHeight;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button type="button" variant={chartType === 'bar' ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setChartType('bar')}>
            <BarChart2 className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Bar</span>
          </Button>
          <Button type="button" variant={chartType === 'line' ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setChartType('line')}>
            <LineChartIcon className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Line</span>
          </Button>
        </div>
      </div>

      <div className="h-72 md:h-80 w-full">
        {chartType === 'bar' ? (
          <div className="h-full flex items-end justify-between gap-2 pb-8">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.name}: {d.percentage}%{d.rank ? ` (Rank: ${d.rank})` : ''}
                </div>
                <div
                  className="w-full max-w-[50px] rounded-t-md transition-all duration-500 ease-out bg-blue-500 hover:bg-blue-600"
                  style={{ height: `${(d.percentage / maxValue) * 100}%`, animation: `growUp 0.6s ease-out ${i * 0.1}s both` }}
                />
                <span className="text-[10px] text-gray-600 mt-2 transform -rotate-45 origin-top-left truncate max-w-[60px]">{d.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full relative">
            <svg viewBox={`0 0 ${data.length * 60 + 40} ${chartHeight + 40}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {[0, 25, 50, 75, 100].map((v, i) => (<line key={i} x1="30" y1={getY(v)} x2={data.length * 60 + 30} y2={getY(v)} stroke="#e5e7eb" strokeWidth="1" />))}
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={data.map((d, i) => `${i * 60 + 50},${getY(d.percentage)}`).join(' ')} style={{ animation: 'drawLine 1s ease-out forwards' }} />
              {data.map((d, i) => (
                <g key={i}>
                  <circle cx={i * 60 + 50} cy={getY(d.percentage)} r="4" fill="#3b82f6" />
                  <text x={i * 60 + 50} y={chartHeight + 20} textAnchor="middle" transform={`rotate(-45 ${i * 60 + 50} ${chartHeight + 20})`} className="text-[10px] fill-gray-600">{d.name}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes growUp { from { height: 0; } }
        @keyframes drawLine { from { stroke-dashoffset: 1000; stroke-dasharray: 1000; } to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
