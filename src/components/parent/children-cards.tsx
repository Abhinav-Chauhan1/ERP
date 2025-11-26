import Link from "next/link";
import { BarChart2, Book, Calendar, Clock, DollarSign, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ChildrenCardsProps {
  children: any[];
}

export function ChildrenCards({ children }: ChildrenCardsProps) {
  if (!children || children.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
        <p className="text-amber-700 dark:text-amber-300">No children are associated with your account. Please contact the school administration.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children.map((child) => {
        const currentEnrollment = child.enrollments[0] || {};
        
        return (
          <Card key={child.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={child.user.avatar} alt={child.user.firstName} />
                  <AvatarFallback className="text-lg">
                    {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {child.user.firstName} {child.user.lastName}
                    {child.isPrimary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {currentEnrollment.class?.name || 'No Class'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Book className="h-4 w-4" />
                      Section: {currentEnrollment.section?.name || 'N/A'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Roll #: {child.rollNumber || 'N/A'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      ID: {child.admissionId}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" asChild>
                      <Link href={`/parent/children/${child.id}/overview`}>
                        View Details
                      </Link>
                    </Button>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/parent/performance/results?childId=${child.id}`}>
                        <BarChart2 className="h-4 w-4 mr-1" />
                        Performance
                      </Link>
                    </Button>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/parent/fees/overview?childId=${child.id}`}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Fees
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
