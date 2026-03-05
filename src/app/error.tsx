'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
      <p className="text-gray-400 mb-8 text-center">예상치 못한 오류가 발생했습니다. 다시 시도해주세요.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-gray-600 font-medium rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
