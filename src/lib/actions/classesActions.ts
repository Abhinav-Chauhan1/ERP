"use server";

import {
  getClassDeletionCascadeInfo,
  logCascadeDeletion,
  validateClassDeletionSafety
} from "@/lib/services/cascade-deletion.service";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ClassFormValues,
  ClassUpdateFormValues,
  ClassSectionFormValues,
  ClassSectionUpdateFormValues,
  ClassTeacherFormValues,
  ClassTeacherUpdateFormValues,
  StudentEnrollmentFormValues,
  StudentEnrollmentUpdateFormValues
} from "../schemaValidation/classesSchemaValidation";

// Get all classes with basic info
export async function getClasses(academicYearFilter?: string) {
  try {
    const where = academicYearFilter ? { academicYearId: academicYearFilter } : {};

    const classes = await db.class.findMany({
      where,
      include: {
        academicYear: {
          select: {
            name: true,
            isCurrent: true,
          }
        },
        sections: {
          select: {
            id: true,
            name: true,
          }
        },
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                employeeId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
          }
        }
      },
      orderBy: [
        { academicYear: { startDate: 'desc' } },
        { name: 'asc' },
      ],
    });

    // Group classes by "grade" (extract from name)
    const classesByGrade = classes.reduce((acc: any, cls) => {
      const gradeName = cls.name.split(' ')[0] + ' ' + (cls.name.split(' ')[1] || '');

      if (!acc[gradeName]) {
        acc[gradeName] = {
          grade: gradeName,
          classes: 0,
          students: 0,
          sections: [],
          academicYear: cls.academicYear.name,
          isCurrent: cls.academicYear.isCurrent
        };
      }

      acc[gradeName].classes += 1;
      acc[gradeName].students += cls._count.enrollments;

      // Add unique sections
      cls.sections.forEach(section => {
        if (!acc[gradeName].sections.includes(section.name)) {
          acc[gradeName].sections.push(section.name);
        }
      });

      return acc;
    }, {});

    return {
      success: true,
      data: classes,
      summary: Object.values(classesByGrade)
    };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
}

// Get a single class by ID with detailed information
export async function getClassById(id: string) {
  try {
    const classDetails = await db.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        sections: {
          include: {
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        },
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                  }
                }
              }
            }
          }
        },
        subjects: {
          include: {
            subject: {
              include: {
                teachers: {
                  include: {
                    teacher: {
                      include: {
                        user: {
                          select: {
                            firstName: true,
                            lastName: true,
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        timetableSlots: {
          include: {
            timetable: true,
            subjectTeacher: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      }
                    }
                  }
                }
              }
            },
            room: true,
            section: true,
          },
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' },
          ]
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  }
                }
              }
            },
            section: true,
          }
        }
      }
    });

    if (!classDetails) {
      return { success: false, error: "Class not found" };
    }

    // Format the data for the frontend
    const formattedClass = {
      id: classDetails.id,
      name: classDetails.name,
      year: classDetails.academicYear.name,
      yearId: classDetails.academicYearId,
      isCurrent: classDetails.academicYear.isCurrent,
      sections: classDetails.sections.map(section => ({
        id: section.id,
        name: section.name,
        capacity: section.capacity,
        students: section._count.enrollments
      })),
      classTeacher: classDetails.teachers.find(t => t.isClassHead)?.teacher.user.firstName + ' ' +
        classDetails.teachers.find(t => t.isClassHead)?.teacher.user.lastName,
      classTeacherId: classDetails.teachers.find(t => t.isClassHead)?.teacher.id,
      teachers: classDetails.teachers.map(teacher => ({
        id: teacher.id,
        teacherId: teacher.teacherId,
        name: teacher.teacher.user.firstName + ' ' + teacher.teacher.user.lastName,
        isClassHead: teacher.isClassHead,
        email: teacher.teacher.user.email,
        avatar: teacher.teacher.user.avatar,
        employeeId: teacher.teacher.employeeId
      })),
      subjects: classDetails.subjects.map(subj => {
        const teacher = subj.subject.teachers[0]?.teacher;
        return {
          id: subj.subjectId,
          name: subj.subject.name,
          code: subj.subject.code,
          teacher: teacher ? `${teacher.user.firstName} ${teacher.user.lastName}` : 'Not Assigned',
          teacherId: teacher?.id
        };
      }),
      students: classDetails.enrollments.map(enrollment => ({
        id: enrollment.studentId,
        enrollmentId: enrollment.id,
        rollNumber: enrollment.rollNumber || 'N/A',
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        avatar: enrollment.student.user.avatar,
        section: enrollment.section.name,
        sectionId: enrollment.sectionId,
        status: enrollment.status
      })),
      // Group timetable by day
      timetable: Object.values(classDetails.timetableSlots.reduce((acc: any, slot) => {
        if (!acc[slot.day]) {
          acc[slot.day] = {
            day: slot.day,
            periods: []
          };
        }

        acc[slot.day].periods.push({
          id: slot.id,
          time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subjectTeacher.subject.name,
          subjectId: slot.subjectTeacher.subject.id,
          teacher: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`,
          teacherId: slot.subjectTeacher.teacherId,
          room: slot.room?.name || 'Not Assigned',
          roomId: slot.roomId,
          section: slot.section?.name,
          sectionId: slot.sectionId
        });

        return acc;
      }, {})),
      // Fetch exams for this class based on subjects and academic year
      exams: await getExamsForClass(id, classDetails.academicYearId),
    };

    return { success: true, data: formattedClass };
  } catch (error) {
    console.error("Error fetching class details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class details"
    };
  }
}

// Create a new class
export async function createClass(data: ClassFormValues) {
  try {
    // Ensure academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: data.academicYearId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    const newClass = await db.class.create({
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
      }
    });

    revalidatePath("/admin/classes");
    return { success: true, data: newClass };
  } catch (error) {
    console.error("Error creating class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class"
    };
  }
}

// Update an existing class
export async function updateClass(data: ClassUpdateFormValues) {
  try {
    // Ensure class exists
    const existingClass = await db.class.findUnique({
      where: { id: data.id }
    });

    if (!existingClass) {
      return { success: false, error: "Class not found" };
    }

    // Ensure academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: data.academicYearId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    const updatedClass = await db.class.update({
      where: { id: data.id },
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${data.id}`);
    return { success: true, data: updatedClass };
  } catch (error) {
    console.error("Error updating class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class"
    };
  }
}

// Delete a class
export async function deleteClass(id: string) {
  try {
    // Check if class has any enrollments, timetable slots, etc.
    const enrollments = await db.classEnrollment.findFirst({ where: { classId: id } });
    const timetableSlots = await db.timetableSlot.findFirst({ where: { classId: id } });

    if (enrollments || timetableSlots) {
      return {
        success: false,
        error: "Cannot delete this class because it has associated data. Please remove all students and timetable entries first."
      };
    }

    // Get cascade deletion information and log it
    const cascadeInfo = await getClassDeletionCascadeInfo(id);
    logCascadeDeletion(cascadeInfo);

    // Validate deletion safety and get warnings
    const safetyCheck = await validateClassDeletionSafety(id);
    if (safetyCheck.warnings.length > 0) {
      console.warn(`[CASCADE DELETE] Warnings for class ${id}:`, safetyCheck.warnings);
    }

    // Delete class sections
    await db.classSection.deleteMany({ where: { classId: id } });

    // Delete class teacher assignments
    await db.classTeacher.deleteMany({ where: { classId: id } });

    // Delete subject-class relationships
    await db.subjectClass.deleteMany({ where: { classId: id } });

    // Delete the class (cascade will handle FeeStructureClass and FeeTypeClassAmount)
    await db.class.delete({ where: { id } });

    console.log(`[CASCADE DELETE] Successfully deleted class ${cascadeInfo.className} (${id}) and ${cascadeInfo.totalRecordsAffected} related fee records`);

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class"
    };
  }
}

// Create a new class section
export async function createClassSection(data: ClassSectionFormValues) {
  try {
    // Ensure class exists
    const existingClass = await db.class.findUnique({
      where: { id: data.classId }
    });

    if (!existingClass) {
      return { success: false, error: "Class not found" };
    }

    // Check if section name already exists for this class
    const existingSection = await db.classSection.findFirst({
      where: {
        classId: data.classId,
        name: data.name
      }
    });

    if (existingSection) {
      return { success: false, error: "A section with this name already exists for this class" };
    }

    const newSection = await db.classSection.create({
      data: {
        name: data.name,
        classId: data.classId,
        capacity: data.capacity,
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: newSection };
  } catch (error) {
    console.error("Error creating class section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class section"
    };
  }
}

// Update an existing class section
export async function updateClassSection(data: ClassSectionUpdateFormValues) {
  try {
    // Ensure section exists
    const existingSection = await db.classSection.findUnique({
      where: { id: data.id },
      include: { class: true }
    });

    if (!existingSection) {
      return { success: false, error: "Section not found" };
    }

    // Check if section name already exists for this class (except this section)
    const duplicateSection = await db.classSection.findFirst({
      where: {
        id: { not: data.id },
        classId: data.classId,
        name: data.name
      }
    });

    if (duplicateSection) {
      return { success: false, error: "Another section with this name already exists for this class" };
    }

    const updatedSection = await db.classSection.update({
      where: { id: data.id },
      data: {
        name: data.name,
        capacity: data.capacity,
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: updatedSection };
  } catch (error) {
    console.error("Error updating class section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class section"
    };
  }
}

// Delete a class section
export async function deleteClassSection(id: string) {
  try {
    // Get section details to revalidate paths
    const section = await db.classSection.findUnique({
      where: { id },
      select: { classId: true }
    });

    if (!section) {
      return { success: false, error: "Section not found" };
    }

    // Check if section has any enrollments or timetable slots
    const enrollments = await db.classEnrollment.findFirst({ where: { sectionId: id } });
    const timetableSlots = await db.timetableSlot.findFirst({ where: { sectionId: id } });

    if (enrollments || timetableSlots) {
      return {
        success: false,
        error: "Cannot delete this section because it has associated data. Please remove all students and timetable entries first."
      };
    }

    // Delete the section
    await db.classSection.delete({ where: { id } });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${section.classId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting class section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class section"
    };
  }
}

// Assign teacher to class
export async function assignTeacherToClass(data: ClassTeacherFormValues) {
  try {
    // Check if this teacher is already assigned to this class
    const existingAssignment = await db.classTeacher.findFirst({
      where: {
        classId: data.classId,
        teacherId: data.teacherId
      }
    });

    if (existingAssignment) {
      return { success: false, error: "This teacher is already assigned to this class" };
    }

    // If this teacher will be the class head, remove class head status from any other teacher
    if (data.isClassHead) {
      await db.classTeacher.updateMany({
        where: {
          classId: data.classId,
          isClassHead: true
        },
        data: {
          isClassHead: false
        }
      });
    }

    const assignment = await db.classTeacher.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        isClassHead: data.isClassHead
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error assigning teacher to class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign teacher to class"
    };
  }
}

// Update teacher assignment
export async function updateTeacherAssignment(data: ClassTeacherUpdateFormValues) {
  try {
    // Check if assignment exists
    const existingAssignment = await db.classTeacher.findUnique({
      where: { id: data.id }
    });

    if (!existingAssignment) {
      return { success: false, error: "Teacher assignment not found" };
    }

    // If this teacher will be the class head, remove class head status from any other teacher
    if (data.isClassHead) {
      await db.classTeacher.updateMany({
        where: {
          id: { not: data.id },
          classId: data.classId,
          isClassHead: true
        },
        data: {
          isClassHead: false
        }
      });
    }

    const updatedAssignment = await db.classTeacher.update({
      where: { id: data.id },
      data: {
        isClassHead: data.isClassHead
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: updatedAssignment };
  } catch (error) {
    console.error("Error updating teacher assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update teacher assignment"
    };
  }
}

// Remove teacher from class
export async function removeTeacherFromClass(id: string) {
  try {
    // Get assignment details to revalidate paths
    const assignment = await db.classTeacher.findUnique({
      where: { id },
      select: { classId: true }
    });

    if (!assignment) {
      return { success: false, error: "Teacher assignment not found" };
    }

    await db.classTeacher.delete({ where: { id } });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${assignment.classId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing teacher from class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove teacher from class"
    };
  }
}

// Get all academic years for dropdown
export async function getAcademicYearsForDropdown() {
  try {
    const academicYears = await db.academicYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        name: true,
        isCurrent: true
      }
    });

    // Sort to show current year first
    const sortedYears = academicYears.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });

    return { success: true, data: sortedYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    };
  }
}

// Get all teachers for dropdown
export async function getTeachersForDropdown() {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    // Format the response
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      employeeId: teacher.employeeId,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      avatar: teacher.user.avatar
    }));

    return { success: true, data: formattedTeachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teachers"
    };
  }
}

// Get available students for a class
export async function getAvailableStudentsForClass(classId: string) {
  try {
    // First, get the class to check academic year
    const classData = await db.class.findUnique({
      where: { id: classId },
      select: { academicYearId: true }
    });

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    // Get IDs of students already enrolled in this class
    const enrolledStudents = await db.classEnrollment.findMany({
      where: { classId: classId },
      select: { studentId: true }
    });

    const enrolledStudentIds = enrolledStudents.map(enrollment => enrollment.studentId);

    // Get all active students not already enrolled in this class
    const availableStudents = await db.student.findMany({
      where: {
        id: { notIn: enrolledStudentIds },
        user: { active: true },
      },
      select: {
        id: true,
        admissionId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: [
        { user: { firstName: 'asc' } },
      ],
    });

    // Format the response
    const formattedStudents = availableStudents.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      admissionId: student.admissionId,
    }));

    return { success: true, data: formattedStudents };
  } catch (error) {
    console.error("Error fetching available students:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available students"
    };
  }
}

// Enroll a student in a class
export async function enrollStudentInClass(data: StudentEnrollmentFormValues) {
  try {
    // Validate inputs
    const student = await db.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    const classSection = await db.classSection.findUnique({
      where: { id: data.sectionId },
      include: {
        class: true,
        _count: { select: { enrollments: true } }
      }
    });

    if (!classSection) {
      return { success: false, error: "Section not found" };
    }

    // Check if section has capacity
    if (classSection.capacity && classSection._count.enrollments >= classSection.capacity) {
      return { success: false, error: "Section is at full capacity" };
    }

    // Check if student is already enrolled in the class
    const existingEnrollment = await db.classEnrollment.findFirst({
      where: {
        studentId: data.studentId,
        classId: data.classId,
      }
    });

    if (existingEnrollment) {
      return { success: false, error: "Student is already enrolled in this class" };
    }

    // Check if roll number is already used in the section
    if (data.rollNumber) {
      const existingRollNumber = await db.classEnrollment.findFirst({
        where: {
          sectionId: data.sectionId,
          rollNumber: data.rollNumber,
        }
      });

      if (existingRollNumber) {
        return { success: false, error: "Roll number is already assigned in this section" };
      }
    }

    // Create enrollment
    const enrollment = await db.classEnrollment.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        sectionId: data.sectionId,
        rollNumber: data.rollNumber || null,
        status: data.status,
        enrollDate: new Date(),
      }
    });

    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: enrollment };
  } catch (error) {
    console.error("Error enrolling student:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enroll student"
    };
  }
}

// Update student enrollment
export async function updateStudentEnrollment(data: StudentEnrollmentUpdateFormValues) {
  try {
    // Validate enrollment exists
    const existingEnrollment = await db.classEnrollment.findUnique({
      where: { id: data.id }
    });

    if (!existingEnrollment) {
      return { success: false, error: "Enrollment not found" };
    }

    // Check if roll number is already used in the section (if changed)
    if (data.rollNumber && data.rollNumber !== existingEnrollment.rollNumber) {
      const existingRollNumber = await db.classEnrollment.findFirst({
        where: {
          sectionId: data.sectionId,
          rollNumber: data.rollNumber,
          id: { not: data.id }
        }
      });

      if (existingRollNumber) {
        return { success: false, error: "Roll number is already assigned in this section" };
      }
    }

    // Update enrollment
    const enrollment = await db.classEnrollment.update({
      where: { id: data.id },
      data: {
        sectionId: data.sectionId,
        rollNumber: data.rollNumber || null,
        status: data.status,
      }
    });

    revalidatePath(`/admin/classes/${data.classId}`);
    return { success: true, data: enrollment };
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update enrollment"
    };
  }
}

// Remove student from class
export async function removeStudentFromClass(enrollmentId: string) {
  try {
    // Get the enrollment to revalidate path later
    const enrollment = await db.classEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { classId: true }
    });

    if (!enrollment) {
      return { success: false, error: "Enrollment not found" };
    }

    // Delete the enrollment
    await db.classEnrollment.delete({
      where: { id: enrollmentId }
    });

    revalidatePath(`/admin/classes/${enrollment.classId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing student from class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove student from class"
    };
  }
}

// Helper function to format time
function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Get exams for a specific class
export async function getExamsForClass(classId: string, academicYearId?: string) {
  try {
    // If academicYearId is not provided, fetch it from the class
    if (!academicYearId) {
      const classData = await db.class.findUnique({
        where: { id: classId },
        select: { academicYearId: true }
      });
      if (!classData) return [];
      academicYearId = classData.academicYearId;
    }

    // 1. Get subjects assigned to this class
    const subjectClasses = await db.subjectClass.findMany({
      where: { classId },
      select: { subjectId: true }
    });

    const subjectIds = subjectClasses.map(sc => sc.subjectId);

    if (subjectIds.length === 0) return [];

    // 2. Get exams for these subjects within the academic year
    // We filter by terms belonging to the academic year
    const exams = await db.exam.findMany({
      where: {
        subjectId: { in: subjectIds },
        term: {
          academicYearId: academicYearId
        }
      },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        examType: {
          select: { name: true }
        },
        term: {
          select: { name: true }
        }
      },
      orderBy: {
        examDate: 'asc'
      }
    });

    // Format exams
    return exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      subjectCode: exam.subject.code,
      type: exam.examType.name,
      term: exam.term.name,
      date: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      totalMarks: exam.totalMarks
    }));
  } catch (error) {
    console.error("Error fetching exams for class:", error);
    return [];
  }
}
