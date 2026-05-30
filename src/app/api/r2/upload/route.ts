import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { validateFileUpload, incrementStorageUsage } from '@/lib/services/usage-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // Sanitize folder: allow only safe path segments to prevent path traversal
    const rawFolder = formData.get('folder') as string || 'general';
    const folder = rawFolder.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Enforce storage quota before reading the file into memory
    const quotaCheck = await validateFileUpload(file.size, schoolId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.error,
          remainingSpaceMB: quotaCheck.remainingSpaceMB,
        },
        { status: 413 }
      );
    }

    // Check if R2 is configured
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        { success: false, error: 'R2 storage not configured' },
        { status: 500 }
      );
    }

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique key — use school-${schoolId}/ prefix to match the r2-storage-service convention
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `school-${schoolId}/${folder}/${timestamp}-${randomString}-${sanitizedFilename}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        schoolId,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    await s3Client.send(command);

    // Track storage usage — non-blocking so a counter failure never breaks the upload
    const fileSizeMB = file.size / (1024 * 1024);
    incrementStorageUsage(fileSizeMB, schoolId).catch((err) => {
      console.error('[storage] Failed to increment usage counter after upload:', err);
    });

    // Always serve through the authenticated proxy so private-bucket objects
    // remain accessible regardless of bucket visibility settings.
    const url = `/api/r2/image?key=${encodeURIComponent(key)}`;

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        metadata: {
          id: key,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          folder,
        },
      },
    });

  } catch (error) {
    console.error('R2 upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}
