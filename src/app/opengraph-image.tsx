import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pill Trace - 의약품 성분 검색';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '36px',
            }}
          >
            💊
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Pill Trace
          </span>
        </div>
        <p
          style={{
            fontSize: '28px',
            color: '#6b7280',
            marginTop: '0',
          }}
        >
          내가 먹는 약, 어떤 성분일까?
        </p>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {['약 이름 검색', '성분 검색', '유사 약품 비교'].map((text) => (
            <div
              key={text}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '18px',
                color: '#374151',
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
