"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get all students assigned to a teacher's classes
 */
export async function getTeacherStudents(options?: {
  search?: string;
  classId?: string;
  sectionId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record with school isolation
    const teacher = await db.teacher.findFirst({
      where: {
        schoolId, // Add school isolation
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get classes assigned to this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        class: {
          include: {
            sections: true
          }
        }
      }
    });

    const classIds = teacherClasses.map(tc => tc.classId);

    // Build where clause based on filters
    const whereClause: any = {
      enrollments: {
        some: {
          classId: options?.classId ? options.classId : { in: classIds },
          ...(options?.sectionId ? { sectionId: options.sectionId } : {})
        }
      }
    };

    // Add search functionality
    if (options?.search) {
      whereClause.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: options.search, mode: 'insensitive' } },
              { lastName: { contains: options.search, mode: 'insensitive' } },
              { email: { contains: options.search, mode: 'insensitive' } }
            ]
          }
        },
        { rollNumber: { contains: options.search, mode: 'insensitive' } },
        { admissionId: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    // Build query for students
    let orderBy: any = {};

    // Fix sorting based on valid fields
    switch (options?.sortBy) {
      case "name":
        orderBy = {
          user: {
            firstName: options?.sortOrder || "asc"
          }
        };
        break;
      case "rollNumber":
        orderBy = { rollNumber: options?.sortOrder || "asc" };
        break;
      case "metrics.attendancePercentage":
        // For metrics, we'll sort in JS after fetching data
        break;
      case "metrics.examPerformance":
        // For metrics, we'll sort in JS after fetching data
        break;
      case "metrics.assignmentCompletionRate":
        // For metrics, we'll sort in JS after fetching data
        break;
      case "metrics.overallPerformance":
        // For metrics, we'll sort in JS after fetching data
        break;
      default:
        orderBy = {
          user: {
            firstName: "asc"
          }
        };
    }

    // Get all students from these classes
    const students = await db.student.findMany({
      where: {
        enrollments: {
          some: {
            classId: {
              in: classIds,
            },
            ...(options?.sectionId ? { sectionId: options.sectionId } : {}),
          },
        },
        ...(options?.search ? {
          OR: [
            { user: { firstName: { contains: options.search, mode: "insensitive" } } },
            { user: { lastName: { contains: options.search, mode: "insensitive" } } },
            { rollNumber: { contains: options.search, mode: "insensitive" } },
            { admissionId: { contains: options.search, mode: "insensitive" } },
          ]
        } : {}),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        enrollments: {
          where: {
            classId: options?.classId ? options.classId : { in: classIds },
            ...(options?.sectionId ? { sectionId: options.sectionId } : {})
          },
          include: {
            class: true,
            section: true
          }
        },
        attendance: {
          take: 30,
          orderBy: {
            date: 'desc'
          }
        },
        examResults: {
          take: 5,
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          include: {
            exam: true
          }
        },
        assignments: {
          take: 5,
          orderBy: {
            submissionDate: 'desc'
          },
          include: {
            assignment: true
          }
        }
      },
      orderBy: orderBy,
    });

    // Calculate performance metrics
    const studentsWithMetrics = students.map(student => {
      // Calculate attendance percentage
      const totalAttendanceRecords = student.attendance.length;
      const presentDays = student.attendance.filter(a => a.status === "PRESENT").length;
      const attendancePercentage = totalAttendanceRecords > 0
        ? (presentDays / totalAttendanceRecords) * 100
        : 0;

      // Calculate exam performance
      const totalExams = student.examResults.length;
      const totalExamScore = student.examResults.reduce((sum, result) => {
        return sum + (result.marks / result.exam.totalMarks) * 100;
      }, 0);
      const examPerformance = totalExams > 0 ? totalExamScore / totalExams : 0;

      // Assignment completion rate
      const totalAssignments = student.assignments.length;
      const completedAssignments = student.assignments.filter(a =>
        a.status === "SUBMITTED" || a.status === "GRADED"
      ).length;
      const assignmentCompletionRate = totalAssignments > 0
        ? (completedAssignments / totalAssignments) * 100
        : 0;

      // Overall performance
      const overallPerformance = (attendancePercentage * 0.3) + (examPerformance * 0.4) + (assignmentCompletionRate * 0.3);

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        avatar: student.user.avatar,
        rollNumber: student.rollNumber || "",
        admissionId: student.admissionId,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        className: student.enrollments[0]?.class.name || "Not Assigned",
        section: student.enrollments[0]?.section.name || "Not Assigned",
        classId: student.enrollments[0]?.classId,
        sectionId: student.enrollments[0]?.sectionId,
        metrics: {
          attendancePercentage: Math.round(attendancePercentage),
          examPerformance: Math.round(examPerformance),
          assignmentCompletionRate: Math.round(assignmentCompletionRate),
          overallPerformance: Math.round(overallPerformance)
        },
        recentActivity: {
          lastAttendance: student.attendance[0] || null,
          lastExamResult: student.examResults[0] || null,
          lastAssignment: student.assignments[0] || null
        }
      };
    });

    // Get the list of classes and sections for filtering
    const classes = teacherClasses.map(tc => ({
      id: tc.class.id,
      name: tc.class.name,
      sections: tc.class.sections.map(section => ({
        id: section.id,
        name: section.name
      }))
    }));

    return {
      students: studentsWithMetrics,
      classes,
      filters: {
        search: options?.search || "",
        classId: options?.classId || "",
        sectionId: options?.sectionId || "",
        sortBy: options?.sortBy || "name",
        sortOrder: options?.sortOrder || "asc"
      }
    };
  } catch (error) {
    console.error("Failed to get teacher students:", error);
    throw new Error(`Failed to get students: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a single student's details for a teacher
 */
export async function getStudentDetails(studentId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record with school isolation
    const teacher = await db.teacher.findFirst({
      where: {
        schoolId, // Add school isolation
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get classes assigned to this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id
      },
      select: {
        classId: true
      }
    });

    const classIds = teacherClasses.map(tc => tc.classId);

    // Verify this student belongs to one of the teacher's classes
    const studentEnrollment = await db.classEnrollment.findFirst({
      where: {
        studentId: studentId,
        classId: {
          in: classIds
        }
      }
    });

    if (!studentEnrollment) {
      throw new Error("Student not found in your classes");
    }

    // Get detailed student info with school isolation
    const student = await db.student.findUnique({
      where: {
        id: studentId,
        schoolId, // Add school isolation
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true
          }
        },
        enrollments: {
          where: {
            status: "ACTIVE"
          },
          include: {
            class: true,
            section: true
          }
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        attendance: {
          orderBy: {
            date: 'desc'
          },
          take: 90, // Last 3 months
          include: {
            section: {
              include: {
                class: true
              }
            }
          }
        },
        examResults: {
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          }
        },
        assignments: {
          orderBy: {
            assignment: {
              dueDate: 'desc'
            }
          },
          include: {
            assignment: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Calculate attendance statistics
    const attendanceStats = {
      total: student.attendance.length,
      present: student.attendance.filter(a => a.status === "PRESENT").length,
      absent: student.attendance.filter(a => a.status === "ABSENT").length,
      late: student.attendance.filter(a => a.status === "LATE").length,
      leave: student.attendance.filter(a => a.status === "LEAVE").length,
      halfDay: student.attendance.filter(a => a.status === "HALF_DAY").length,
      percentage: 0
    };

    attendanceStats.percentage = attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    // Calculate subject performance
    const subjectPerformance: Record<string, any> = {};

    // Process exam results by subject
    student.examResults.forEach(result => {
      const subjectId = result.exam.subjectId;
      const subjectName = result.exam.subject.name;

      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = {
          id: subjectId,
          name: subjectName,
          totalExams: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          percentage: 0,
          assignments: {
            total: 0,
            completed: 0,
            percentage: 0
          }
        };
      }

      subjectPerformance[subjectId].totalExams++;
      subjectPerformance[subjectId].totalMarks += result.exam.totalMarks;
      subjectPerformance[subjectId].obtainedMarks += result.marks;
    });

    // Process assignment submissions by subject
    student.assignments.forEach(submission => {
      const subjectId = submission.assignment.subjectId;
      const subjectName = submission.assignment.subject.name;

      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = {
          id: subjectId,
          name: subjectName,
          totalExams: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          percentage: 0,
          assignments: {
            total: 0,
            completed: 0,
            percentage: 0
          }
        };
      }

      subjectPerformance[subjectId].assignments.total++;
      if (submission.status === "SUBMITTED" || submission.status === "GRADED") {
        subjectPerformance[subjectId].assignments.completed++;
      }
    });

    // Calculate percentages
    Object.values(subjectPerformance).forEach((subject: any) => {
      subject.percentage = subject.totalMarks > 0
        ? Math.round((subject.obtainedMarks / subject.totalMarks) * 100)
        : 0;

      subject.assignments.percentage = subject.assignments.total > 0
        ? Math.round((subject.assignments.completed / subject.assignments.total) * 100)
        : 0;
    });

    // Format exam results
    const exams = student.examResults.map(result => ({
      id: result.id,
      examId: result.examId,
      title: result.exam.title,
      subject: result.exam.subject.name,
      date: result.exam.examDate,
      totalMarks: result.exam.totalMarks,
      obtainedMarks: result.marks,
      percentage: Math.round((result.marks / result.exam.totalMarks) * 100),
      grade: result.grade || "-",
      remarks: result.remarks || "-"
    }));

    // Format assignment submissions
    const assignments = student.assignments.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignmentId,
      title: submission.assignment.title,
      subject: submission.assignment.subject.name,
      dueDate: submission.assignment.dueDate,
      submissionDate: submission.submissionDate,
      totalMarks: submission.assignment.totalMarks,
      obtainedMarks: submission.marks || 0,
      status: submission.status,
      feedback: submission.feedback || "-",
      isLate: submission.submissionDate && submission.assignment.dueDate
        ? new Date(submission.submissionDate) > new Date(submission.assignment.dueDate)
        : false
    }));

    // Format attendance records
    const attendanceRecords = student.attendance.map(record => ({
      id: record.id,
      date: record.date,
      status: record.status,
      class: record.section.class.name,
      section: record.section.name,
      reason: record.reason || "-"
    }));

    // Contact information
    const primaryParent = student.parents.find(p => p.isPrimary)?.parent;

    const contactInfo = {
      studentEmail: student.user.email,
      studentPhone: student.user.phone || "-",
      parentName: primaryParent
        ? `${primaryParent.user.firstName} ${primaryParent.user.lastName}`
        : "-",
      parentEmail: primaryParent?.user.email || "-",
      parentPhone: primaryParent?.user.phone || "-",
      relation: primaryParent?.relation || "-",
      emergencyContact: student.emergencyContact || "-"
    };

    return {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      admissionId: student.admissionId,
      rollNumber: student.rollNumber || "-",
      avatar: student.user.avatar,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      class: student.enrollments[0]?.class.name || "Not Assigned",
      section: student.enrollments[0]?.section.name || "Not Assigned",
      address: student.address || "-",
      bloodGroup: student.bloodGroup || "-",
      contactInfo,
      attendanceStats,
      subjectPerformance: Object.values(subjectPerformance),
      exams,
      assignments,
      attendanceRecords
    };
  } catch (error) {
    console.error("Failed to get student details:", error);
    throw new Error(`Failed to get student details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get students for a specific class
 */
export async function getClassStudents(classId: string, sectionId?: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record with school isolation
    const teacher = await db.teacher.findFirst({
      where: {
        schoolId, // Add school isolation
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify teacher is assigned to this class
    const teacherClass = await db.classTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        classId: classId
      }
    });

    if (!teacherClass) {
      throw new Error("You are not assigned to this class");
    }

    // Get class and section info with school isolation
    const classInfo = await db.class.findUnique({
      where: {
        id: classId,
        schoolId, // Add school isolation
      },
      include: {
        sections: true
      }
    });

    if (!classInfo) {
      throw new Error("Class not found");
    }

    // Get students enrolled in this class with school isolation
    const students = await db.student.findMany({
      where: {
        schoolId, // Add school isolation
        enrollments: {
          some: {
            classId: classId,
            ...(sectionId ? { sectionId: sectionId } : {})
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        enrollments: {
          where: {
            classId: classId,
            ...(sectionId ? { sectionId: sectionId } : {})
          },
          include: {
            section: true
          }
        },
        attendance: {
          where: {
            section: {
              classId: classId
            },
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
          }
        },
        examResults: {
          take: 5,
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          include: {
            exam: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    const formattedStudents = students.map(student => {
      // Calculate attendance
      const totalAttendance = student.attendance.length;
      const presentDays = student.attendance.filter(a => a.status === "PRESENT").length;
      const attendancePercentage = totalAttendance > 0
        ? Math.round((presentDays / totalAttendance) * 100)
        : 0;

      // Average exam score
      const examResults = student.examResults;
      const averageScore = examResults.length > 0
        ? Math.round(examResults.reduce((sum, result) => {
          return sum + (result.marks / result.exam.totalMarks) * 100;
        }, 0) / examResults.length)
        : 0;

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        avatar: student.user.avatar,
        rollNumber: student.rollNumber || "-",
        section: student.enrollments[0]?.section.name || "Not Assigned",
        sectionId: student.enrollments[0]?.sectionId,
        attendance: attendancePercentage,
        performance: averageScore,
        lastExamScore: student.examResults[0]
          ? Math.round((student.examResults[0].marks / student.examResults[0].exam.totalMarks) * 100)
          : null
      };
    });

    return {
      className: classInfo.name,
      sections: classInfo.sections,
      students: formattedStudents
    };
  } catch (error) {
    console.error("Failed to get class students:", error);
    throw new Error(`Failed to get class students: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Get performance overview for all students in teacher's classes
 */
export async function getTeacherStudentsPerformance() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record with school isolation
    const teacher = await db.teacher.findFirst({
      where: {
        schoolId, // Add school isolation
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get classes assigned to this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        class: {
          include: {
            sections: true
          }
        }
      }
    });

    const classIds = teacherClasses.map(tc => tc.classId);

    // Get all students in these classes with school isolation
    const students = await db.student.findMany({
      where: {
        schoolId, // Add school isolation
        enrollments: {
          some: {
            classId: {
              in: classIds
            }
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        enrollments: {
          where: {
            classId: {
              in: classIds
            }
          },
          include: {
            class: true,
            section: true
          }
        },
        examResults: {
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          }
        },
        assignments: {
          include: {
            assignment: true
          }
        }
      }
    });

    // Data structures for aggregation
    const classStats: Record<string, { total: number; count: number; scores: number[] }> = {};
    const subjectStats: Record<string, { total: number; count: number; passCount: number }> = {};
    const studentPerformances: Array<{ id: string; name: string; average: number; className: string }> = [];

    // Process each student
    students.forEach(student => {
      // Calculate student average
      const examResults = student.examResults || [];
      const totalScore = examResults.reduce((sum, res) => sum + (res.marks / res.exam.totalMarks) * 100, 0);
      const studentAverage = examResults.length > 0 ? totalScore / examResults.length : 0;

      const className = student.enrollments[0]?.class.name || "Unknown Class";

      // Store student performance
      if (examResults.length > 0) {
        studentPerformances.push({
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          average: studentAverage,
          className
        });
      }

      // Aggregate class stats
      if (!classStats[className]) {
        classStats[className] = { total: 0, count: 0, scores: [] };
      }
      if (examResults.length > 0) { // Only count students with exams for class averages
        classStats[className].total += studentAverage;
        classStats[className].count += 1;
        classStats[className].scores.push(studentAverage);
      }

      // Aggregate subject stats
      examResults.forEach(res => {
        const subjectName = res.exam.subject?.name || "Unknown Subject";
        if (!subjectStats[subjectName]) {
          subjectStats[subjectName] = { total: 0, count: 0, passCount: 0 };
        }
        const score = (res.marks / res.exam.totalMarks) * 100;
        subjectStats[subjectName].total += score;
        subjectStats[subjectName].count += 1;
        if (score >= 40) { // Assuming 40% is pass
          subjectStats[subjectName].passCount += 1;
        }
      });
    });

    // Format Class Performance
    const classPerformance = Object.entries(classStats).map(([className, stats]) => ({
      className,
      average: stats.count > 0 ? stats.total / stats.count : 0,
      highest: stats.scores.length > 0 ? Math.max(...stats.scores) : 0,
      lowest: stats.scores.length > 0 ? Math.min(...stats.scores) : 0,
      studentCount: stats.count
    }));

    // Format Subject Performance
    const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      average: stats.count > 0 ? stats.total / stats.count : 0,
      passRate: stats.count > 0 ? (stats.passCount / stats.count) * 100 : 0
    }));

    // Format Top Performers & Needs Attention
    studentPerformances.sort((a, b) => b.average - a.average);
    const topPerformers = studentPerformances.slice(0, 5);
    const needsAttention = [...studentPerformances].reverse().slice(0, 5).filter(s => s.average < 50); // Show lowest if average < 50

    // Overall Stats
    const totalAvgScore = studentPerformances.length > 0
      ? studentPerformances.reduce((sum, s) => sum + s.average, 0) / studentPerformances.length
      : 0;

    // Calculate overall pass rate (students with avg >= 40%)
    const passingStudents = studentPerformances.filter(s => s.average >= 40).length;
    const overallPassRate = studentPerformances.length > 0
      ? (passingStudents / studentPerformances.length) * 100
      : 0;

    return {
      classPerformance,
      subjectPerformance,
      topPerformers,
      needsAttention,
      overallStats: {
        totalStudents: students.length,
        averageScore: totalAvgScore,
        passRate: overallPassRate,
        trend: "stable" as "stable" | "up" | "down" // Placeholder
      }
    };
  } catch (error) {
    console.error("Failed to get performance metrics:", error);
    throw new Error("Failed to get performance metrics");
  }
}
