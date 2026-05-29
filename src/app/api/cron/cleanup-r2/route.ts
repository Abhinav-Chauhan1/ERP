import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { getR2Config, generateCdnUrl } from '@/lib/config/r2-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getS3Client() {
  const config = getR2Config();
  if (!config.isConfigured) return null;
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
    forcePathStyle: true,
  });
}

async function listAllR2Objects(client: S3Client, bucketName: string) {
  const objects: { key: string; lastModified: Date }[] = [];
  let continuationToken: string | undefined;

  do {
    const res: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        objects.push({ key: obj.Key, lastModified: obj.LastModified ?? new Date(0) });
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

async function buildKnownUrls(): Promise<Set<string>> {
  const [avatars, reportCards, admissionDocs, schoolLogos] = await Promise.all([
    db.user.findMany({ select: { avatar: true }, where: { avatar: { not: null } } }),
    db.reportCard.findMany({ select: { pdfUrl: true }, where: { pdfUrl: { not: null } } }),
    db.applicationDocument.findMany({ select: { url: true } }),
    db.school.findMany({ select: { logo: true }, where: { logo: { not: null } } }),
  ]);

  const knownUrls = new Set<string>();
  for (const u of avatars) if (u.avatar) knownUrls.add(u.avatar);
  for (const r of reportCards) if (r.pdfUrl) knownUrls.add(r.pdfUrl);
  for (const d of admissionDocs) if (d.url) knownUrls.add(d.url);
  for (const s of schoolLogos) if (s.logo) knownUrls.add(s.logo);

  return knownUrls;
}

export async function POST(request: NextRequest) {
  try {
    // Enforce HTTPS in production
    const proto = request.headers.get('x-forwarded-proto');
    if (process.env.NODE_ENV === 'production' && proto !== 'https') {
      return NextResponse.json({ error: 'HTTPS required' }, { status: 400 });
    }

    // Authenticate with CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const auth = request.headers.get('authorization');
    if (!auth || auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const r2Config = getR2Config();
    if (!r2Config.isConfigured || !r2Config.bucketName) {
      return NextResponse.json({ success: true, message: 'R2 not configured — skipping', deleted: 0 });
    }

    const client = getS3Client()!;
    const cutoff = new Date(Date.now() - ORPHAN_AGE_MS);

    const [allObjects, knownUrls] = await Promise.all([
      listAllR2Objects(client, r2Config.bucketName),
      buildKnownUrls(),
    ]);

    const orphans = allObjects.filter((obj) => {
      if (obj.lastModified > cutoff) return false; // Too new — skip
      const url = generateCdnUrl(obj.key);
      return !knownUrls.has(url);
    });

    let deleted = 0;
    const errors: string[] = [];

    for (const obj of orphans) {
      try {
        await client.send(new DeleteObjectCommand({ Bucket: r2Config.bucketName!, Key: obj.key }));
        deleted++;
      } catch (err) {
        errors.push(`${obj.key}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    console.log(`[cron/cleanup-r2] Deleted ${deleted}/${orphans.length} orphaned R2 objects`);

    return NextResponse.json({
      success: true,
      scanned: allObjects.length,
      orphansFound: orphans.length,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[cron/cleanup-r2] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
