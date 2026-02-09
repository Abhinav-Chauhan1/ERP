import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TeacherDetailClient } from "@/components/users/teacher-detail-client";

interface TeacherDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { id } = await params;

  // CRITICAL: Add school isolation
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const teacher = await db.teacher.findFirst({
    where: { 
      id,
      schoolId, // CRITICAL: Ensure teacher belongs to current school
    },
    include: {
      user: true,
      subjects: {
        include: {
          subject: true
        }
      },
      classes: {
        include: {
          class: true,
          section: true
        }
      },
      departments: true,
      attendance: {
        where: {
          schoolId, // CRITICAL: Filter attendance by school
        },
        orderBy: {
          date: 'desc'
        },
        take: 10
      },
      payrolls: {
        where: {
          schoolId, // CRITICAL: Filter payrolls by school
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ],
        take: 3
      }
    },
  });

  if (!teacher) {
    notFound();
  }

  // Serialize the data for the client component
  const serializedTeacher = {
    id: teacher.id,
    employeeId: teacher.employeeId,
    qualification: teacher.qualification,
    joinDate: teacher.joinDate,
    salary: teacher.salary ? Number(teacher.salary) : null,
    user: {
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      avatar: teacher.user.avatar,
      active: teacher.user.active,
    },
    subjects: teacher.subjects.map(st => ({
      id: st.id,
      subject: {
        name: st.subject.name,
        code: st.subject.code,
      },
    })),
    classes: teacher.classes.map(ct => ({
      id: ct.id,
      isClassHead: ct.isClassHead,
      class: {
        name: ct.class.name,
      },
      section: ct.section ? { name: ct.section.name } : null,
    })),
    departments: teacher.departments.map(d => ({
      id: d.id,
      name: d.name,
    })),
    attendance: teacher.attendance.map(a => ({
      id: a.id,
      date: a.date,
      status: a.status,
    })),
    payrolls: teacher.payrolls.map(p => ({
      id: p.id,
      month: p.month,
      year: p.year,
      basicSalary: Number(p.basicSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netSalary: Number(p.netSalary),
      status: p.status,
      paymentDate: p.paymentDate,
    })),
  };

  return <TeacherDetailClient teacher={serializedTeacher} />;
}

