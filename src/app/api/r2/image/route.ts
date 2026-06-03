import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * GET /api/r2/image?key={key}
 *
 * Proxy for private R2 bucket objects. Streams the object through this route so
 * Next's image optimizer receives image bytes instead of a redirect response.
 *
 * Access control: user must be authenticated. The key must start with
 * `school-{schoolId}/` where schoolId belongs to the authenticated user
 * (or the user is a super-admin).
 */
// Logo and favicon paths are public branding assets — no auth required
const PUBLIC_KEY_PATTERNS = [
  /^school-[^/]+\/logos\//,
  /^school-[^/]+\/favicon/,
  /^school-[^/]+\/branding\//,
];

function isPublicKey(key: string): boolean {
  return PUBLIC_KEY_PATTERNS.some(p => p.test(key));
}

function inferImageContentType(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  // Validate key format and extract schoolId
  const match = key.match(/^school-([^/]+)\//);
  if (!match) {
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
  }
  const keySchoolId = match[1];

  // Public branding assets (logos, favicons) are accessible without authentication
  if (!isPublicKey(key)) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Allow access if super-admin or key belongs to one of the user's schools
    if (session.user.role !== 'SUPER_ADMIN') {
      const { db } = await import('@/lib/db');
      const membership = await db.userSchool.findFirst({
        where: { userId: session.user.id, schoolId: keySchoolId, isActive: true },
        select: { schoolId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    const object = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );

    if (!object.Body) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const body = object.Body.transformToWebStream();
    const headers = new Headers({
      'Content-Type': object.ContentType || inferImageContentType(key),
      'Cache-Control': isPublicKey(key)
        ? 'public, max-age=3600, stale-while-revalidate=86400'
        : 'private, max-age=300',
    });

    if (object.ContentLength !== undefined) {
      headers.set('Content-Length', object.ContentLength.toString());
    }
    if (object.ETag) {
      headers.set('ETag', object.ETag);
    }

    return new Response(body, { status: 200, headers });
  } catch (error) {
    console.error('R2 image proxy error:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
