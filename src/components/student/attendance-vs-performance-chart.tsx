"use client";

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";

// For demonstration purposes, we'll use sample data
// In a real implementation, this would come from props
const sampleData = [
  { subject: "Mathematics", attendance: 95, performance: 88 },
  { subject: "Physics", attendance: 87, performance: 78 },
  { subject: "Chemistry", attendance: 76, performance: 71 },
  { subject: "Biology", attendance: 92, performance: 85 },
  { subject: "History", attendance: 65, performance: 60 },
  { subject: "English", attendance: 88, performance: 81 },
  { subject: "Computer Science", attendance: 98, performance: 92 },
  { subject: "Geography", attendance: 72, performance: 68 },
];

export function AttendanceVsPerformanceChart() {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="attendance" 
            name="Attendance" 
            unit="%" 
            domain={[50, 100]} 
            label={{ value: 'Attendance %', position: 'bottom', offset: 0 }}
          />
          <YAxis 
            type="number" 
            dataKey="performance" 
            name="Performance" 
            unit="%" 
            domain={[40, 100]} 
            label={{ value: 'Performance %', angle: -90, position: 'left' }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value) => `${value}%`}
            labelFormatter={(_, payload) => payload[0]?.payload?.subject || ""}
          />
          <Legend />
          
          {/* Correlation line (assuming positive correlation) */}
          <ReferenceLine 
            segment={[{ x: 50, y: 40 }, { x: 100, y: 100 }]} 
            stroke="#8884d8" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          
          <Scatter 
            name="Subjects" 
            data={sampleData} 
            fill="#ff7300" 
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
