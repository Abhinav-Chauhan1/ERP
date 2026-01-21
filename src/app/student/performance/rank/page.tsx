export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { BadgeIcon, Crown, Medal, Trophy, Users } from "lucide-react";
import { getClassRankAnalysis } from "@/lib/actions/student-performance-actions";
import { Badge } from "@/components/ui/badge";
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

export const metadata: Metadata = {
  title: "Class Rank | Student Portal",
  description: "View your position and ranking in class",
};

export default async function ClassRankPage() {
  // Fetch required data
  const { rankData, currentRank, classSize } = await getClassRankAnalysis();

  // Helper function to get rank medal
  const getRankMedal = (rank: number | null) => {
    if (!rank) return null;

    if (rank === 1) return <Crown className="h-6 w-6 text-amber-500" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-slate-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return null;
  };

  // Helper to calculate percentile rank text - synchronized with standardized zones
  const getPercentileText = (percentile: number | null) => {
    if (percentile === null) return "";

    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Top 50%";
    return "Bottom 50%";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Class Rank Analysis</h1>
        <p className="text-muted-foreground mt-1">
          View your position and ranking in class
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
            <CardTitle className="text-center text-lg mb-4">Current Rank</CardTitle>
            <CardContent className="flex flex-col items-center p-0">
              <div className="relative mb-3">
                <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm w-24 h-24 rounded-full border-4 border-white/30">
                  <span className="text-4xl font-bold">
                    {currentRank || '-'}
                  </span>
                </div>
                {getRankMedal(currentRank) && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                    {getRankMedal(currentRank)}
                  </div>
                )}
              </div>
              <p className="text-center text-blue-100 text-sm">
                out of {classSize} students
              </p>
              {currentRank && classSize && (
                <Badge className="mt-2 bg-white/20 text-white border-white/30">
                  {getPercentileText(Math.round(((classSize - currentRank) / classSize) * 100))}
                </Badge>
              )}
            </CardContent>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Percentile</CardTitle>
            <CardDescription>Your position relative to classmates</CardDescription>
          </CardHeader>
          <CardContent>
            {currentRank && classSize ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">Bottom</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(((classSize - currentRank) / classSize) * 100)}%
                  </span>
                  <span className="text-sm text-muted-foreground">Top</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${Math.round(((classSize - currentRank) / classSize) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  You are performing better than {Math.round(((classSize - currentRank) / classSize) * 100)}% of your classmates
                </p>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No ranking data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Class Size</CardTitle>
            <CardDescription>Total number of students in your class</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-primary/10 rounded-full p-4 mb-3">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div className="text-3xl font-bold">{classSize}</div>
            <p className="text-sm text-muted-foreground mt-1">Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Rank Progression Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Rank Progression</CardTitle>
          <CardDescription>
            How your rank has changed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankData.length > 0 ? (
            <>
              {/* Improved rank progression visualization */}
              <div className="p-6 bg-gradient-to-br from-amber-50 to-white rounded-lg border">
                <div className="relative h-80 bg-white rounded-lg p-6 border">
                  {/* Y-axis labels for rank */}
                  <div className="absolute left-2 top-6 bottom-12 flex flex-col justify-between text-xs font-medium text-gray-600">
                    <span className="text-green-600">1st</span>
                    <span>{Math.ceil(classSize / 4)}</span>
                    <span>{Math.ceil(classSize / 2)}</span>
                    <span>{Math.ceil(classSize * 3 / 4)}</span>
                    <span className="text-red-600">{classSize}</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-12 mr-4 h-full pb-8 relative">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((value) => (
                        <div key={value} className="w-full border-t border-gray-200"></div>
                      ))}
                    </div>

                    {/* Rank zones (top 10%, top 25%, etc.) */}
                    <div className="absolute inset-0">
                      <div className="absolute top-0 w-full h-[10%] bg-green-50 opacity-30"></div>
                      <div className="absolute top-[10%] w-full h-[15%] bg-blue-50 opacity-30"></div>
                      <div className="absolute top-[25%] w-full h-[25%] bg-yellow-50 opacity-30"></div>
                    </div>

                    {/* Chart content */}
                    <div className="relative h-full pt-2 pb-2">
                      <svg className="w-full h-full" preserveAspectRatio="none">
                        {/* Gradient definitions */}
                        <defs>
                          <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                          <linearGradient id="rankAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>

                        {/* Area under rank line */}
                        {rankData.length > 1 && rankData.some(data => data.rank) && (
                          <polygon
                            points={`
                              ${rankData
                                .filter(data => data.rank !== null)
                                .map((data, i) =>
                                  `${(i / (rankData.length - 1)) * 100},${(data.rank! / classSize) * 100}`
                                ).join(' ')}
                              ${100},${100}
                              ${0},${100}
                            `}
                            fill="url(#rankAreaGradient)"
                          />
                        )}

                        {/* Rank progression line */}
                        {rankData.length > 1 && rankData.some(data => data.rank) && (
                          <polyline
                            points={rankData
                              .filter(data => data.rank !== null)
                              .map((data, i) =>
                                `${(i / (rankData.length - 1)) * 100},${(data.rank! / classSize) * 100}`
                              ).join(' ')}
                            fill="none"
                            stroke="url(#rankGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Data points with medals for top ranks */}
                        {rankData.map((data, i) => {
                          if (!data.rank) return null;
                          const yPos = (data.rank / classSize) * 100;
                          const xPos = rankData.length > 1 ? (i / (rankData.length - 1)) * 100 : 50;

                          return (
                            <g key={i}>
                              {/* Outer glow circle */}
                              <circle
                                cx={xPos}
                                cy={yPos}
                                r="2.5"
                                fill={data.rank <= 3 ? "#fbbf24" : "#f59e0b"}
                                opacity="0.3"
                              />
                              {/* Main point */}
                              <circle
                                cx={xPos}
                                cy={yPos}
                                r="1.5"
                                fill="white"
                                stroke={data.rank <= 3 ? "#fbbf24" : "#f59e0b"}
                                strokeWidth="2.5"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Hover tooltips */}
                      <div className="absolute inset-0 flex justify-between items-start">
                        {rankData.map((data, i) => (
                          <div
                            key={i}
                            className="group relative flex-1 h-full cursor-pointer"
                          >
                            {/* Tooltip */}
                            {data.rank && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                style={{ top: `${(data.rank / classSize) * 100}%` }}
                              >
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap -translate-y-full mb-2">
                                  <div className="font-semibold">{data.term}</div>
                                  <div className="text-amber-300 flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    Rank: {data.rank} / {data.totalStudents}
                                  </div>
                                  {data.percentile && (
                                    <div className="text-blue-300">Top {100 - data.percentile}%</div>
                                  )}
                                  {data.percentage && (
                                    <div className="text-gray-300">Score: {data.percentage}%</div>
                                  )}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                  <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-medium text-gray-600 pt-2">
                      {rankData.map((data, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="truncate px-1">{data.term}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend and info */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500"></div>
                      <span className="text-gray-600">Class Rank (Lower is Better)</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Hover over points for details</span>
                  </div>
                </div>

                {/* Performance zones legend */}
                <div className="mt-3 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-300"></div>
                    <span className="text-gray-600">Top 10%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300"></div>
                    <span className="text-gray-600">Top 25%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-gray-600">Top 50%</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-medium mb-4">Rank History</h3>
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Class Rank</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentile</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rankData.map((term, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{term.term}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {term.rank ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{term.rank}</span>
                                {getRankMedal(term.rank) && (
                                  <div className="h-4 w-4">{getRankMedal(term.rank)}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {term.percentile ? (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                {term.percentile}%
                              </Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: term.percentage ? `${getPerformanceColor(term.percentage)}20` : 'transparent',
                                color: term.percentage ? getPerformanceColor(term.percentage) : 'inherit',
                                borderColor: term.percentage ? `${getPerformanceColor(term.percentage)}40` : 'inherit'
                              }}
                            >
                              {term.percentage ?? '-'}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No Rank Data Available</h3>
              <p className="text-gray-500">
                Your class ranking information will appear here once results are published
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
