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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // schoolId from session — no second auth() call needed
    const schoolId = (session.user as any).schoolId as string | undefined;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, teacher: { select: { id: true, schoolId: true } } },
    });

    if (!user?.teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const effectiveSchoolId = schoolId || user.teacher.schoolId;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where: any = { userId: user.id, ...(effectiveSchoolId ? { schoolId: effectiveSchoolId } : {}) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'ALL') where.category = category;

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { documentType: true },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/teacher/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, teacher: { select: { id: true, schoolId: true } } },
    });

    if (!user?.teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const body = await request.json();
    const validation = documentUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) }, { status: 400 });
    }

    const validatedData = validation.data;
    if (validatedData.userId !== user.id) return NextResponse.json({ message: "You can only create documents for yourself" }, { status: 403 });

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
        isPublic: false,
      },
      include: { documentType: true },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ message: "A document with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Failed to create document. Please try again." }, { status: 500 });
  }
}
