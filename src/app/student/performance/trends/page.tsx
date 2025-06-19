import { redirect } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getPerformanceTrends } from "@/lib/actions/student-performance-actions";

export const metadata: Metadata = {
  title: "Performance Trends | Student Portal",
  description: "Analyze your academic performance trends over time",
};

export default async function PerformanceTrendsPage() {
  // Fetch required data
  const { termPerformance, subjectTrends, examPerformance } = await getPerformanceTrends();
  
  // Format exam dates
  const formattedExamPerformance = examPerformance.map(exam => ({
    ...exam,
    formattedDate: format(new Date(exam.date), "MMM d, yyyy")
  }));
  
  // Create a lookup function to get colors from subject names
  const subjectColors: Record<string, string> = {
    "Mathematics": "#3b82f6", // blue
    "Science": "#22c55e",     // green
    "English": "#f59e0b",     // amber
    "History": "#8b5cf6",     // purple
    "Geography": "#ec4899",   // pink
    "Physics": "#06b6d4",     // cyan
    "Chemistry": "#14b8a6",   // teal
    "Biology": "#f43f5e",     // rose
  };
  
  // Default color for subjects not in the mapping
  const getSubjectColor = (subjectName: string) => {
    return subjectColors[subjectName] || "#6b7280"; // gray-500 as default
  };
  
  // Function to get color based on percentage
  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 75) return "#3b82f6"; // blue
    if (percentage >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };
  
  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Trends</h1>
      
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Term-by-Term Progress</CardTitle>
              <CardDescription>
                Track your overall performance across academic terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {termPerformance.map((term, index) => (
                  <div 
                    key={term.id} 
                    className="flex items-center p-4 rounded-lg border"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{term.name}</h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(term.startDate), "MMM d")} - {format(new Date(term.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{term.percentage}%</span>
                          <Badge variant="outline">{term.grade}</Badge>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="rounded-full h-1.5" 
                          style={{ 
                            width: `${term.percentage}%`,
                            backgroundColor: term.percentage >= 90 ? "#22c55e" : 
                                          term.percentage >= 75 ? "#3b82f6" : 
                                          term.percentage >= 60 ? "#f59e0b" : "#ef4444"
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        {term.rank && <span>Rank: {term.rank}</span>}
                        {term.attendance && <span>Attendance: {term.attendance}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Replace recharts with custom progress chart */}
              <div className="mt-8 p-6 bg-white border rounded-md">
                <h3 className="font-medium text-gray-700 mb-4">Performance Trend Visualization</h3>
                <div className="relative h-60 mt-6">
                  {/* Background grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between border-t border-gray-200">
                    <div className="absolute top-0 w-full h-px bg-gray-200"></div>
                    <div className="absolute top-1/4 w-full h-px bg-gray-200"></div>
                    <div className="absolute top-2/4 w-full h-px bg-gray-200"></div>
                    <div className="absolute top-3/4 w-full h-px bg-gray-200"></div>
                    <div className="absolute bottom-0 w-full h-px bg-gray-200"></div>
                  </div>
                  
                  {/* Y-axis labels */}
                  <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-gray-500">
                    <div className="-translate-y-1/2">100%</div>
                    <div className="-translate-y-1/2">75%</div>
                    <div className="-translate-y-1/2">50%</div>
                    <div className="-translate-y-1/2">25%</div>
                    <div className="-translate-y-1/2">0%</div>
                  </div>
                  
                  {/* X-axis terms */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-500 px-8">
                    {termPerformance.map(term => (
                      <div key={term.id} className="text-center">{term.name}</div>
                    ))}
                  </div>
                  
                  {/* Performance line */}
                  <div className="absolute inset-x-0 inset-y-0 flex px-8">
                    <div className="relative flex-1 mt-2">
                      <svg className="absolute inset-0" viewBox={`0 0 ${(termPerformance.length - 1) * 100} 100`} preserveAspectRatio="none">
                        <polyline
                          points={termPerformance.map((term, i) => `${i * 100},${100 - term.percentage}`).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                        {termPerformance.map((term, i) => (
                          <circle
                            key={term.id}
                            cx={i * 100}
                            cy={100 - term.percentage}
                            r="3"
                            fill="#3b82f6"
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Over Time</CardTitle>
              <CardDescription>
                Compare how your performance changed across subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Replace recharts with subject trends */}
              <div className="space-y-6">
                {subjectTrends.map(subject => (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getSubjectColor(subject.name) }}
                      ></div>
                      <h4 className="font-medium">{subject.name}</h4>
                    </div>
                    <div className="space-y-1.5">
                      {subject.termData.map((termData, index) => (
                        <div key={`${subject.id}-${termData.termId}`} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{termData.termName}</span>
                            <span>{termData.percentage !== null ? `${termData.percentage}%` : 'N/A'}</span>
                          </div>
                          {termData.percentage !== null && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="rounded-full h-1.5" 
                                style={{ 
                                  width: `${termData.percentage}%`,
                                  backgroundColor: getSubjectColor(subject.name)
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Performance Timeline</CardTitle>
              <CardDescription>
                Your performance in individual exams over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Replace scatter chart with a simple timeline */}
              <div className="relative border-l border-gray-200 ml-4 pl-4 py-4 space-y-8">
                {formattedExamPerformance.slice(-10).map((exam, index) => (
                  <div key={exam.id} className="relative">
                    <div 
                      className="absolute -left-8 w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColorByPercentage(exam.percentage) }}
                    ></div>
                    <div className="border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{exam.examName}</h4>
                          <p className="text-xs text-gray-500">
                            {exam.subject} • {exam.formattedDate}
                          </p>
                        </div>
                        <Badge 
                          className={`
                            ${exam.percentage >= 90 ? 'bg-green-100 text-green-800' :
                              exam.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                              exam.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'}
                          `}
                        >
                          {exam.percentage}%
                        </Badge>
                      </div>
                      <div className="text-sm">Score: {exam.marks}/{exam.totalMarks}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="rounded-full h-1.5" 
                          style={{ 
                            width: `${exam.percentage}%`,
                            backgroundColor: getColorByPercentage(exam.percentage)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 space-y-2">
                <h3 className="font-medium">Recent Exam Results</h3>
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formattedExamPerformance.slice(-5).reverse().map(exam => (
                        <tr key={exam.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{exam.examName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{exam.subject}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{exam.formattedDate}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{exam.marks}/{exam.totalMarks}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <Badge 
                              className={`
                                ${exam.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                  exam.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                  exam.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'}
                              `}
                            >
                              {exam.percentage}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
