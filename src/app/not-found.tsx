import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-gray-400 mb-8 text-center">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          홈에서 검색하기
        </Link>
      </div>
    </div>
  );
}
