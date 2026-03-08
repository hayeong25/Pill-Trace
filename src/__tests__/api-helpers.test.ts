import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

describe('handleApiError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns 500 for generic error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handleApiError(new Error('test'), '테스트');
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('테스트 중 오류가 발생했습니다.');
  });

  it('returns 504 for AbortError (timeout)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const abortError = new DOMException('Aborted', 'AbortError');
    const res = handleApiError(abortError, '검색');
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error).toBe('검색 시간이 초과되었습니다. 다시 시도해주세요.');
  });

  it('handles non-Error objects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handleApiError('string error', '작업');
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('작업 중 오류가 발생했습니다.');
  });

  it('logs error with context prefix', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('test');
    handleApiError(error, '약품 조회');
    expect(console.error).toHaveBeenCalledWith('[Pill Trace] 약품 조회:', error);
  });

  it('sets no-store cache header on error responses', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handleApiError(new Error('test'), '테스트');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('checkRateLimit', () => {
  it('returns null for normal requests', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.100' },
    });
    const result = checkRateLimit(req);
    expect(result).toBeNull();
  });

  it('falls back to "unknown" when x-forwarded-for is missing', () => {
    const req = new NextRequest('http://localhost/api/test');
    const result = checkRateLimit(req);
    expect(result).toBeNull();
  });

  it('returns 429 with no-store and Retry-After when limit exceeded', () => {
    const ip = '10.0.0.99';
    // Exhaust the rate limit (60 requests per minute)
    for (let i = 0; i < 60; i++) {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
      checkRateLimit(req);
    }
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': ip },
    });
    const result = checkRateLimit(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    expect(result!.headers.get('Retry-After')).toBe('60');
    expect(result!.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('cachedJson', () => {
  it('returns response with default cache headers', () => {
    const res = cachedJson({ test: true });
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=600');
  });

  it('uses custom cache times', () => {
    const res = cachedJson({ test: true }, 3600, 7200);
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=3600, stale-while-revalidate=7200');
  });

  it('returns correct JSON data', async () => {
    const data = { items: [1, 2, 3] };
    const res = cachedJson(data);
    const body = await res.json();
    expect(body).toEqual(data);
  });

  it('returns 200 status', () => {
    const res = cachedJson({ ok: true });
    expect(res.status).toBe(200);
  });

  it('sets content-type to application/json', () => {
    const res = cachedJson({ ok: true });
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
