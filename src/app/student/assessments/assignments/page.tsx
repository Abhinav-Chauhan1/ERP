export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { StudentAssignmentList } from "@/components/student/student-assignment-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Assignments | Student Portal",
  description: "View and manage your assignments",
};

export default async function StudentAssignmentsPage() {
  // Use direct authentication instead of getCurrentUserDetails
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
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

  // Before passing assignments to StudentAssignmentList, map subject to only include needed fields
  const assignmentsWithSubjectName = assignments.map(a => ({
    ...a,
    subject: {
      name: a.subject?.name || "",
      code: a.subject?.code || ""
    }
  }));

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

const pending = assignmentsWithSubjectName.filter((a: AssignmentWithSubmissions) => 
    a.submissions.length === 0 && new Date(a.dueDate) >= new Date()
);
  
// Define interface for assignment with submission status
interface AssignmentWithSubmission extends AssignmentWithSubmissions {
    submissions: Array<{
        status: string;
    }>;
}

const submitted = assignmentsWithSubjectName.filter((a: AssignmentWithSubmission) => 
    a.submissions.length > 0 && a.submissions[0].status !== "GRADED"
);
  
interface AssignmentWithGradedSubmission {
    submissions: Array<{
        status: string;
    }>;
}

const graded = assignmentsWithSubjectName.filter((a: AssignmentWithGradedSubmission) => 
    a.submissions.length > 0 && a.submissions[0].status === "GRADED"
);
  
// Define interface for assignment with due date
interface AssignmentWithDueDate {
    dueDate: string | Date;
    submissions: AssignmentSubmission[];
}

const overdue = assignmentsWithSubjectName.filter((a: AssignmentWithDueDate) => 
    a.submissions.length === 0 && new Date(a.dueDate) < new Date()
);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Manage your assignments and submissions
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pending.length > 0 && (
              <Badge className="ml-2 bg-amber-500">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted
            {submitted.length > 0 && (
              <Badge className="ml-2 bg-blue-500">{submitted.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded
            {graded.length > 0 && (
              <Badge className="ml-2 bg-green-500">{graded.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            {overdue.length > 0 && (
              <Badge className="ml-2 bg-red-500">{overdue.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-6">
          <StudentAssignmentList 
            assignments={pending as any} 
            studentId={student.id} 
            type="pending" 
          />
        </TabsContent>
        
        <TabsContent value="submitted" className="space-y-4 mt-6">
          <StudentAssignmentList 
            assignments={submitted as any} 
            studentId={student.id} 
            type="submitted" 
          />
        </TabsContent>
        
        <TabsContent value="graded" className="space-y-4 mt-6">
          <StudentAssignmentList 
            assignments={graded as any} 
            studentId={student.id} 
            type="graded" 
          />
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4 mt-6">
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
