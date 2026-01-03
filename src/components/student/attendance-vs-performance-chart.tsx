"use client";

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
  const chartData = data?.length > 0 ? data : [
    { month: 'Jan', year: 2023, attendance: 95, performance: 88 },
    { month: 'Feb', year: 2023, attendance: 92, performance: 85 },
    { month: 'Mar', year: 2023, attendance: 88, performance: 82 },
    { month: 'Apr', year: 2023, attendance: 90, performance: 84 },
    { month: 'May', year: 2023, attendance: 94, performance: 87 },
    { month: 'Jun', year: 2023, attendance: 96, performance: 90 },
  ];

  const maxValue = 100;
  const chartHeight = 200;
  const chartWidth = chartData.length * 60;
  const getY = (v: number) => chartHeight - (v / maxValue) * chartHeight;

  return (
    <div className="h-72">
      <div className="relative h-full">
        <svg viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 50}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v, i) => (
            <g key={i}>
              <line x1="40" y1={getY(v)} x2={chartWidth + 40} y2={getY(v)} stroke="#e5e7eb" strokeWidth="1" />
              <text x="35" y={getY(v) + 4} textAnchor="end" className="text-[10px] fill-gray-500">{v}</text>
            </g>
          ))}

          {/* Attendance line (green) */}
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            points={chartData.map((d, i) => `${i * 60 + 60},${getY(d.attendance)}`).join(' ')}
            style={{ animation: 'drawLine 1s ease-out forwards' }}
          />

          {/* Performance line (blue) */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={chartData.filter(d => d.performance !== null).map((d, i) => `${chartData.indexOf(d) * 60 + 60},${getY(d.performance!)}`).join(' ')}
            style={{ animation: 'drawLine 1s ease-out forwards' }}
          />

          {/* Data points and labels */}
          {chartData.map((d, i) => (
            <g key={i}>
              <circle cx={i * 60 + 60} cy={getY(d.attendance)} r="5" fill="#22c55e" className="transition-all hover:r-7" />
              {d.performance !== null && (
                <circle cx={i * 60 + 60} cy={getY(d.performance)} r="5" fill="#3b82f6" className="transition-all hover:r-7" />
              )}
              <text x={i * 60 + 60} y={chartHeight + 20} textAnchor="middle" className="text-[10px] fill-gray-600">{d.month}</text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Performance</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; stroke-dasharray: 1000; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
