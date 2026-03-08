import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Check rate limit for the request IP. Returns a 429 response if exceeded, or null if OK.
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = rateLimit(ip);
  if (!success) {
    const res = NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
    res.headers.set('Retry-After', '60');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  return null;
}

/**
 * Create a standardized error response for API route catch blocks.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[Pill Trace] ${context}:`, error);
  const isTimeout = error instanceof Error && error.name === 'AbortError';
  return NextResponse.json(
    { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : `${context} 중 오류가 발생했습니다.` },
    { status: isTimeout ? 504 : 500 }
  );
}

/**
 * Create a cached JSON response with standard cache headers.
 */
export function cachedJson(data: unknown, maxAge = 300, staleWhileRevalidate = 600): NextResponse {
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  return response;
}
