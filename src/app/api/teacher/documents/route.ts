import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { documentUploadSchema } from "@/lib/schemas/teacher-schemas";

// GET /api/teacher/documents - List teacher's documents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,      },
      include: {
        teacher: true,
      },
    });

    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    // Build where clause - CRITICAL: Filter by school
    const where: any = {
      userId: user.id,
      schoolId, // CRITICAL: Ensure documents belong to current school
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Fetch documents
    const documents = await db.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        documentType: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,      },
      include: {
        teacher: true,
      },
    });

    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate using centralized schema
    const validation = documentUploadSchema.safeParse(body);

    if (!validation.success) {
      // Format validation errors for client
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Ensure the userId matches the authenticated user
    if (validatedData.userId !== user.id) {
      return NextResponse.json(
        { message: "You can only create documents for yourself" },
        { status: 403 }
      );
    }

    // Create document
    const document = await db.document.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        category: validatedData.category,
        tags: validatedData.tags,
        userId: validatedData.userId,
        schoolId: user.teacher.schoolId,
        isPublic: false, // Teacher documents are private by default
      },
      include: {
        documentType: true,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);

    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: "A document with this name already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to create document. Please try again." },
      { status: 500 }
    );
  }
}
