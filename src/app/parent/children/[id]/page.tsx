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
  params: { id: string };
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
    <div className="container p-6">
      <Button variant="outline" size="sm" className="mb-6" asChild>
        <Link href="/parent/children/overview">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Children
        </Link>
      </Button>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <div className="md:w-40">
          <Avatar className="h-40 w-40">
            <AvatarImage src={student.user.avatar || ""} alt={student.user.firstName} />
            <AvatarFallback className="text-4xl">
              {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              {student.user.firstName} {student.user.lastName}
            </h1>
            {childDetails.isPrimary && (
              <Badge>Primary</Badge>
            )}
          </div>
          
          <p className="text-gray-500 mb-4">{student.admissionId}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
            <div className="flex gap-2 items-center">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <span>
                {currentEnrollment ? (
                  `Class: ${currentEnrollment.class.name} - ${currentEnrollment.section.name}`
                ) : (
                  "Not enrolled in any class"
                )}
              </span>
            </div>
            
            <div className="flex gap-2 items-center">
              <School className="h-4 w-4 text-gray-400" />
              <span>Roll Number: {student.rollNumber || "Not assigned"}</span>
            </div>
            
            <div className="flex gap-2 items-center">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Date of Birth: {format(new Date(student.dateOfBirth), "PPP")}</span>
            </div>
            
            {student.address && (
              <div className="flex gap-2 items-center">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{student.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ChildDetailTabs childDetails={childDetails} />
    </div>
  );
}
