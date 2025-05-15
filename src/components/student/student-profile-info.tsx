import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Phone, Mail, Calendar, Tag, LifeBuoy, Users } from "lucide-react";

interface StudentProfileInfoProps {
  student: any;
}

export function StudentProfileInfo({ student }: StudentProfileInfoProps) {
  const fullName = `${student.user?.firstName || ""} ${student.user?.lastName || ""}`;
  const initials = `${(student.user?.firstName?.[0] || "").toUpperCase()}${(student.user?.lastName?.[0] || "").toUpperCase()}`;
  const currentEnrollment = student.enrollments?.[0];
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.user?.avatar || ""} alt={fullName} />
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center mt-2">
              <h2 className="font-semibold text-lg">{fullName}</h2>
              <p className="text-sm text-gray-500">Student</p>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission ID</p>
                <p className="font-medium">{student.admissionId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="font-medium">{student.user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-medium">{student.user?.phone || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="font-medium">{student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="font-medium">{student.gender}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="font-medium">{student.address || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <LifeBuoy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="font-medium">{student.bloodGroup || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Emergency Contact</p>
                <p className="font-medium">{student.emergencyContact || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {student.parents && student.parents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {student.parents.map((parentRel: any) => (
                <div key={parentRel.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{parentRel.parent.user.firstName} {parentRel.parent.user.lastName}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {parentRel.relation || "Guardian"}
                    </span>
                  </div>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {parentRel.parent.user.phone || "No phone provided"}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {parentRel.parent.user.email}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
