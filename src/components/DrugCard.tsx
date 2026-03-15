'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { ParsedIngredient, EasyDrugInfo } from '@/types/drug';
import { stripHtmlTags, formatPermitDate } from '@/lib/utils';

interface DrugCardProps {
  itemName: string;
  entpName: string;
  materialName: string;
  ingredients: ParsedIngredient[];
  permitDate?: string;
  chart?: string;
  storageMethod?: string;
  imageUrl?: string;
  etcOtcCode?: string;
  similarity?: number;
  searchQuery?: string;
  hasEasyInfo?: boolean;
  maxPrice?: string;
  priority?: boolean;
  itemSeq?: string;
  onFindSimilar?: (itemSeq: string, itemName: string, materialName: string) => void;
  onIngredientClick?: (ingredient: string) => void;
}

const HighlightText = memo(function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !text) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (!lowerText.includes(lowerQuery)) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQuery);
  while (idx !== -1) {
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    parts.push(
      <mark key={idx} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
});

const DETAIL_SECTIONS = [
  { key: 'efcyQesitm', label: '효능효과', color: 'text-blue-700', bg: 'bg-blue-50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'useMethodQesitm', label: '용법용량', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'atpnWarnQesitm', label: '경고', color: 'text-red-700', bg: 'bg-red-50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { key: 'atpnQesitm', label: '주의사항', color: 'text-orange-700', bg: 'bg-orange-50', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'intrcQesitm', label: '상호작용', color: 'text-purple-700', bg: 'bg-purple-50', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'seQesitm', label: '부작용', color: 'text-rose-700', bg: 'bg-rose-50', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'depositMethodQesitm', label: '보관법', color: 'text-gray-700', bg: 'bg-gray-100', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
] as const;

const MAX_VISIBLE_INGREDIENTS = 5;

export default memo(function DrugCard({
  itemName,
  entpName,
  materialName,
  ingredients,
  permitDate,
  chart,
  storageMethod,
  imageUrl,
  etcOtcCode,
  similarity,
  searchQuery,
  hasEasyInfo = true,
  maxPrice,
  priority = false,
  itemSeq,
  onFindSimilar,
  onIngredientClick,
}: DrugCardProps) {
  const [easyInfo, setEasyInfo] = useState<EasyDrugInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const hasMoreIngredients = ingredients.length > MAX_VISIBLE_INGREDIENTS;
  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, MAX_VISIBLE_INGREDIENTS);

  const fetchEasyInfo = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsDetailLoading(true);
    setDetailError(false);
    try {
      const params = new URLSearchParams({ name: itemName });
      const res = await fetch(`/api/drugs/easy?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEasyInfo(data.item || null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setDetailError(true);
    } finally {
      if (abortRef.current === controller) {
        setIsDetailLoading(false);
      }
    }
  };

  const handleToggleDetail = async () => {
    if (isDetailLoading) return;
    if (isDetailOpen) {
      setIsDetailOpen(false);
      return;
    }

    if (!easyInfo && !detailError) {
      await fetchEasyInfo();
    }

    setIsDetailOpen(true);
  };

  const handleRetryDetail = async () => {
    await fetchEasyInfo();
    setIsDetailOpen(true);
  };

  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {imageUrl?.trim() && !imageError ? (
            <Image
              src={imageUrl}
              alt={`${itemName} 제품 이미지`}
              width={80}
              height={80}
              className="object-contain rounded-xl bg-gray-50 border border-gray-100"
              onError={() => setImageError(true)}
              unoptimized
              priority={priority}
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center" aria-hidden="true">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate" title={itemName}>
                <HighlightText text={itemName} query={searchQuery} />
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-gray-400 truncate" title={entpName}>{entpName}</p>
                {etcOtcCode && (
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold leading-tight ${
                    etcOtcCode === '전문의약품'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {etcOtcCode === '전문의약품' ? '전문' : '일반'}
                  </span>
                )}
              </div>
              {maxPrice && !isNaN(Number(maxPrice)) && (
                <p className="text-sm font-semibold text-emerald-600 mt-1" aria-label={`약가 약 ${Math.round(Number(maxPrice)).toLocaleString()}원`}>
                  약 {Math.round(Number(maxPrice)).toLocaleString()}원
                </p>
              )}
            </div>
            {similarity !== undefined && (
              <span className={`flex-shrink-0 ml-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                similarity >= 0.8 ? 'bg-green-100 text-green-700' :
                similarity >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {Math.round(similarity * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 mb-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">성분</h4>
        <div className="flex flex-wrap gap-1.5">
          {ingredients.length > 0 ? (
            <>
              {visibleIngredients.map((ing, idx) => {
                const displayName = ing.name;
                const clickName = ing.nameKo || ing.name;
                const Tag = onIngredientClick ? 'button' : 'span';
                return (
                  <Tag
                    key={idx}
                    {...(onIngredientClick ? {
                      type: 'button' as const,
                      onClick: () => onIngredientClick(clickName),
                      'aria-label': `${clickName} 성분으로 검색`,
                    } : {})}
                    className={`inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium ${
                      onIngredientClick ? 'hover:bg-blue-100 cursor-pointer transition-colors' : ''
                    }`}
                    title={ing.raw}
                  >
                    <HighlightText text={displayName} query={searchQuery} />
                    {(() => {
                      const koLabel = ing.nameKo && ing.nameKo !== ing.name ? ing.nameKo : '';
                      const extra = [koLabel, ing.amount].filter(Boolean).join(' ');
                      return extra ? <span className="text-blue-400 ml-1">({extra})</span> : null;
                    })()}
                  </Tag>
                );
              })}
              {hasMoreIngredients && (
                <button
                  type="button"
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  aria-expanded={showAllIngredients}
                  aria-label={showAllIngredients ? '성분 목록 접기' : `성분 ${ingredients.length - MAX_VISIBLE_INGREDIENTS}개 더보기`}
                  className="inline-block px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {showAllIngredients ? '접기' : `+${ingredients.length - MAX_VISIBLE_INGREDIENTS}개 더보기`}
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-300 italic">
              {materialName || '성분 정보 없음'}
            </span>
          )}
        </div>
      </div>

      {(chart || storageMethod || permitDate) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
          {chart && (
            <span><span className="font-medium text-gray-500">성상</span> {chart}</span>
          )}
          {storageMethod && (
            <span><span className="font-medium text-gray-500">보관</span> {storageMethod}</span>
          )}
          {permitDate && (
            <span><span className="font-medium text-gray-500">허가일</span> {formatPermitDate(permitDate)}</span>
          )}
        </div>
      )}

      {(hasEasyInfo || onFindSimilar) && <div className="flex gap-2">
        {hasEasyInfo && (
          <button
            type="button"
            onClick={handleToggleDetail}
            aria-expanded={isDetailOpen}
            aria-label={`${itemName} 상세 정보 ${isDetailOpen ? '접기' : '펼치기'}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          >
            {isDetailLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" aria-hidden="true" />
                로딩 중
              </>
            ) : (
              <>
                <svg className={`w-4 h-4 transition-transform ${isDetailOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {isDetailOpen ? '접기' : '상세 정보'}
              </>
            )}
          </button>
        )}
        {onFindSimilar && itemSeq && (
          <button
            type="button"
            onClick={() => onFindSimilar(itemSeq, itemName, materialName)}
            aria-label={`${itemName}과 유사한 약품 찾기`}
            aria-haspopup="dialog"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            유사 약품
          </button>
        )}
      </div>}

      <div className="detail-expand" data-open={isDetailOpen}>
        <div className="detail-expand-inner">
          {(isDetailOpen || easyInfo || detailError) && (
            <div className="mt-4 space-y-3">
              {easyInfo ? (
                (() => {
                  const sections = DETAIL_SECTIONS.map(({ key, label, color, bg, icon }) => {
                    const value = easyInfo[key as keyof EasyDrugInfo];
                    if (!value) return null;
                    return (
                      <div key={key} className={`${bg} rounded-xl p-4`}>
                        <h5 className={`flex items-center gap-1.5 text-sm font-bold ${color} mb-2`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                          </svg>
                          {label}
                        </h5>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{stripHtmlTags(value)}</p>
                      </div>
                    );
                  }).filter(Boolean);
                  return sections.length > 0 ? sections : (
                    <p className="text-center text-sm text-gray-400 py-4">상세 정보가 없습니다.</p>
                  );
                })()
              ) : detailError ? (
                <div className="text-center py-6 text-sm bg-red-50 rounded-xl" role="alert">
                  <p className="text-red-500">상세 정보를 불러오지 못했습니다.</p>
                  <button
                    type="button"
                    onClick={handleRetryDetail}
                    className="mt-2 text-xs text-red-600 underline hover:no-underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});
