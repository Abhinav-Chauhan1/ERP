import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { SchoolUsersClient } from "@/components/super-admin/schools/school-users-client";

interface SchoolUsersPageProps {
  params: {
    id: string;
  };
}

export default async function SchoolUsersPage({ params }: SchoolUsersPageProps) {
  const { id } = params;

  // Check authentication and super admin access
  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  const school = await db.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      status: true,
      teachers: {
        select: {
          id: true,
          employeeId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        take: 10,
      },
      students: {
        select: {
          id: true,
          rollNumber: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          enrollments: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              class: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
        take: 10,
      },
      administrators: {
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        take: 10,
      },
      parents: {
        select: {
          id: true,
          occupation: true,
          relation: true,
          alternatePhone: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          children: {
            select: {
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      name: true,
                    },
                  },
                  enrollments: {
                    where: {
                      status: 'ACTIVE',
                    },
                    select: {
                      class: {
                        select: {
                          name: true,
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        take: 10,
      },
      _count: {
        select: {
          teachers: true,
          students: true,
          administrators: true,
          parents: true,
        },
      },
    },
  });

  if (!school) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
        <p className="text-gray-500 mb-6">The school you are looking for does not exist.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <a href="/super-admin/schools">Return to Schools List</a>
        </button>
      </div>
    );
  }

  return <SchoolUsersClient school={school} />;
}