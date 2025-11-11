"use server";

import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getUsersOverview() {
  try {
    const [admins, teachers, students, parents] = await Promise.all([
      db.user.count({ where: { role: UserRole.ADMIN, active: true } }),
      db.user.count({ where: { role: UserRole.TEACHER, active: true } }),
      db.user.count({ where: { role: UserRole.STUDENT, active: true } }),
      db.user.count({ where: { role: UserRole.PARENT, active: true } }),
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
}

export async function getRecentUsers(limit: number = 10) {
  try {
    const users = await db.user.findMany({
      take: limit,
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
}

export async function getAllUsers(role?: UserRole) {
  try {
    const users = await db.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clerkId: true,
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
}

export async function getUserById(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
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
}

export async function updateUserStatus(id: string, active: boolean) {
  try {
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
}

export async function updateUserRole(id: string, role: UserRole) {
  try {
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
}

export async function deleteUser(id: string) {
  try {
    await db.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
