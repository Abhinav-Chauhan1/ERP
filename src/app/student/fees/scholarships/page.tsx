export const dynamic = 'force-dynamic';

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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" asChild>
          <Link href="/student/fees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
          <p className="text-muted-foreground mt-1">
            View and apply for scholarships
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="application">How to Apply</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Your Scholarships</CardTitle>
                <CardDescription>
                  Active scholarships awarded to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scholarships.length > 0 ? (
                  <div className="space-y-4">
                    {scholarships.map((item) => (
                      <Card key={item.id} className="border-green-200 bg-green-50/50 overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-green-100 rounded-md text-green-600">
                                  <Award className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-lg">{item.scholarship.name}</h3>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {item.scholarship.description || "Merit-based scholarship"}
                              </p>
                              
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Awarded: {format(new Date(item.awardDate), "MMMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-center md:text-right">
                              <p className="text-sm text-muted-foreground mb-1">Amount</p>
                              <p className="text-3xl font-bold text-green-700">${item.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="rounded-full bg-muted p-6 mb-4 inline-block">
                      <Award className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Active Scholarships</h3>
                    <p className="text-muted-foreground mb-6">
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
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Scholarship Summary</CardTitle>
                <CardDescription>
                  Overview of your scholarship benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg text-center border border-blue-200">
                    <div className="text-sm text-blue-900 mb-1">Total Scholarship Amount</div>
                    <div className="text-4xl font-bold text-blue-900">
                      ${totalScholarshipAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-700 mt-2">
                      {scholarships.length} active scholarship(s)
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Benefits</h4>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Reduced tuition and fees
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Priority registration for courses
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Access to scholarship networking events
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="available" className="space-y-6 mt-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Available Scholarships</CardTitle>
              <CardDescription>
                Scholarships you can apply for based on your eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableScholarships.length > 0 ? (
                <div className="space-y-4">
                  {availableScholarships.map((scholarship) => (
                    <Card key={scholarship.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                <Award className="h-5 w-5" />
                              </div>
                              <h3 className="font-semibold text-lg">{scholarship.name}</h3>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                              {scholarship.description || "No description available"}
                            </p>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[80px]">Amount:</span>
                                <span className="font-semibold text-primary">${scholarship.amount.toFixed(2)}</span>
                                {scholarship.percentage && (
                                  <span className="text-muted-foreground">
                                    ({scholarship.percentage}% of fees)
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[80px]">Criteria:</span>
                                <span>{scholarship.criteria || "Merit-based"}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[80px]">Duration:</span>
                                <span>{scholarship.duration || "One academic year"}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <form action={async () => {
                              "use server";
                              await applyForScholarship(scholarship.id);
                            }}>
                              <Button type="submit" className="min-h-[44px]">Apply Now</Button>
                            </form>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="rounded-full bg-muted p-6 mb-4 inline-block">
                    <Award className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Available Scholarships</h3>
                  <p className="text-muted-foreground">
                    There are currently no scholarships available for application.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="space-y-6 mt-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Scholarship Application Guide</CardTitle>
              <CardDescription>
                Learn about the scholarship application process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Application Process</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Follow these steps to apply for a scholarship:
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Check Eligibility</h4>
                      <p className="text-sm text-muted-foreground">
                        Review the scholarship requirements and confirm that you meet all eligibility criteria.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Prepare Documentation</h4>
                      <p className="text-sm text-muted-foreground">
                        Gather all required documents, which may include academic records, financial information, and recommendation letters.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Submit Application</h4>
                      <p className="text-sm text-muted-foreground">
                        Click on the "Apply Now" button for the scholarship you're interested in and complete the application form.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">4</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Application Review</h4>
                      <p className="text-sm text-muted-foreground">
                        The scholarship committee will review your application and supporting documents.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">5</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Decision Notification</h4>
                      <p className="text-sm text-muted-foreground">
                        You will be notified of the decision via email and on your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">Important Notes</h3>
                      <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
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
