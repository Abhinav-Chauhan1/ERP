import { redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { StudentAssignmentList } from "@/components/student/student-assignment-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, CheckCircle, X } from "lucide-react";

export const metadata: Metadata = {
  title: "My Assignments | Student Portal",
  description: "View and manage your assignments",
};

export default async function StudentAssignmentsPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: true
        }
      }
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get current class ID
  const currentClassId = student.enrollments[0]?.class.id;

  // Get all subject IDs for the current class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentClassId
    },
    select: {
      subjectId: true
    }
  });

// Define interface for subject class structure
interface SubjectClass {
    subjectId: string;
}

// Extract subject IDs from the subject classes
const subjectIds: string[] = subjectClasses.map((sc: SubjectClass) => sc.subjectId);

  // Get all assignments for these subjects
  const assignments = await db.assignment.findMany({
    where: {
      subjectId: {
        in: subjectIds
      }
    },
    include: {
      subject: true,
      creator: {
        include: {
          user: true
        }
      },
      submissions: {
        where: {
          studentId: student.id
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  // Group assignments by status
// Define interface for submission structure
interface AssignmentSubmission {
    status: string;
}

// Define interface for assignment with submissions
interface AssignmentWithSubmissions {
    dueDate: string | Date;
    submissions: AssignmentSubmission[];
}

const pending = assignments.filter((a: AssignmentWithSubmissions) => 
    a.submissions.length === 0 && new Date(a.dueDate) >= new Date()
);
  
// Define interface for assignment with submission status
interface AssignmentWithSubmission extends AssignmentWithSubmissions {
    submissions: Array<{
        status: string;
    }>;
}

const submitted = assignments.filter((a: AssignmentWithSubmission) => 
    a.submissions.length > 0 && a.submissions[0].status !== "GRADED"
);
  
interface AssignmentWithGradedSubmission {
    submissions: Array<{
        status: string;
    }>;
}

const graded = assignments.filter((a: AssignmentWithGradedSubmission) => 
    a.submissions.length > 0 && a.submissions[0].status === "GRADED"
);
  
// Define interface for assignment with due date
interface AssignmentWithDueDate {
    dueDate: string | Date;
    submissions: AssignmentSubmission[];
}

const overdue = assignments.filter((a: AssignmentWithDueDate) => 
    a.submissions.length === 0 && new Date(a.dueDate) < new Date()
);

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="pending" className="flex gap-2 items-center">
            <div className="relative">
              <UploadCloud className="h-4 w-4" />
              {pending.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </div>
            Pending
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex gap-2 items-center">
            <div className="relative">
              <CheckCircle className="h-4 w-4" />
              {submitted.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {submitted.length}
                </span>
              )}
            </div>
            Submitted
          </TabsTrigger>
          <TabsTrigger value="graded" className="flex gap-2 items-center">
            <div className="relative">
              <CheckCircle className="h-4 w-4" />
              {graded.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {graded.length}
                </span>
              )}
            </div>
            Graded
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex gap-2 items-center">
            <div className="relative">
              <X className="h-4 w-4" />
              {overdue.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {overdue.length}
                </span>
              )}
            </div>
            Overdue
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <StudentAssignmentList 
            assignments={pending as any} 
            studentId={student.id} 
            type="pending" 
          />
        </TabsContent>
        
        <TabsContent value="submitted">
          <StudentAssignmentList 
            assignments={submitted as any} 
            studentId={student.id} 
            type="submitted" 
          />
        </TabsContent>
        
        <TabsContent value="graded">
          <StudentAssignmentList 
            assignments={graded as any} 
            studentId={student.id} 
            type="graded" 
          />
        </TabsContent>
        
        <TabsContent value="overdue">
          <StudentAssignmentList 
            assignments={overdue as any} 
            studentId={student.id} 
            type="overdue"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
