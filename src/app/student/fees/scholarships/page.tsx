import { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Award, Info, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudentScholarships, applyForScholarship } from "@/lib/actions/student-fee-actions";
import { TabNavigator } from "@/components/student/tab-navigator";

export const metadata: Metadata = {
  title: "Scholarships | Student Portal",
  description: "View and apply for scholarships",
};

export default async function ScholarshipsPage() {
  const { scholarships, availableScholarships, totalScholarshipAmount } = await getStudentScholarships();
  
  return (
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/fees">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Fees
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Scholarships</h1>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="active">Active Scholarships</TabsTrigger>
          <TabsTrigger value="available">Available Scholarships</TabsTrigger>
          <TabsTrigger value="application">How to Apply</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Scholarships</CardTitle>
                <CardDescription>
                  Active scholarships awarded to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scholarships.length > 0 ? (
                  <div className="space-y-6">
                    {scholarships.map((item) => (
                      <div key={item.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-green-600" />
                              <h3 className="font-medium">{item.scholarship.name}</h3>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 ml-7">
                              {item.scholarship.description || "Merit-based scholarship"}
                            </p>
                            
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-3 ml-7">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                Awarded: {format(new Date(item.awardDate), "MMMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-center md:text-right">
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="text-2xl font-bold text-green-700">${item.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Active Scholarships</h3>
                    <p className="text-gray-500 mb-6">
                      You don't have any active scholarships at the moment.
                    </p>
                    <TabNavigator 
                      targetTabValue="available" 
                      buttonText="View Available Scholarships" 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Scholarship Summary</CardTitle>
                <CardDescription>
                  Overview of your scholarship benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-blue-700">Total Scholarship Amount</div>
                    <div className="text-3xl font-bold text-blue-800">
                      ${totalScholarshipAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {scholarships.length} active scholarship(s)
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Benefits</h4>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        Reduced tuition and fees
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        Priority registration for courses
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        Access to scholarship networking events
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Scholarships</CardTitle>
              <CardDescription>
                Scholarships you can apply for based on your eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableScholarships.length > 0 ? (
                <div className="space-y-6">
                  {availableScholarships.map((scholarship) => (
                    <div key={scholarship.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            <h3 className="font-medium">{scholarship.name}</h3>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 ml-7">
                            {scholarship.description || "No description available"}
                          </p>
                          
                          <div className="mt-3 ml-7 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Amount:</span>
                              <span>${scholarship.amount.toFixed(2)}</span>
                              {scholarship.percentage && (
                                <span className="text-gray-500">
                                  ({scholarship.percentage}% of fees)
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Criteria:</span>
                              <span>{scholarship.criteria || "Merit-based"}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Duration:</span>
                              <span>{scholarship.duration || "One academic year"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-7 md:ml-0">
                          <form action={async () => {
                            "use server";
                            await applyForScholarship(scholarship.id);
                          }}>
                            <Button type="submit">Apply Now</Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No Available Scholarships</h3>
                  <p className="text-gray-500">
                    There are currently no scholarships available for application.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Scholarship Application Guide</CardTitle>
              <CardDescription>
                Learn about the scholarship application process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-700">Application Process</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Follow these steps to apply for a scholarship:
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">1</div>
                    <div>
                      <h4 className="font-medium">Check Eligibility</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Review the scholarship requirements and confirm that you meet all eligibility criteria.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">2</div>
                    <div>
                      <h4 className="font-medium">Prepare Documentation</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Gather all required documents, which may include academic records, financial information, and recommendation letters.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">3</div>
                    <div>
                      <h4 className="font-medium">Submit Application</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Click on the "Apply Now" button for the scholarship you're interested in and complete the application form.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">4</div>
                    <div>
                      <h4 className="font-medium">Application Review</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        The scholarship committee will review your application and supporting documents.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">5</div>
                    <div>
                      <h4 className="font-medium">Decision Notification</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        You will be notified of the decision via email and on your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-700">Important Notes</h3>
                      <ul className="text-sm text-amber-600 mt-1 list-disc list-inside space-y-1">
                        <li>Submit your application before the deadline</li>
                        <li>Ensure all information provided is accurate and complete</li>
                        <li>Incomplete applications may not be considered</li>
                        <li>For questions, contact the financial aid office at financial.aid@school.edu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
