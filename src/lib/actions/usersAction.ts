"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole, PermissionAction } from "@prisma/client";
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
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  password?: string;
}) => {
  // Generate default password if not provided: {firstName}@123
  const passwordToHash = userData.password || `${userData.firstName.toLowerCase()}@123`;
  // Hash password using Web Crypto API (PBKDF2)
  const hashedPassword = await hashPassword(passwordToHash);

  // Sanitize inputs
  const sanitizedData = {
    firstName: sanitizeText(userData.firstName),
    lastName: sanitizeText(userData.lastName),
    email: sanitizeEmail(userData.email),
    phone: userData.phone ? sanitizePhoneNumber(userData.phone) : undefined,
    avatar: userData.avatar,
    role: userData.role,
    password: hashedPassword,
    emailVerified: new Date(), // Admin-created users are pre-verified
  };

  return await db.user.create({
    data: sanitizedData
  });
};

// Create Administrator
export async function createAdministrator(data: CreateAdministratorFormData) {
  try {
    // Permission check: require USER:CREATE
    await checkPermission('USER', 'CREATE', 'You do not have permission to create administrators');

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
      });

      // Create the administrator profile
      const administrator = await tx.administrator.create({
        data: {
          userId: user.id,
          position: data.position,
          department: data.department,
        }
      });

      // Log the creation
      await logCreate(
        user.id,
        'administrator',
        administrator.id,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          department: data.department,
        }
      );

      revalidatePath('/admin/users');
      return { user, administrator };
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
      });

      // Create the teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          qualification: data.qualification,
          joinDate: data.joinDate,
          salary: data.salary,
        }
      });

      // Log the creation
      await logCreate(
        user.id,
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
      return { user, teacher };
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

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.STUDENT,
        password: data.password
      });

      // Create the student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
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
          // Parent/Guardian details
          fatherName: data.fatherName,
          fatherOccupation: data.fatherOccupation,
          fatherPhone: data.fatherPhone,
          fatherEmail: data.fatherEmail || undefined,
          fatherAadhaar: data.fatherAadhaar,
          motherName: data.motherName,
          motherOccupation: data.motherOccupation,
          motherPhone: data.motherPhone,
          motherEmail: data.motherEmail || undefined,
          motherAadhaar: data.motherAadhaar,
          guardianName: data.guardianName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail || undefined,
          guardianAadhaar: data.guardianAadhaar,
        }
      });

      // Log the creation
      await logCreate(
        user.id,
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
      return { user, student };
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

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        role: UserRole.PARENT,
        password: data.password
      });

      // Create the parent profile
      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          occupation: data.occupation,
          alternatePhone: data.alternatePhone,
          relation: data.relation,
        }
      });

      // Log the creation
      await logCreate(
        user.id,
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
      return { user, parent };
    });
  } catch (error: any) {
    console.error('Error creating parent:', error);
    throw new Error('Failed to create parent: ' + (error.message || 'Unknown error'));
  }
}

// Associate a student with a parent
export async function associateStudentWithParent(studentId: string, parentId: string, isPrimary: boolean = false) {
  try {
    const studentParent = await db.studentParent.create({
      data: {
        studentId,
        parentId,
        isPrimary,
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
  active?: boolean;
}) {
  try {
    // Permission check: require USER:UPDATE
    await checkPermission('USER', 'UPDATE', 'You do not have permission to update users');

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update in our database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: userData
    });

    revalidatePath('/admin/users');
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

// Update role-specific details
export async function updateAdministrator(administratorId: string, data: Partial<CreateAdministratorFormData>) {
  try {
    const administrator = await db.administrator.findUnique({
      where: { id: administratorId },
      include: { user: true }
    });

    if (!administrator) {
      throw new Error('Administrator not found');
    }

    return await db.$transaction(async (tx) => {
      // Update user info if provided
      if (data.firstName || data.lastName || data.email || data.phone || data.avatar) {
        await updateUserDetails(administrator.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          active: data.active,
        });
      }

      // Update administrator-specific details
      const updatedAdministrator = await tx.administrator.update({
        where: { id: administratorId },
        data: {
          position: data.position,
          department: data.department,
        }
      });

      revalidatePath('/admin/users');
      return updatedAdministrator;
    });
  } catch (error) {
    console.error('Error updating administrator:', error);
    throw new Error('Failed to update administrator');
  }
}

// Update Teacher
export async function updateTeacher(teacherId: string, data: Partial<CreateTeacherFormData>) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return await db.$transaction(async (tx) => {
      // Update user info if provided
      if (data.firstName || data.lastName || data.email || data.phone || data.avatar || data.active !== undefined) {
        await updateUserDetails(teacher.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          active: data.active,
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
      return updatedTeacher;
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw new Error('Failed to update teacher');
  }
}

// Update Student
export async function updateStudent(studentId: string, data: Partial<CreateStudentFormData>) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return await db.$transaction(async (tx) => {
      // Update user info if provided
      if (data.firstName || data.lastName || data.email || data.phone || data.avatar || data.active !== undefined) {
        await updateUserDetails(student.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          active: data.active,
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
          // Parent/Guardian details
          fatherName: data.fatherName,
          fatherOccupation: data.fatherOccupation,
          fatherPhone: data.fatherPhone,
          fatherEmail: data.fatherEmail || undefined,
          fatherAadhaar: data.fatherAadhaar,
          motherName: data.motherName,
          motherOccupation: data.motherOccupation,
          motherPhone: data.motherPhone,
          motherEmail: data.motherEmail || undefined,
          motherAadhaar: data.motherAadhaar,
          guardianName: data.guardianName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail || undefined,
          guardianAadhaar: data.guardianAadhaar,
        }
      });

      revalidatePath('/admin/users');
      return updatedStudent;
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw new Error('Failed to update student');
  }
}

// Update Parent
export async function updateParent(parentId: string, data: Partial<CreateParentFormData>) {
  try {
    const parent = await db.parent.findUnique({
      where: { id: parentId },
      include: { user: true }
    });

    if (!parent) {
      throw new Error('Parent not found');
    }

    return await db.$transaction(async (tx) => {
      // Update user info if provided
      if (data.firstName || data.lastName || data.email || data.phone || data.avatar || data.active !== undefined) {
        await updateUserDetails(parent.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          active: data.active,
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
      return updatedParent;
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
    // This function is kept for backward compatibility but might need refactoring
    // if we are fully moving away from Clerk. For now, we will query by id if it matches
    // or just return if it's purely Clerk specific.

    // Check if user already exists - using a raw query or assumption that clerkId might be stored as an external ID
    // If clerkId column exists, we can use it. If not, we should probably ignore this sync
    // or map it to email.

    const existingUser = await db.user.findFirst({
      where: { email: userData.email }
    });

    if (existingUser) {
      // Update existing user
      return await db.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          //   email: userData.email, // Don't typically update email on sync unless verified
          phone: userData.phone,
          avatar: userData.avatar,
        }
      });
    } else {
      // Create new user if not found by email
      return await db.user.create({
        data: {
          //   clerkId, // Eliminating clerkId reliance
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar,
          role: UserRole.STUDENT, // Default role
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

// Get users by role
export async function getUsersByRole(role: UserRole) {
  return await db.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' }
  });
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
        password: hashedPassword
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

