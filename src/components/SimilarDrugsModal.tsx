'use client';

import { useEffect, useState, useRef } from 'react';
import DrugCard from './DrugCard';
import { DrugSearchResult } from '@/types/drug';

interface SimilarDrug extends DrugSearchResult {
  similarity: number;
  maxPrice?: string;
}

interface SimilarDrugsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugName: string;
  materialName: string;
  excludeSeq: string;
}

export default function SimilarDrugsModal({
  isOpen,
  onClose,
  drugName,
  materialName,
  excludeSeq,
}: SimilarDrugsModalProps) {
  const [drugs, setDrugs] = useState<SimilarDrug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastFetchedRef = useRef('');

  useEffect(() => {
    if (!isOpen || !materialName) return;

    const cacheKey = `${materialName}|${excludeSeq}`;
    if (lastFetchedRef.current === cacheKey) return;

    const controller = new AbortController();

    const fetchSimilar = async () => {
      setIsLoading(true);
      setError('');
      setDrugs([]);
      setHasFetched(false);
      try {
        const params = new URLSearchParams({
          material: materialName,
          exclude: excludeSeq,
        });
        const res = await fetch(`/api/drugs/similar?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setDrugs(data.items || []);
          setHasFetched(true);
          lastFetchedRef.current = cacheKey;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('유사 약품 검색 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      controller.abort();
    };
  }, [isOpen, materialName, excludeSeq, retryCount]);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Auto-focus close button for keyboard users
      setTimeout(() => closeButtonRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        // Restore focus to the element that opened the modal
        previousFocusRef.current?.focus();
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="similar-drugs-title">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={modalRef} className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="similar-drugs-title" className="text-lg font-bold text-gray-900">유사 성분 약품</h2>
              {!isLoading && drugs.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {drugs.length}건
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              <span className="font-medium text-gray-600">{drugName}</span>과(와) 유사한 성분
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-76px)]">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-6 bg-green-50 rounded-full w-12" />
                      </div>
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-7 bg-blue-50 rounded-lg w-20" />
                    <div className="h-7 bg-blue-50 rounded-lg w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12" role="alert">
              <svg className="w-10 h-10 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => { lastFetchedRef.current = ''; setError(''); setRetryCount(c => c + 1); }}
                className="mt-3 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !error && hasFetched && drugs.length === 0 && (
            <div className="text-center py-16" role="status">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 font-medium">유사한 성분의 약품을 찾을 수 없습니다</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drugs.map((drug, idx) => (
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
                similarity={drug.similarity}
                hasEasyInfo={drug.hasEasyInfo}
                maxPrice={drug.maxPrice}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
