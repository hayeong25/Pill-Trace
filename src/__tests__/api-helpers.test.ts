import { describe, it, expect, vi } from 'vitest';
import { handleApiError } from '@/lib/api-helpers';

describe('handleApiError', () => {
  it('returns 500 for generic error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handleApiError(new Error('test'), '테스트');
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('테스트 중 오류가 발생했습니다.');
    vi.restoreAllMocks();
  });

  it('returns 504 for AbortError (timeout)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const abortError = new DOMException('Aborted', 'AbortError');
    const res = handleApiError(abortError, '검색');
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error).toBe('검색 시간이 초과되었습니다. 다시 시도해주세요.');
    vi.restoreAllMocks();
  });

  it('handles non-Error objects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handleApiError('string error', '작업');
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('작업 중 오류가 발생했습니다.');
    vi.restoreAllMocks();
  });

  it('logs error with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('test');
    handleApiError(error, '약품 조회');
    expect(spy).toHaveBeenCalledWith('[Pill Trace] 약품 조회:', error);
    spy.mockRestore();
  });
});
