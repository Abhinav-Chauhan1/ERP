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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">First Name</p>
            <p className="font-medium">{student.user?.firstName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Last Name</p>
            <p className="font-medium">{student.user?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium">{student.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Phone</p>
            <p className="font-medium">{student.user?.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
            <p className="font-medium">{student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Gender</p>
            <p className="font-medium">{student.gender}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Blood Group</p>
            <p className="font-medium">{student.bloodGroup || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Admission ID</p>
            <p className="font-medium">{student.admissionId}</p>
          </div>
        </div>
        
        {student.address && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Street Address</p>
                <p className="font-medium">{student.address}</p>
              </div>
            </div>
          </div>
        )}
        
        {student.emergencyContact && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <p className="font-medium">{student.emergencyContact}</p>
          </div>
        )}
        
        {student.parents && student.parents.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
            <div className="space-y-4">
              {student.parents.map((parentRel: any) => (
                <div key={parentRel.id} className="flex items-center justify-between p-4 rounded-md border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{parentRel.parent.user.firstName} {parentRel.parent.user.lastName}</h4>
                      <p className="text-sm text-muted-foreground">{parentRel.relation || "Guardian"}</p>
                      <p className="text-sm text-muted-foreground">{parentRel.parent.user.email}</p>
                      {parentRel.parent.user.phone && (
                        <p className="text-sm text-muted-foreground">{parentRel.parent.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
