import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pill Trace - 의약품 성분 검색',
  description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요. 공공데이터포털 의약품 허가정보 기반.',
  openGraph: {
    title: 'Pill Trace - 의약품 성분 검색',
    description: '약 이름이나 성분으로 의약품을 검색하고, 동일/유사 성분의 약을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Pill Trace',
  },
  keywords: ['의약품', '약 검색', '성분 검색', '약 성분', '유사 약품', '의약품 정보'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          본문으로 건너뛰기
        </a>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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
          </div>
        </header>
        <main id="main-content" className="flex-1">
          <Suspense>
            {children}
          </Suspense>
        </main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400 space-y-1">
            <p>Pill Trace - 공공데이터포털(data.go.kr) 의약품 허가정보 기반</p>
            <p className="text-xs">본 서비스는 참고용이며, 정확한 의약품 정보는 의사 또는 약사와 상담하세요.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
