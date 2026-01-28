"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils/permissions";

export const getUsersOverview = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [admins, teachers, students, parents] = await Promise.all([
      db.user.count({
        where: {
          role: UserRole.ADMIN,
          active: true,
          userSchools: {
            some: {
              schoolId,
              isActive: true
            }
          }
        }
      }),
      db.user.count({
        where: {
          role: UserRole.TEACHER,
          active: true,
          userSchools: {
            some: {
              schoolId,
              isActive: true
            }
          }
        }
      }),
      db.user.count({
        where: {
          role: UserRole.STUDENT,
          active: true,
          userSchools: {
            some: {
              schoolId,
              isActive: true
            }
          }
        }
      }),
      db.user.count({
        where: {
          role: UserRole.PARENT,
          active: true,
          userSchools: {
            some: {
              schoolId,
              isActive: true
            }
          }
        }
      }),
    ]);

    return {
      success: true,
      data: {
        administrators: admins,
        teachers,
        students,
        parents,
      },
    };
  } catch (error) {
    console.error("Error fetching users overview:", error);
    return { success: false, error: "Failed to fetch users overview" };
  }
});

export const getRecentUsers = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, limit: number = 10) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const users = await db.user.findMany({
      take: limit,
      where: {
        userSchools: {
          some: {
            schoolId,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        date: user.createdAt.toISOString().split("T")[0],
        status: user.active ? "active" : "inactive",
      })),
    };
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return { success: false, error: "Failed to fetch recent users" };
  }
});

export const getAllUsers = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, role?: UserRole) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const where: any = {
      userSchools: {
        some: {
          schoolId,
          isActive: true
        }
      }
    };
    if (role) where.role = role;

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
});

export const getUserById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Since findUnique can only use @unique fields (id), we can't filter by schoolId directly in where.
    // We must use findFirst with schoolId filter, OR findUnique and verify school access in code.
    // Using findFirst is safer for tenant isolation.
    const user = await db.user.findFirst({
      where: {
        id,
        userSchools: {
          some: {
            schoolId
          }
        }
      },
      include: {
        teacher: true,
        student: {
          include: {
            parents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            enrollments: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        parent: {
          include: {
            children: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        administrator: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
});

export const updateUserStatus = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, active: boolean) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "USER", "UPDATE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };

    // Ensure user belongs to school before updating
    const existingUser = await db.user.findFirst({
      where: {
        id,
        userSchools: { some: { schoolId } }
      }
    });

    if (!existingUser) return { success: false, error: "User not found" };

    const user = await db.user.update({
      where: { id },
      data: { active },
    });

    revalidatePath("/admin/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error updating user status:", error);
    return { success: false, error: "Failed to update user status" };
  }
});

export const updateUserRole = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, role: UserRole) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "USER", "UPDATE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };

    // Ensure user belongs to school
    const existingUser = await db.user.findFirst({
      where: {
        id,
        userSchools: { some: { schoolId } }
      }
    });

    if (!existingUser) return { success: false, error: "User not found" };

    const user = await db.user.update({
      where: { id },
      data: { role },
    });

    revalidatePath("/admin/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
});

export const deleteUser = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "USER", "DELETE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };

    // Ensure user belongs to school
    const existingUser = await db.user.findFirst({
      where: {
        id,
        userSchools: { some: { schoolId } }
      }
    });

    if (!existingUser) return { success: false, error: "User not found" };

    await db.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
});

export const getUsersForDropdown = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, role?: UserRole) => {
  try {
    const users = await db.user.findMany({
      where: {
        active: true,
        ...(role ? { role } : {}),
        userSchools: {
          some: {
            schoolId,
            isActive: true
          }
        }
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      })),
    };
  } catch (error) {
    console.error("Error fetching users for dropdown:", error);
    return { success: false, error: "Failed to fetch users" };
  }
});
