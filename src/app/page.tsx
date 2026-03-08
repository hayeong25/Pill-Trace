'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import DrugCard from '@/components/DrugCard';
import Pagination from '@/components/Pagination';
import SimilarDrugsModal from '@/components/SimilarDrugsModal';
import { DrugSearchResult, SearchResponse } from '@/types/drug';

interface ModalState {
  isOpen: boolean;
  drugName: string;
  materialName: string;
  excludeSeq: string;
}

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: '약 이름으로 검색',
    description: '타이레놀, 게보린 등 약 이름을 검색하면 해당 약에 포함된 모든 성분을 확인할 수 있습니다.',
    iconBg: 'bg-blue-50 text-blue-600',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    title: '성분으로 검색',
    description: '아세트아미노펜 등 성분명을 검색하면 해당 성분이 포함된 모든 의약품을 찾을 수 있습니다.',
    iconBg: 'bg-emerald-50 text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: '유사 약품 비교',
    description: '검색한 약과 동일하거나 비슷한 성분의 다른 약을 찾아 유사도를 비교할 수 있습니다.',
    iconBg: 'bg-violet-50 text-violet-600',
    hoverBorder: 'hover:border-violet-200',
  },
];

const STEPS = [
  { step: '1', text: '검색 모드를 선택하세요', sub: '약 이름 또는 성분명' },
  { step: '2', text: '검색어를 입력하세요', sub: '일부만 입력해도 OK' },
  { step: '3', text: '결과를 확인하세요', sub: '성분, 효능, 주의사항까지' },
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    drugName: '',
    materialName: '',
    excludeSeq: '',
  });

  const currentQuery = searchParams.get('q') || '';
  const modeParam = searchParams.get('mode');
  const currentMode: 'drug' | 'ingredient' = modeParam === 'ingredient' ? 'ingredient' : 'drug';
  const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (query: string, mode: 'drug' | 'ingredient', page: number) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const endpoint = mode === 'drug' ? '/api/drugs/search' : '/api/drugs/ingredients';
      const params = new URLSearchParams({ q: query, page: String(page) });
      const res = await fetch(`${endpoint}?${params}`, { signal: controller.signal });

      if (!res.ok) {
        let errorMsg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch { /* non-JSON error response */ }
        setError(errorMsg);
        setResults(null);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentQuery) {
      fetchResults(currentQuery, currentMode, currentPage);
      document.title = `${currentQuery} - Pill Trace`;
    } else {
      document.title = 'Pill Trace - 의약품 성분 검색';
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [currentQuery, currentMode, currentPage, fetchResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][enterkeyhint="search"]');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback((query: string, mode: 'drug' | 'ingredient') => {
    const params = new URLSearchParams({ q: query, mode, page: '1' });
    router.push(`/?${params.toString()}`);
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams({ q: currentQuery, mode: currentMode, page: String(page) });
    router.push(`/?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, currentQuery, currentMode]);

  const handleGoHome = useCallback(() => {
    router.push('/');
    setResults(null);
    setHasSearched(false);
    setError('');
  }, [router]);

  const handleCloseModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleFindSimilar = (drug: DrugSearchResult) => {
    setModal({
      isOpen: true,
      drugName: drug.ITEM_NAME,
      materialName: drug.ITEM_INGR_NAME || drug.MATERIAL_NAME || '',
      excludeSeq: drug.ITEM_SEQ,
    });
  };

  const showHero = !hasSearched && !currentQuery;

  return (
    <div>
      {/* Hero Section */}
      {showHero && (
        <section className="bg-gradient-to-b from-blue-50 via-white to-transparent pt-16 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                공공데이터포털 의약품 허가정보 기반
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                내가 먹는 약,<br className="sm:hidden" /> 어떤 성분일까?
              </h1>
              <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                약 이름 또는 성분명으로 검색하여<br className="hidden sm:inline" />
                의약품의 성분, 효능, 주의사항을 한눈에 확인하세요
              </p>
            </div>

            <div className="animate-fade-in-up-delay-1">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* How to use */}
            <div className="mt-14 animate-fade-in-up-delay-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px w-12 bg-gray-200" />
                <span className="text-sm font-medium text-gray-400">이렇게 이용하세요</span>
                <div className="h-px w-12 bg-gray-200" />
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {STEPS.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <svg className="w-5 h-5 text-gray-300 hidden sm:block ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up-delay-3">
              {FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg ${feature.hoverBorder} transition-all group`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search Results Mode */}
      {!showHero && (
        <div className="max-w-6xl mx-auto px-4 py-8" role="region" aria-label="검색 결과" aria-busy={isLoading}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                홈
              </button>
            </div>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} compact initialQuery={currentQuery} initialMode={currentMode} />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-400">의약품 정보를 검색하고 있습니다...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="mt-4 text-center py-8 bg-red-50 rounded-2xl border border-red-100">
              <svg className="w-10 h-10 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => fetchResults(currentQuery, currentMode, currentPage)}
                className="mt-3 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {results && !isLoading && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  검색 결과
                </h2>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium" aria-live="polite">
                  {results.totalCount.toLocaleString()}건
                </span>
              </div>

              {results.items.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 font-medium mb-1">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-400">다른 키워드로 검색해보세요. 일부만 입력해도 검색됩니다.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.items.map((drug, idx) => (
                      <DrugCard
                        key={`${drug.ITEM_SEQ}-${idx}`}
                        itemName={drug.ITEM_NAME}
                        entpName={drug.ENTP_NAME}
                        materialName={drug.ITEM_INGR_NAME || drug.MATERIAL_NAME || ''}
                        ingredients={drug.ingredients}
                        permitDate={drug.ITEM_PERMIT_DATE}
                        chart={drug.CHART}
                        storageMethod={drug.STORAGE_METHOD}
                        imageUrl={drug.BIG_PRDT_IMG_URL}
                        searchQuery={currentQuery}
                        hasEasyInfo={drug.hasEasyInfo}
                        maxPrice={drug.maxPrice}
                        onFindSimilar={() => handleFindSimilar(drug)}
                      />
                    ))}
                  </div>

                  <Pagination
                    currentPage={results.pageNo}
                    totalCount={results.totalCount}
                    numOfRows={results.numOfRows}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      <SimilarDrugsModal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        drugName={modal.drugName}
        materialName={modal.materialName}
        excludeSeq={modal.excludeSeq}
      />
    </div>
  );
}
