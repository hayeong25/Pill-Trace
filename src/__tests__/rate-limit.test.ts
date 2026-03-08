import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows first request', () => {
    const result = rateLimit('test-ip-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it('tracks remaining requests', () => {
    const ip = 'test-ip-2';
    rateLimit(ip); // 1st
    rateLimit(ip); // 2nd
    const result = rateLimit(ip); // 3rd
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(57);
  });

  it('blocks after exceeding limit', () => {
    const ip = 'test-ip-3';
    for (let i = 0; i < 60; i++) {
      rateLimit(ip);
    }
    const result = rateLimit(ip);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('treats different IPs independently', () => {
    const ip1 = 'test-ip-4a';
    const ip2 = 'test-ip-4b';
    for (let i = 0; i < 60; i++) {
      rateLimit(ip1);
    }
    const result = rateLimit(ip2);
    expect(result.success).toBe(true);
  });

  it('resets after window expires', () => {
    const ip = 'test-ip-5';
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 60; i++) {
      rateLimit(ip);
    }
    expect(rateLimit(ip).success).toBe(false);

    // Advance time past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 61_000);
    const result = rateLimit(ip);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });
});
