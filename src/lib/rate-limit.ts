const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

export function rateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}

// Periodic cleanup to prevent memory leak (every 5 minutes)
// Guard against HMR accumulating multiple intervals
const CLEANUP_INTERVAL_KEY = '__pillTraceRateLimitCleanup';
if (typeof setInterval !== 'undefined' && !(globalThis as Record<string, unknown>)[CLEANUP_INTERVAL_KEY]) {
  (globalThis as Record<string, unknown>)[CLEANUP_INTERVAL_KEY] = setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((value, key) => {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60_000);
}
