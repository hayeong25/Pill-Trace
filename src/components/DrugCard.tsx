'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ParsedIngredient, EasyDrugInfo } from '@/types/drug';

interface DrugCardProps {
  itemName: string;
  entpName: string;
  materialName: string;
  ingredients: ParsedIngredient[];
  permitDate?: string;
  chart?: string;
  storageMethod?: string;
  imageUrl?: string;
  similarity?: number;
  onFindSimilar?: () => void;
}

const DETAIL_SECTIONS = [
  { key: 'efcyQesitm', label: '효능효과', color: 'text-blue-700', bg: 'bg-blue-50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'useMethodQesitm', label: '용법용량', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'atpnWarnQesitm', label: '경고', color: 'text-red-700', bg: 'bg-red-50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { key: 'atpnQesitm', label: '주의사항', color: 'text-orange-700', bg: 'bg-orange-50', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'intrcQesitm', label: '상호작용', color: 'text-purple-700', bg: 'bg-purple-50', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'seQesitm', label: '부작용', color: 'text-rose-700', bg: 'bg-rose-50', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'depositMethodQesitm', label: '보관법', color: 'text-gray-700', bg: 'bg-gray-100', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
] as const;

export default function DrugCard({
  itemName,
  entpName,
  materialName,
  ingredients,
  permitDate,
  chart,
  storageMethod,
  imageUrl,
  similarity,
  onFindSimilar,
}: DrugCardProps) {
  const [easyInfo, setEasyInfo] = useState<EasyDrugInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  const MAX_VISIBLE_INGREDIENTS = 5;
  const hasMoreIngredients = ingredients.length > MAX_VISIBLE_INGREDIENTS;
  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, MAX_VISIBLE_INGREDIENTS);

  const handleToggleDetail = async () => {
    if (isDetailOpen) {
      setIsDetailOpen(false);
      return;
    }

    if (!easyInfo) {
      setIsDetailLoading(true);
      try {
        const params = new URLSearchParams({ name: itemName });
        const res = await fetch(`/api/drugs/easy?${params}`);
        const data = await res.json();
        setEasyInfo(data.item || null);
      } catch {
        setEasyInfo(null);
      } finally {
        setIsDetailLoading(false);
      }
    }

    setIsDetailOpen(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all">
      <div className="flex gap-4">
        {imageUrl && !imageError && (
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={itemName}
              width={80}
              height={80}
              className="object-contain rounded-xl bg-gray-50 border border-gray-100"
              onError={() => setImageError(true)}
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{itemName}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{entpName}</p>
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
              {visibleIngredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                  title={ing.raw}
                >
                  {ing.name}
                  {ing.amount && <span className="text-blue-400 ml-1">({ing.amount})</span>}
                </span>
              ))}
              {hasMoreIngredients && (
                <button
                  type="button"
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
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
            <span><span className="font-medium text-gray-500">허가일</span> {permitDate}</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleToggleDetail}
          aria-expanded={isDetailOpen}
          aria-label={`${itemName} 상세 정보 ${isDetailOpen ? '접기' : '펼치기'}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {isDetailLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              로딩 중
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 transition-transform ${isDetailOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isDetailOpen ? '접기' : '상세 정보'}
            </>
          )}
        </button>
        {onFindSimilar && (
          <button
            onClick={onFindSimilar}
            aria-label={`${itemName}과 유사한 약품 찾기`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            유사 약품
          </button>
        )}
      </div>

      {isDetailOpen && (
        <div className="mt-4 space-y-3">
          {easyInfo ? (
            DETAIL_SECTIONS.map(({ key, label, color, bg, icon }) => {
              const value = easyInfo[key as keyof EasyDrugInfo];
              if (!value) return null;
              return (
                <div key={key} className={`${bg} rounded-xl p-4`}>
                  <h5 className={`flex items-center gap-1.5 text-sm font-bold ${color} mb-2`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    {label}
                  </h5>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{value}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl">
              이 약품의 상세 정보가 등록되어 있지 않습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
