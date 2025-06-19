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
  
  // Helper to calculate percentile rank text
  const getPercentileText = (percentile: number | null) => {
    if (!percentile) return "";
    
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Top 50%";
    return "Bottom 50%";
  };
  
  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Class Rank Analysis</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-center">Current Rank</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="flex items-center justify-center bg-blue-100 w-24 h-24 rounded-full mb-2">
                <span className="text-4xl font-bold text-blue-700">
                  {currentRank || '-'}
                </span>
              </div>
              {getRankMedal(currentRank) && (
                <div className="absolute -top-2 -right-2">
                  {getRankMedal(currentRank)}
                </div>
              )}
            </div>
            <p className="text-center text-gray-500">
              out of {classSize} students
            </p>
            {currentRank && classSize && (
              <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-200">
                {getPercentileText(Math.round(((classSize - currentRank) / classSize) * 100))}
              </Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Percentile</CardTitle>
            <CardDescription>Your position relative to classmates</CardDescription>
          </CardHeader>
          <CardContent>
            {currentRank && classSize ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Bottom</span>
                  <span className="text-xl font-bold text-blue-600">
                    {Math.round(((classSize - currentRank) / classSize) * 100)}%
                  </span>
                  <span className="text-sm text-gray-500">Top</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.round(((classSize - currentRank) / classSize) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  You are performing better than {Math.round(((classSize - currentRank) / classSize) * 100)}% of your classmates
                </p>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No ranking data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Class Size</CardTitle>
            <CardDescription>Total number of students in your class</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-gray-100 rounded-full p-4 mb-2">
              <Users className="h-10 w-10 text-gray-600" />
            </div>
            <div className="text-3xl font-bold">{classSize}</div>
            <p className="text-sm text-gray-500 mt-1">Students</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Rank Progression</CardTitle>
          <CardDescription>
            How your rank has changed over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {rankData.length > 0 ? (
            <>
              {/* Custom rank progression visualization */}
              <div className="h-64 p-4 relative">
                <div className="absolute inset-y-0 left-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                  <div>1</div>
                  <div>{Math.ceil(classSize / 4)}</div>
                  <div>{Math.ceil(classSize / 2)}</div>
                  <div>{Math.ceil(classSize * 3 / 4)}</div>
                  <div>{classSize}</div>
                </div>
                
                <div className="ml-12 h-full relative">
                  {/* Background grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="border-t border-gray-200 h-px w-full"></div>
                    <div className="border-t border-gray-200 h-px w-full"></div>
                    <div className="border-t border-gray-200 h-px w-full"></div>
                    <div className="border-t border-gray-200 h-px w-full"></div>
                    <div className="border-t border-gray-200 h-px w-full"></div>
                  </div>
                  
                  {/* X-axis terms */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-500">
                    {rankData.map((data, i) => (
                      <div key={i} className="transform -translate-x-1/2">{data.term}</div>
                    ))}
                  </div>
                  
                  {/* Connect the rank points with lines */}
                  <svg className="absolute inset-0" viewBox={`0 0 ${rankData.length * 100} 100`} preserveAspectRatio="none">
                    {rankData.some(data => data.rank) && (
                      <polyline
                        points={rankData
                          .filter(data => data.rank !== null)
                          .map((data, i) => `${i * 100}, ${(data.rank! / classSize) * 100}`)
                          .join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                    )}
                    
                    <polyline
                      points={rankData
                        .map((data, i) => `${i * 100}, ${100 - (data.percentage ?? 0)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    
                    {/* Add points */}
                    {rankData.filter(data => data.rank !== null).map((data, i) => (
                      <circle
                        key={`rank-${i}`}
                        cx={i * 100}
                        cy={(data.rank! / classSize) * 100}
                        r="4"
                        fill="#f59e0b"
                      />
                    ))}
                    
                    {rankData.map((data, i) => (
                      <circle
                        key={`perf-${i}`}
                        cx={i * 100}
                        cy={100 - (data.percentage ?? 0)}
                        r="4"
                        fill="#3b82f6"
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-0 right-0 flex items-center text-xs">
                  <div className="flex items-center mr-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>Performance %</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                    <span>Class Rank</span>
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
                              className={`
                                ${term.percentage && term.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                  term.percentage && term.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                  term.percentage && term.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'}
                              `}
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
