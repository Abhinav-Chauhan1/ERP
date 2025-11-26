import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getCloudinaryPublicId, deleteFromCloudinary } from "@/lib/cloudinary";

// DELETE /api/teacher/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
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

    const { id } = await params;

    // Find the document
    const document = await db.document.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Ensure the document belongs to the current user
    if (document.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this document" },
        { status: 403 }
      );
    }

    // Delete the file from Cloudinary if possible
    try {
      const publicId = getCloudinaryPublicId(document.fileUrl);
      if (publicId) {
        // Determine resource type from file type
        const resourceType = document.fileType?.startsWith('image/') 
          ? 'image' 
          : document.fileType?.startsWith('video/')
          ? 'video'
          : 'raw';
        
        await deleteFromCloudinary(publicId, resourceType);
      }
    } catch (cloudinaryError) {
      // Log the error but continue with database deletion
      console.error('Failed to delete file from Cloudinary:', cloudinaryError);
      // We don't want to fail the entire operation if Cloudinary deletion fails
    }

    // Delete the document from database
    await db.document.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

// GET /api/teacher/documents/[id] - Get a single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
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

    const { id } = await params;

    // Find the document
    const document = await db.document.findUnique({
      where: {
        id,
      },
      include: {
        documentType: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Ensure the document belongs to the current user
    if (document.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this document" },
        { status: 403 }
      );
    }

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', document.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);

    return NextResponse.json({ document }, { headers });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
