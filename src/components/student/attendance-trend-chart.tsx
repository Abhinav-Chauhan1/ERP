"use client";

interface TrendData {
  month: string;
  percentage: number;
}

interface AttendanceTrendChartProps {
  data: TrendData[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  // Find max percentage for scaling
  const maxPercentage = Math.max(...data.map((d) => d.percentage), 100);

  // Get color based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 75) return "#3b82f6"; // blue
    if (percentage >= 65) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="h-64 relative">
      {/* Y-axis labels */}
      <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between text-xs text-gray-500">
        <div>100%</div>
        <div>75%</div>
        <div>50%</div>
        <div>25%</div>
        <div>0%</div>
      </div>

      {/* Chart area */}
      <div className="ml-10 h-full relative">
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-gray-200 h-0 w-full"></div>
          <div className="border-t border-gray-200 h-0 w-full"></div>
          <div className="border-t border-gray-200 h-0 w-full"></div>
          <div className="border-t border-gray-200 h-0 w-full"></div>
          <div className="border-t border-gray-200 h-0 w-full"></div>
        </div>

        {/* Bars */}
        <div className="flex h-full items-end justify-around">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-16 rounded-t-md transition-all duration-500"
                style={{
                  height: `${(item.percentage / 100) * 100}%`,
                  backgroundColor: getBarColor(item.percentage),
                }}
              ></div>
              <div className="text-xs font-medium mt-1">{item.month}</div>
              <div className="text-xs text-gray-500">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
