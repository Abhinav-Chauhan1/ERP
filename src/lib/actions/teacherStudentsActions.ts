"use server";

import { auth } from "@clerk/nextjs/server";
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
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId
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
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId
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

    // Get detailed student info
    const student = await db.student.findUnique({
      where: {
        id: studentId
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
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId
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

    // Get class and section info
    const classInfo = await db.class.findUnique({
      where: {
        id: classId
      },
      include: {
        sections: true
      }
    });

    if (!classInfo) {
      throw new Error("Class not found");
    }

    // Get students enrolled in this class
    const students = await db.student.findMany({
      where: {
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
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId
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

    // Get all students in these classes
    const students = await db.student.findMany({
      where: {
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
            exam: true
          }
        },
        assignments: {
          include: {
            assignment: true
          }
        }
      }
    });

    // Calculate performance metrics
    const classPerformance = teacherClasses.map(tc => {
      const classStudents = students.filter(s => 
        s.enrollments.some(ce => ce.classId === tc.classId)
      );

      const scores = classStudents.flatMap(s => [
        ...s.examResults.map(er => er.marksObtained / er.exam.totalMarks * 100),
        ...s.assignments
          .filter(as => as.grade !== null)
          .map(as => as.grade!)
      ]);

      const average = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;

      return {
        className: `${tc.class.name}${tc.class.sections[0] ? ` - ${tc.class.sections[0].name}` : ''}`,
        average,
        highest,
        lowest,
        studentCount: classStudents.length
      };
    });

    // Get subject performance (from exams)
    const subjectPerformance: Record<string, { total: number; count: number; passed: number }> = {};
    
    students.forEach(student => {
      student.examResults.forEach(result => {
        const subjectName = result.exam.name;
        const percentage = (result.marksObtained / result.exam.totalMarks) * 100;
        
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { total: 0, count: 0, passed: 0 };
        }
        
        subjectPerformance[subjectName].total += percentage;
        subjectPerformance[subjectName].count += 1;
        if (percentage >= 50) {
          subjectPerformance[subjectName].passed += 1;
        }
      });
    });

    const subjectPerformanceArray = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? data.total / data.count : 0,
      passRate: data.count > 0 ? (data.passed / data.count) * 100 : 0
    }));

    // Calculate student averages
    const studentAverages = students.map(student => {
      const scores = [
        ...student.examResults.map(er => er.marksObtained / er.exam.totalMarks * 100),
        ...student.assignments
          .filter(as => as.grade !== null)
          .map(as => as.grade!)
      ];

      const average = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;

      const enrollment = student.enrollments[0];
      const className = enrollment 
        ? `${enrollment.class.name}${enrollment.section ? ` - ${enrollment.section.name}` : ''}`
        : 'Unknown';

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        average,
        className
      };
    });

    // Top performers (>= 80%)
    const topPerformers = studentAverages
      .filter(s => s.average >= 80)
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    // Students needing attention (< 50%)
    const needsAttention = studentAverages
      .filter(s => s.average < 50 && s.average > 0)
      .sort((a, b) => a.average - b.average)
      .slice(0, 10);

    // Overall stats
    const allScores = studentAverages.map(s => s.average).filter(s => s > 0);
    const averageScore = allScores.length > 0 
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
      : 0;
    const passRate = allScores.length > 0
      ? (allScores.filter(s => s >= 50).length / allScores.length) * 100
      : 0;

    return {
      classPerformance,
      subjectPerformance: subjectPerformanceArray,
      topPerformers,
      needsAttention,
      overallStats: {
        totalStudents: students.length,
        averageScore,
        passRate,
        trend: "stable" as const // Could be calculated from historical data
      }
    };
  } catch (error) {
    console.error("Failed to get teacher students performance:", error);
    throw new Error(`Failed to get performance data: ${error instanceof Error ? error.message : String(error)}`);
  }
}
