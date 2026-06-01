import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * GET /api/r2/image?key={key}
 *
 * Proxy for private R2 bucket objects. Generates a short-lived presigned URL
 * and returns a redirect so the browser fetches the file directly from R2.
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

  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucketName, Key: key }),
    { expiresIn: 3600 }
  );

  return NextResponse.redirect(presignedUrl, { status: 307 });
}
