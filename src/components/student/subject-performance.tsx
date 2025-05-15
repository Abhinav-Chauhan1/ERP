"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from "lucide-react";

interface SubjectPerformanceProps {
  studentId: string;
}

export function SubjectPerformance({ studentId }: SubjectPerformanceProps) {
  // This would typically come from an API call based on the studentId
  // For now, using dummy data
  const data = [
    { subject: 'Mathematics', score: 85, average: 72 },
    { subject: 'Science', score: 78, average: 70 },
    { subject: 'English', score: 92, average: 75 },
    { subject: 'History', score: 70, average: 68 },
    { subject: 'Computer', score: 95, average: 80 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          Subject Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [`${value}%`]}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="score" name="Your Score" fill="#3b82f6" />
              <Bar dataKey="average" name="Class Average" fill="#d1d5db" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs">Your Score</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
            <span className="text-xs">Class Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
