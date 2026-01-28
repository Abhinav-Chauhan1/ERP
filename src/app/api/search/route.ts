import { NextRequest, NextResponse } from "next/server";
import { withSchoolAuth } from "@/lib/auth/security-wrapper";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: string;
  type: "student" | "teacher" | "parent" | "document" | "announcement";
  title: string;
  subtitle?: string;
  url: string;
  avatar?: string;
}

interface GroupedResults {
  students: SearchResult[];
  teachers: SearchResult[];
  parents: SearchResult[];
  documents: SearchResult[];
  announcements: SearchResult[];
}

/**
 * Global search API endpoint
 * Searches across students, teachers, parents, documents, and announcements
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5
 */
export const GET = withSchoolAuth(async (request, context) => {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    // Requirement 23.3: Provide autocomplete suggestions after 3 characters
    if (!query || query.length < 3) {
      return NextResponse.json({
        results: {
          students: [],
          teachers: [],
          parents: [],
          documents: [],
          announcements: [],
        },
        totalCount: 0,
      });
    }

    // Get user role to determine access
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchTerm = `%${query}%`;
    const results: GroupedResults = {
      students: [],
      teachers: [],
      parents: [],
      documents: [],
      announcements: [],
    };

    // Requirement 23.1: Search across students, teachers, parents, documents, and announcements

    // Search Students
    const students = await prisma.student.findMany({
      where: {
        schoolId: context.schoolId,

        OR: [
          {
            user: {
              firstName: {
                contains: query, mode: "insensitive"
              }
            }
          },
          { user: { lastName: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { admissionId: { contains: query, mode: "insensitive" } },
          { rollNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        enrollments: {
          where: {
            schoolId: context.schoolId,
            status: "ACTIVE"
          },
          include: {
            class: {
              select: { name: true },
            },
            section: {
              select: { name: true },
            },
          },
          take: 1,
        },
      },
      take: 10,
    });

    results.students = students.map((student) => ({
      id: student.id,
      type: "student" as const,
      title: `${student.user.firstName} ${student.user.lastName}`,
      subtitle: student.enrollments[0]
        ? `${student.enrollments[0].class.name} - ${student.enrollments[0].section.name} • ${student.admissionId}`
        : student.admissionId,
      url: `/admin/users/students/${student.id}`,
      avatar: student.user.avatar || undefined,
    }));

    // Search Teachers
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: context.schoolId,

        OR: [
          {
            user: {
              firstName: {
                contains: query, mode: "insensitive"
              }
            }
          },
          { user: { lastName: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { employeeId: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: { name: true },
            },
          },
          take: 2,
        },
      },
      take: 10,
    });

    results.teachers = teachers.map((teacher) => ({
      id: teacher.id,
      type: "teacher" as const,
      title: `${teacher.user.firstName} ${teacher.user.lastName}`,
      subtitle: teacher.subjects.length > 0
        ? `${teacher.subjects.map((s) => s.subject.name).join(", ")} • ${teacher.employeeId}`
        : teacher.employeeId,
      url: `/admin/users/teachers/${teacher.id}`,
      avatar: teacher.user.avatar || undefined,
    }));

    // Search Parents
    const parents = await prisma.parent.findMany({
      where: {
        schoolId: context.schoolId,

        OR: [
          {
            user: {
              firstName: {
                contains: query, mode: "insensitive"
              }
            }
          },
          { user: { lastName: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          take: 2,
        },
      },
      take: 10,
    });

    results.parents = parents.map((parent) => ({
      id: parent.id,
      type: "parent" as const,
      title: `${parent.user.firstName} ${parent.user.lastName}`,
      subtitle: parent.children.length > 0
        ? `Parent of ${parent.children.map((c) => `${c.student.user.firstName} ${c.student.user.lastName}`).join(", ")}`
        : parent.user.email,
      url: `/admin/users/parents/${parent.id}`,
      avatar: parent.user.avatar || undefined,
    }));

    // Search Documents
    const documents = await prisma.document.findMany({
      where: {
        schoolId: context.schoolId,

        OR: [
          {
            title: {
              contains: query, mode: "insensitive"
            }
          },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10,
    });

    results.documents = documents.map((doc) => ({
      id: doc.id,
      type: "document" as const,
      title: doc.title,
      subtitle: `${doc.fileType || 'Document'} • Uploaded by ${doc.user.firstName} ${doc.user.lastName}`,
      url: `/admin/documents/${doc.id}`,
    }));

    // Search Announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: context.schoolId,

        OR: [
          {
            title: {
              contains: query, mode: "insensitive"
            }
          },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        publisher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    results.announcements = announcements.map((announcement) => ({
      id: announcement.id,
      type: "announcement" as const,
      title: announcement.title,
      subtitle: `Posted by ${announcement.publisher.user.firstName} ${announcement.publisher.user.lastName}`,
      url: `/admin/communication/announcements/${announcement.id}`,
    }));

    // Requirement 23.2: Group results by category with result count
    const totalCount =
      results.students.length +
      results.teachers.length +
      results.parents.length +
      results.documents.length +
      results.announcements.length;

    return NextResponse.json({
      results,
      totalCount,
      counts: {
        students: results.students.length,
        teachers: results.teachers.length,
        parents: results.parents.length,
        documents: results.documents.length,
        announcements: results.announcements.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
});
