/**
 * Converts a raw R2 storage URL into the authenticated proxy URL.
 *
 * Old uploads stored the direct pub-*.r2.dev URL, which returns 401 on private
 * buckets. New uploads store the proxy URL directly. This function handles both.
 */
export function resolveR2Url(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already a proxy URL — return as-is
  if (url.startsWith('/api/r2/image')) return url;

  try {
    const parsed = new URL(url);
    // Convert pub-*.r2.dev/<key> → /api/r2/image?key=<key>
    if (parsed.hostname.match(/^pub-[^.]+\.r2\.dev$/)) {
      const key = parsed.pathname.replace(/^\//, '');
      return `/api/r2/image?key=${encodeURIComponent(key)}`;
    }
    // Also handle direct r2.cloudflarestorage.com URLs
    if (parsed.hostname.match(/\.r2\.cloudflarestorage\.com$/)) {
      const key = parsed.pathname.replace(/^\/[^/]+\//, ''); // strip bucket prefix
      return `/api/r2/image?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // relative or non-standard URLs — return as-is
  }

  return url;
}
