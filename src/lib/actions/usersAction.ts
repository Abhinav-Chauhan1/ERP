"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole, PermissionAction, Prisma } from "@prisma/client";
import {
  CreateAdministratorFormData,
  CreateTeacherFormData,
  CreateStudentFormData,
  CreateParentFormData
} from "@/lib/schemaValidation/usersSchemaValidation";
import { revalidatePath } from "next/cache";
import { sanitizeText, sanitizeEmail, sanitizePhoneNumber } from "@/lib/utils/input-sanitization";
import { logCreate, logUpdate, logDelete } from "@/lib/utils/audit-log";
import { hashPassword } from "@/lib/password";
import { hasPermission } from "@/lib/utils/permissions";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";
import { sendStudentWelcomeEmail } from "@/lib/utils/email-service";

// Helper to check permission and throw if denied
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized: You must be logged in');
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

// Helper function to create base user
const createBaseUser = async (userData: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  password?: string;
  schoolName?: string; // used for welcome email
}, tx: Prisma.TransactionClient | typeof db = db) => {
  // Always fall back to firstName@123 if no password provided
  const plainPassword = userData.password || `${userData.firstName.toLowerCase()}@123`;
  const hashedPassword = await hashPassword(plainPassword);

  // Sanitize inputs
  const sanitizedData: any = {
    name: `${userData.firstName} ${userData.lastName}`,
    firstName: sanitizeText(userData.firstName),
    lastName: sanitizeText(userData.lastName),
    mobile: userData.phone ? sanitizePhoneNumber(userData.phone) : undefined,
    avatar: userData.avatar,
    role: userData.role,
    emailVerified: new Date(), // Admin-created users are pre-verified
    passwordHash: hashedPassword,
    mustChangePassword: userData.role === UserRole.STUDENT, // force reset on first login
  };

  // Only include email if provided
  if (userData.email) {
    sanitizedData.email = sanitizeEmail(userData.email);
  }

  const user = await tx.user.create({ data: sanitizedData });

  // Send welcome email with credentials if student has an email
  if (userData.role === UserRole.STUDENT && userData.email) {
    sendStudentWelcomeEmail({
      to: userData.email,
      studentName: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: plainPassword,
      schoolName: userData.schoolName || "Your School",
    }).catch((err) => console.error("Failed to send student welcome email:", err));
  }

  return user;
};

// Create Administrator
export async function createAdministrator(data: CreateAdministratorFormData) {
  try {
    // Permission check: require USER:CREATE
    await checkPermission('USER', 'CREATE', 'You do not have permission to create administrators');

    // Get current school context
    const context = await getCurrentUserSchoolContext();

    const schoolId = context?.schoolId || (context?.isSuperAdmin ? data.schoolId : null);

    if (!schoolId) {
      throw new Error('School context required');
    }

    const actorId = context?.user?.id;
    if (!actorId) throw new Error('Unauthorized');

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.ADMIN,
        password: data.password
      }, tx);

      // Create the administrator profile
      const administrator = await tx.administrator.create({
        data: {
          userId: user.id,
          position: data.position,
          schoolId: schoolId, // Use resolved schoolId
        }
      });

      // Create UserSchool relationship (CRITICAL for authentication)
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: schoolId,
          role: UserRole.ADMIN,
          isActive: true,
        }
      });

      // Log the creation using the actor ID
      await logCreate(
        actorId,
        'administrator',
        administrator.id,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
        }
      );

      revalidatePath('/admin/users');
      return { success: true, id: user.id };
    });
  } catch (error: any) {
    console.error('Error creating administrator:', error);
    throw new Error('Failed to create administrator: ' + (error.message || 'Unknown error'));
  }
}

// Create Teacher
export async function createTeacher(data: CreateTeacherFormData) {
  try {
    // Permission check: require TEACHER:CREATE
    await checkPermission('TEACHER', 'CREATE', 'You do not have permission to create teachers');

    // Get current school context
    const context = await getCurrentUserSchoolContext();

    const schoolId = context?.schoolId || (context?.isSuperAdmin ? data.schoolId : null);

    if (!schoolId) {
      throw new Error('School context required');
    }

    const actorId = context?.user?.id;
    if (!actorId) throw new Error('Unauthorized');

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.TEACHER,
        password: data.password
      }, tx);

      // Create the teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          qualification: data.qualification,
          joinDate: data.joinDate,
          salary: data.salary,
          schoolId: schoolId, // Use resolved schoolId
        }
      });

      // Create UserSchool relationship (CRITICAL for authentication)
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: schoolId,
          role: UserRole.TEACHER,
          isActive: true,
        }
      });

      // Log the creation using the actor ID
      await logCreate(
        actorId,
        'teacher',
        teacher.id,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          employeeId: data.employeeId,
          qualification: data.qualification,
        }
      );

      revalidatePath('/admin/users');
      return { success: true, id: user.id };
    });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    throw new Error('Failed to create teacher: ' + (error.message || 'Unknown error'));
  }
}

// Create Student
export async function createStudent(data: CreateStudentFormData) {
  try {
    // Permission check: require STUDENT:CREATE
    await checkPermission('STUDENT', 'CREATE', 'You do not have permission to create students');

    // Get current school context
    const context = await getCurrentUserSchoolContext();

    const schoolId = context?.schoolId || (context?.isSuperAdmin ? data.schoolId : null);

    if (!schoolId) {
      throw new Error('School context required');
    }

    const actorId = context?.user?.id;
    if (!actorId) throw new Error('Unauthorized');

    // Fetch school name for welcome email
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user (email optional, password required for login)
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.STUDENT,
        password: data.password,
        schoolName: school?.name,
      }, tx);

      // Create the student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId: schoolId, // Use resolved schoolId
          admissionId: data.admissionId,
          admissionDate: data.admissionDate,
          rollNumber: data.rollNumber,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          bloodGroup: data.bloodGroup,
          height: data.height,
          weight: data.weight,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          // Indian-specific fields
          aadhaarNumber: data.aadhaarNumber,
          apaarId: data.apaarId,
          pen: data.pen,
          abcId: data.abcId,
          nationality: data.nationality || "Indian",
          religion: data.religion,
          caste: data.caste,
          category: data.category,
          motherTongue: data.motherTongue,
          birthPlace: data.birthPlace,
          previousSchool: data.previousSchool,
          previousClass: data.previousClass,
          tcNumber: data.tcNumber,
          medicalConditions: data.medicalConditions,
          specialNeeds: data.specialNeeds,
          // Parent/Guardian details (mobile-only authentication)
          fatherName: data.fatherName,
          fatherOccupation: data.fatherOccupation,
          fatherPhone: data.fatherPhone,
          fatherAadhaar: data.fatherAadhaar,
          motherName: data.motherName,
          motherOccupation: data.motherOccupation,
          motherPhone: data.motherPhone,
          motherAadhaar: data.motherAadhaar,
          guardianName: data.guardianName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianAadhaar: data.guardianAadhaar,
        }
      });

      // Create UserSchool relationship (CRITICAL for authentication)
      // Without this, students cannot login because auth checks userSchools
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: schoolId,
          role: UserRole.STUDENT,
          isActive: true,
        }
      });

      // Log the creation
      await logCreate(
        actorId,
        'student',
        student.id,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          admissionId: data.admissionId,
          rollNumber: data.rollNumber,
          gender: data.gender,
        }
      );

      revalidatePath('/admin/users');
      return { success: true, id: student.id };
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    throw new Error('Failed to create student: ' + (error.message || 'Unknown error'));
  }
}

// Create Parent
export async function createParent(data: CreateParentFormData) {
  try {
    // Permission check: require PARENT:CREATE
    await checkPermission('PARENT', 'CREATE', 'You do not have permission to create parents');

    // Get current school context
    const context = await getCurrentUserSchoolContext();

    const schoolId = context?.schoolId || (context?.isSuperAdmin ? data.schoolId : null);

    if (!schoolId) {
      throw new Error('School context required');
    }

    const actorId = context?.user?.id;
    if (!actorId) throw new Error('Unauthorized');

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user (email optional, password required for login)
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.PARENT,
        password: data.password,
      }, tx);

      // Create the parent profile
      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          schoolId: schoolId, // Use resolved schoolId
          occupation: data.occupation,
          alternatePhone: data.alternatePhone,
          relation: data.relation,
        }
      });

      // Create UserSchool relationship (CRITICAL for authentication)
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: schoolId,
          role: UserRole.PARENT,
          isActive: true,
        }
      });

      // Log the creation
      await logCreate(
        actorId,
        'parent',
        parent.id,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          occupation: data.occupation,
          relation: data.relation,
        }
      );

      revalidatePath('/admin/users');
      return { success: true, id: user.id };
    });
  } catch (error: any) {
    console.error('Error creating parent:', error);
    throw new Error('Failed to create parent: ' + (error.message || 'Unknown error'));
  }
}

// Associate a student with a parent
export async function associateStudentWithParent(studentId: string, parentId: string, isPrimary: boolean = false) {
  try {
    const context = await getCurrentUserSchoolContext();
    if (!context?.schoolId && !context?.isSuperAdmin) {
      throw new Error('School context required');
    }
    const schoolId = context.schoolId!;

    // Verify both student and parent belong to the current school
    const [student, parent] = await Promise.all([
      db.student.findFirst({ where: { id: studentId, schoolId }, select: { id: true } }),
      db.parent.findFirst({ where: { id: parentId, schoolId }, select: { id: true } }),
    ]);
    if (!student) throw new Error('Student not found in this school');
    if (!parent) throw new Error('Parent not found in this school');

    const studentParent = await db.studentParent.create({
      data: {
        studentId,
        parentId,
        isPrimary,
        schoolId,
      }
    });

    revalidatePath('/admin/users');
    return studentParent;
  } catch (error) {
    console.error('Error associating student with parent:', error);
    throw new Error('Failed to associate student with parent');
  }
}

// Update User details
export async function updateUserDetails(userId: string, userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  passwordHash?: string;
}) {
  try {
    // Permission check: require USER:UPDATE
    const actorId = await checkPermission('USER', 'UPDATE', 'You do not have permission to update users');

    // Verify the target user belongs to the current school
    const context = await getCurrentUserSchoolContext();
    const schoolId = context?.schoolId;
    if (!schoolId && !context?.isSuperAdmin) throw new Error('School context required');

    if (schoolId) {
      const membership = await db.userSchool.findFirst({
        where: { userId, schoolId },
      });
      if (!membership) throw new Error('User not found in this school');
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: userData,
    });

    revalidatePath('/admin/users');
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

// Update role-specific details
export async function updateAdministrator(administratorId: string, data: Partial<CreateAdministratorFormData> & { password?: string }) {
  try {
    await checkPermission('USER', 'UPDATE', 'You do not have permission to update administrators');

    const context = await getCurrentUserSchoolContext();
    const schoolId = context?.schoolId;
    if (!schoolId && !context?.isSuperAdmin) throw new Error('School context required');

    const administrator = await db.administrator.findFirst({
      where: {
        id: administratorId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });

    if (!administrator) {
      throw new Error('Administrator not found');
    }

    return await db.$transaction(async (tx) => {
      // Hash password if provided
      let passwordHash: string | undefined;
      if (data.password) {
        passwordHash = await hashPassword(data.password);
      }

      // Build user update data
      const userUpdateData: any = {};
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.email) userUpdateData.email = data.email;
      if (data.phone) userUpdateData.phone = data.phone;
      if (data.avatar) userUpdateData.avatar = data.avatar;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
      if (passwordHash) userUpdateData.passwordHash = passwordHash;

      // Update user info if there's data to update
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: administrator.userId },
          data: userUpdateData
        });
      }

      // Update administrator-specific details
      const updatedAdministrator = await tx.administrator.update({
        where: { id: administratorId },
        data: {
          position: data.position,
        }
      });

      revalidatePath('/admin/users');
      revalidatePath('/super-admin/schools');
      return { success: true };
    });
  } catch (error) {
    console.error('Error updating administrator:', error);
    throw new Error('Failed to update administrator');
  }
}

// Update Teacher
export async function updateTeacher(teacherId: string, data: Partial<CreateTeacherFormData> & { password?: string }) {
  try {
    await checkPermission('TEACHER', 'UPDATE', 'You do not have permission to update teachers');

    const context = await getCurrentUserSchoolContext();
    const schoolId = context?.schoolId;
    if (!schoolId && !context?.isSuperAdmin) throw new Error('School context required');

    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return await db.$transaction(async (tx) => {
      // Hash password if provided
      let passwordHash: string | undefined;
      if (data.password) {
        passwordHash = await hashPassword(data.password);
      }

      // Build user update data
      const userUpdateData: any = {};
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.email) userUpdateData.email = data.email;
      if (data.phone) userUpdateData.phone = data.phone;
      if (data.avatar) userUpdateData.avatar = data.avatar;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
      if (passwordHash) userUpdateData.passwordHash = passwordHash;

      // Update user info directly (no permission check)
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: userUpdateData
        });
      }

      // Update teacher-specific details
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          employeeId: data.employeeId,
          qualification: data.qualification,
          joinDate: data.joinDate,
          salary: data.salary,
        }
      });

      revalidatePath('/admin/users');
      revalidatePath('/super-admin/schools');
      return { success: true };
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw new Error('Failed to update teacher');
  }
}

// Update Student
export async function updateStudent(studentId: string, data: Partial<CreateStudentFormData>) {
  try {
    await checkPermission('STUDENT', 'UPDATE', 'You do not have permission to update students');

    const context = await getCurrentUserSchoolContext();
    const schoolId = context?.schoolId;
    if (!schoolId && !context?.isSuperAdmin) throw new Error('School context required');

    const student = await db.student.findFirst({
      where: {
        id: studentId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return await db.$transaction(async (tx) => {
      // Build user update data
      const userUpdateData: any = {};
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.email) userUpdateData.email = data.email;
      if (data.phone) userUpdateData.phone = data.phone;
      if (data.avatar) userUpdateData.avatar = data.avatar;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

      // Update user info directly (no permission check)
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userUpdateData
        });
      }

      // Update student-specific details
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          admissionId: data.admissionId,
          admissionDate: data.admissionDate,
          rollNumber: data.rollNumber,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          bloodGroup: data.bloodGroup,
          height: data.height,
          weight: data.weight,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          // Indian-specific fields
          aadhaarNumber: data.aadhaarNumber,
          apaarId: data.apaarId,
          pen: data.pen,
          abcId: data.abcId,
          nationality: data.nationality,
          religion: data.religion,
          caste: data.caste,
          category: data.category,
          motherTongue: data.motherTongue,
          birthPlace: data.birthPlace,
          previousSchool: data.previousSchool,
          previousClass: data.previousClass,
          tcNumber: data.tcNumber,
          medicalConditions: data.medicalConditions,
          specialNeeds: data.specialNeeds,
          // Parent/Guardian details (mobile-only authentication)
          fatherName: data.fatherName,
          fatherOccupation: data.fatherOccupation,
          fatherPhone: data.fatherPhone,
          fatherAadhaar: data.fatherAadhaar,
          motherName: data.motherName,
          motherOccupation: data.motherOccupation,
          motherPhone: data.motherPhone,
          motherAadhaar: data.motherAadhaar,
          guardianName: data.guardianName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianAadhaar: data.guardianAadhaar,
        }
      });

      revalidatePath('/admin/users');
      revalidatePath('/super-admin/schools');
      return { success: true };
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw new Error('Failed to update student');
  }
}

// Update Parent
export async function updateParent(parentId: string, data: Partial<CreateParentFormData>) {
  try {
    await checkPermission('PARENT', 'UPDATE', 'You do not have permission to update parents');

    const context = await getCurrentUserSchoolContext();
    const schoolId = context?.schoolId;
    if (!schoolId && !context?.isSuperAdmin) throw new Error('School context required');

    const parent = await db.parent.findFirst({
      where: {
        id: parentId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });

    if (!parent) {
      throw new Error('Parent not found');
    }

    return await db.$transaction(async (tx) => {
      // Build user update data
      const userUpdateData: any = {};
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.email) userUpdateData.email = data.email;
      if (data.phone) userUpdateData.phone = data.phone;
      if (data.avatar) userUpdateData.avatar = data.avatar;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

      // Update user info directly (no permission check)
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: parent.userId },
          data: userUpdateData
        });
      }

      // Update parent-specific details
      const updatedParent = await tx.parent.update({
        where: { id: parentId },
        data: {
          occupation: data.occupation,
          alternatePhone: data.alternatePhone,
          relation: data.relation,
        }
      });

      revalidatePath('/admin/users');
      revalidatePath('/super-admin/schools');
      return { success: true };
    });
  } catch (error) {
    console.error('Error updating parent:', error);
    throw new Error('Failed to update parent');
  }
}

// Sync Clerk user to our database
export async function syncClerkUser(clerkId: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}) {
  try {
    // Require authentication — this must only be called by authenticated server-side code
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const existingUser = await db.user.findFirst({
      where: { email: userData.email }
    });

    if (existingUser) {
      return await db.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          avatar: userData.avatar,
        }
      });
    } else {
      return await db.user.create({
        data: {
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar,
          role: UserRole.STUDENT,
        }
      });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    throw new Error('Failed to sync user');
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    // Permission check: require USER:DELETE
    const currentUserId = await checkPermission('USER', 'DELETE', 'You do not have permission to delete users');

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Log the deletion before actually deleting
    await logDelete(
      currentUserId,
      'user',
      userId,
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    );

    // Delete from our database
    await db.user.delete({
      where: { id: userId }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

// Get current authenticated user
export async function getCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await db.user.findFirst({
    where: { id: userId }
  });

  return user;
}

// Get Student by ID
export async function getStudentById(studentId: string) {
  try {
    const context = await getCurrentUserSchoolContext();
    if (!context?.user?.id) return null;
    const schoolId = context.schoolId;

    const student = await db.student.findFirst({
      where: {
        id: studentId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        user: true,
        enrollments: {
          include: { class: true, section: true },
        },
      },
    });
    return student;
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
}

// Get Teacher by ID
export async function getTeacherById(teacherId: string) {
  try {
    const context = await getCurrentUserSchoolContext();
    if (!context?.user?.id) return null;
    const schoolId = context.schoolId;

    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });
    return teacher;
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return null;
  }
}

// Get Administrator by ID
export async function getAdministratorById(administratorId: string) {
  try {
    const context = await getCurrentUserSchoolContext();
    if (!context?.user?.id) return null;
    const schoolId = context.schoolId;

    const administrator = await db.administrator.findFirst({
      where: {
        id: administratorId,
        ...(schoolId ? { schoolId } : {}),
      },
      include: { user: true },
    });
    return administrator;
  } catch (error) {
    console.error("Error fetching administrator:", error);
    return null;
  }
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role;

    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

    // Only admins can change passwords for now (or the user themselves, but this action is used by admin)
    if (currentUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only administrators can update other users passwords');
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password using our Web Crypto compatible utility
    const hashedPassword = await hashPassword(newPassword);

    // Update in database
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword // Use passwordHash instead of password
      }
    });

    // Log the password change
    await logUpdate(
      currentUserId,
      'user',
      userId,
      {
        before: { passwordChanged: false },
        after: { passwordChanged: true }
      }
    );

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error; // Throw original error to see details in client/logs
  }
}

