'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Pill Trace] Global error:', error);
  }, [error]);
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>오류가 발생했습니다</h1>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>예상치 못한 오류가 발생했습니다. 다시 시도해주세요.</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
