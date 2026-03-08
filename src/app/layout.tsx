import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pill Trace - 의약품 성분 검색',
  description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요. 공공데이터포털 의약품 허가정보 기반.',
  metadataBase: new URL('https://pill-trace.vercel.app'),
  openGraph: {
    title: 'Pill Trace - 의약품 성분 검색',
    description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Pill Trace',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pill Trace - 의약품 성분 검색',
    description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: ['의약품', '약 검색', '성분 검색', '약 성분', '유사 약품', '의약품 정보'],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Pill Trace',
              url: 'https://pill-trace.vercel.app',
              description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://pill-trace.vercel.app/?q={search_term_string}&mode=drug',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          본문으로 건너뛰기
        </a>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between" aria-label="메인 내비게이션">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Pill Trace</span>
                <span className="hidden sm:inline text-sm text-gray-400 ml-2">의약품 성분 검색</span>
              </div>
            </Link>
            <div className="text-xs text-gray-400">
              공공데이터포털 기반
            </div>
          </nav>
        </header>
        <main id="main-content" className="flex-1">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh]" role="status" aria-label="페이지 로딩 중">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" aria-hidden="true" />
              <p className="mt-4 text-sm text-gray-400">로딩 중...</p>
            </div>
          }>
            {children}
          </Suspense>
        </main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400 space-y-1">
            <p>Pill Trace - <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 transition-colors">공공데이터포털(data.go.kr)</a> 의약품 허가정보 기반</p>
            <p className="text-xs">본 서비스는 참고용이며, 정확한 의약품 정보는 의사 또는 약사와 상담하세요.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
