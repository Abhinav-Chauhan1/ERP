/**
 * Utility: fetch a school logo URL and return a base64 data URI
 * suitable for embedding in jsPDF on the server side.
 *
 * This is intentionally NOT a 'use server' file so it can be imported
 * cleanly from both Server Actions and API Route Handlers.
 */

/**
 * Extracts the R2 object key from a stored logo URL.
 * Handles proxy format (/api/r2/image?key=...) and legacy pub-*.r2.dev URLs.
 */
function extractR2Key(url: string): string | null {
  if (url.includes('/api/r2/image')) {
    try {
      const u = new URL(url, 'http://localhost');
      return u.searchParams.get('key');
    } catch { return null; }
  }
  try {
    const u = new URL(url);
    if (u.hostname.match(/^pub-[^.]+\.r2\.dev$/)) {
      return u.pathname.replace(/^\//, '');
    }
    if (u.hostname.match(/\.r2\.cloudflarestorage\.com$/)) {
      return u.pathname.replace(/^\/[^/]+\//, '');
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetches a logo URL and returns a base64 data URI for jsPDF embedding.
 *
 * Strategy:
 *  1. If already a data URI — return as-is.
 *  2. If an R2 key can be extracted — try fetching via S3 SDK (works for private buckets).
 *  3. Fall back to HTTP fetch (works for public buckets / external CDNs).
 */
export async function fetchLogoBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  const key = extractR2Key(url);

  if (key) {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const accountId       = process.env.R2_ACCOUNT_ID;
      const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucketName      = process.env.R2_BUCKET_NAME;

      if (accountId && accessKeyId && secretAccessKey && bucketName) {
        console.log('[fetchLogoBase64] Fetching via S3 SDK, key:', key);
        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId, secretAccessKey },
        });
        const res = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
        const chunks: Uint8Array[] = [];
        for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        const ct  = res.ContentType || 'image/png';
        console.log('[fetchLogoBase64] S3 success, bytes:', buf.length);
        return `data:${ct};base64,${buf.toString('base64')}`;
      }
    } catch (err) {
      console.error('[fetchLogoBase64] S3 fetch failed, falling back to HTTP:', err);
    }
  }

  // HTTP fallback — works for public R2 buckets and external CDN URLs
  let absUrl = url;
  if (!url.startsWith('http')) {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    absUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  try {
    console.log('[fetchLogoBase64] HTTP fetch:', absUrl);
    const res = await fetch(absUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error(`[fetchLogoBase64] HTTP fetch failed: ${absUrl} → ${res.status} ${res.statusText}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    const ct  = res.headers.get('content-type') || 'image/png';
    console.log('[fetchLogoBase64] HTTP success, bytes:', buf.byteLength);
    return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
  } catch (err) {
    console.error(`[fetchLogoBase64] HTTP fetch exception: ${absUrl}`, err);
    return null;
  }
}
