"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { 
  CreateAdministratorFormData,
  CreateTeacherFormData,
  CreateStudentFormData,
  CreateParentFormData
} from "@/lib/schemaValidation/usersSchemaValidation";
import { revalidatePath } from "next/cache";
import { sanitizeText, sanitizeEmail, sanitizePhoneNumber } from "@/lib/utils/input-sanitization";
import { logCreate, logUpdate, logDelete } from "@/lib/utils/audit-log";

// Helper function to create base user
const createBaseUser = async (clerkId: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
}) => {
  // Sanitize inputs
  const sanitizedData = {
    clerkId,
    firstName: sanitizeText(userData.firstName),
    lastName: sanitizeText(userData.lastName),
    email: sanitizeEmail(userData.email),
    phone: userData.phone ? sanitizePhoneNumber(userData.phone) : undefined,
    avatar: userData.avatar,
    role: userData.role,
  };
  
  return await db.user.create({
    data: sanitizedData
  });
};

// Create Administrator
export async function createAdministrator(data: CreateAdministratorFormData) {
  try {
    // Create the user in Clerk with email/password
    const clerk = await clerkClient();
    
    // Create user in Clerk - removed phoneNumber parameter which was causing the error
    const clerkUser = await clerk.users.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      password: data.password,
      publicMetadata: {
        role: UserRole.ADMIN,
      },
    });

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser(clerkUser.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone, // Still store phone in our database
        avatar: data.avatar,
        role: UserRole.ADMIN,
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
    
    // Better error handling for Clerk errors
    if (error.clerkError) {
      const clerkErrors = error.errors || [];
      const errorMessage = clerkErrors.length > 0 
        ? `${clerkErrors[0].message} - ${clerkErrors[0].longMessage || ''}`
        : 'Clerk authentication error';
        
      console.error('Clerk API error details:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to create administrator: ' + (error.message || 'Unknown error'));
  }
}

// Create Teacher
export async function createTeacher(data: CreateTeacherFormData) {
  try {
    // Create the user in Clerk with email/password
    const clerk = await clerkClient();
    
    // Create user in Clerk - removed phoneNumber parameter which was causing the error
    const clerkUser = await clerk.users.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      password: data.password,
      publicMetadata: {
        role: UserRole.TEACHER,
      },
    });

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser(clerkUser.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone, // Still store phone in our database
        avatar: data.avatar,
        role: UserRole.TEACHER,
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
    
    // Better error handling for Clerk errors
    if (error.clerkError) {
      const clerkErrors = error.errors || [];
      const errorMessage = clerkErrors.length > 0 
        ? `${clerkErrors[0].message} - ${clerkErrors[0].longMessage || ''}`
        : 'Clerk authentication error';
        
      console.error('Clerk API error details:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to create teacher: ' + (error.message || 'Unknown error'));
  }
}

// Create Student
export async function createStudent(data: CreateStudentFormData) {
  try {
    // Create the user in Clerk with email/password
    const clerk = await clerkClient();
    
    // Create user in Clerk - removed phoneNumber parameter which was causing the error
    const clerkUser = await clerk.users.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      password: data.password,
      publicMetadata: {
        role: UserRole.STUDENT,
      },
    });

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser(clerkUser.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone, // Still store phone in our database
        avatar: data.avatar,
        role: UserRole.STUDENT,
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
          emergencyContact: data.emergencyContact,
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
    
    // Better error handling for Clerk errors
    if (error.clerkError) {
      const clerkErrors = error.errors || [];
      const errorMessage = clerkErrors.length > 0 
        ? `${clerkErrors[0].message} - ${clerkErrors[0].longMessage || ''}`
        : 'Clerk authentication error';
        
      console.error('Clerk API error details:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to create student: ' + (error.message || 'Unknown error'));
  }
}

// Create Parent
export async function createParent(data: CreateParentFormData) {
  try {
    // Create the user in Clerk with email/password
    const clerk = await clerkClient();
    
    // Create user in Clerk - removed phoneNumber parameter which was causing the error
    const clerkUser = await clerk.users.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      password: data.password,
      publicMetadata: {
        role: UserRole.PARENT,
      },
    });

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the base user
      const user = await createBaseUser(clerkUser.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone, // Still store phone in our database
        avatar: data.avatar,
        role: UserRole.PARENT,
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
    
    // Better error handling for Clerk errors
    if (error.clerkError) {
      const clerkErrors = error.errors || [];
      const errorMessage = clerkErrors.length > 0 
        ? `${clerkErrors[0].message} - ${clerkErrors[0].longMessage || ''}`
        : 'Clerk authentication error';
        
      console.error('Clerk API error details:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
    
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
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update in Clerk
    if (userData.firstName || userData.lastName || userData.email || userData.phone) {
      const clerk = await clerkClient();
      await clerk.users.updateUser(user.clerkId, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        primaryEmailAddressID : userData.email || undefined,
        primaryPhoneNumberID: userData.phone || undefined,
      });
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
          emergencyContact: data.emergencyContact,
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
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { clerkId }
    });

    if (existingUser) {
      // Update existing user
      return await db.user.update({
        where: { clerkId },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar,
        }
      });
    } else {
      // Get role from Clerk metadata
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(clerkId);
      const role = clerkUser.publicMetadata.role as UserRole || UserRole.STUDENT;

      // Create new user
      return await db.user.create({
        data: {
          clerkId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar,
          role,
        }
      });
    }
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    throw new Error('Failed to sync user with Clerk');
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

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

    // Delete from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(user.clerkId);

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
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await db.user.findFirst({
    where: { clerkId: userId }
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
