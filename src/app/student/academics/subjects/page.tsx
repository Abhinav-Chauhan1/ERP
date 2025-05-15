import { redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { StudentSubjectList } from "@/components/student/student-subject-list";

export const metadata: Metadata = {
  title: "My Subjects | Student Portal",
  description: "View all your enrolled subjects",
};

export default async function StudentSubjectsPage() {
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
          class: true,
          section: true
        }
      }
    }
  });

  if (!student || student.enrollments.length === 0) {
    redirect("/student");
  }

  const currentClass = student.enrollments[0].class;
  
  // Get all subjects assigned to the student's class
  const subjects = await db.subjectClass.findMany({
    where: {
      classId: currentClass.id
    },
    include: {
      subject: {
        include: {
          department: true,
          syllabus: true,
          teachers: {
            include: {
              teacher: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Format the subjects data
// Define interfaces for the data structure
interface Teacher {
    id: string;
    name: string;
}

interface FormattedSubject {
    id: string;
    name: string;
    code: string;
    department: string;
    hasSyllabus: boolean;
    teachers: Teacher[];
}

// Define interfaces for the database entities
interface User {
    id: string;
    firstName: string;
    lastName: string;
}

interface TeacherUser {
    user: User;
    id: string;
}

interface TeacherSubjectRelation {
    teacher: TeacherUser;
}

interface Department {
    name: string;
}

interface Syllabus {
    id: string;
}

interface SubjectEntity {
    id: string;
    name: string;
    code: string;
    department: Department | null;
    syllabus: Syllabus[];
    teachers: TeacherSubjectRelation[];
}

interface SubjectClass {
    subject: SubjectEntity;
}

const formattedSubjects: FormattedSubject[] = subjects.map((subjectClass: SubjectClass) => ({
        id: subjectClass.subject.id,
        name: subjectClass.subject.name,
        code: subjectClass.subject.code,
        department: subjectClass.subject.department?.name || 'General',
        hasSyllabus: subjectClass.subject.syllabus.length > 0,
        teachers: subjectClass.subject.teachers.map((relation: TeacherSubjectRelation) => ({
                id: relation.teacher.id,
                name: `${relation.teacher.user.firstName} ${relation.teacher.user.lastName}`,
        })),
}));

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Subjects</h1>
          <p className="text-gray-500">
            Class: {currentClass.name} {student.enrollments[0].section.name}
          </p>
        </div>
      </div>

      <StudentSubjectList subjects={formattedSubjects} />
    </div>
  );
}
