import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getChildDetails } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, GraduationCap, MapPin, School } from "lucide-react";
import { ChildDetailTabs } from "@/components/parent/child-detail-tabs";

export const metadata: Metadata = {
  title: "Child Details | Parent Portal",
  description: "View detailed information about your child",
};

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params before accessing properties
  const param = await params;
  const childId = param.id;
  
  const childDetails = await getChildDetails(childId);
  
  if (!childDetails || !childDetails.student) {
    notFound();
  }
  
  const { student, currentEnrollment } = childDetails;
  
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/parent/children/overview">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Children
        </Link>
      </Button>
      
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 mb-8 border border-blue-100">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-40 w-40 border-4 border-white shadow-xl">
              <AvatarImage src={student.user.avatar || ""} alt={student.user.firstName} />
              <AvatarFallback className="text-5xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {childDetails.isPrimary && (
              <Badge className="bg-blue-600 text-white">Primary Child</Badge>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {student.user.firstName} {student.user.lastName}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Admission ID: <span className="font-semibold">{student.admissionId}</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Current Class</p>
                  <p className="text-sm font-semibold">
                    {currentEnrollment ? (
                      `${currentEnrollment.class.name} - ${currentEnrollment.section.name}`
                    ) : (
                      "Not enrolled"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <School className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Roll Number</p>
                  <p className="text-sm font-semibold">{student.rollNumber || "Not assigned"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                  <p className="text-sm font-semibold">{format(new Date(student.dateOfBirth), "PPP")}</p>
                </div>
              </div>
              
              {student.address && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Address</p>
                    <p className="text-sm font-semibold truncate">{student.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <ChildDetailTabs childDetails={childDetails} />
    </div>
  );
}
