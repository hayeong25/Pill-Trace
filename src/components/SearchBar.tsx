'use client';

import { useState, useEffect, useCallback } from 'react';

type SearchMode = 'drug' | 'ingredient';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  isLoading: boolean;
  compact?: boolean;
  initialQuery?: string;
  initialMode?: SearchMode;
}

const QUICK_EXAMPLES = {
  drug: ['타이레놀', '게보린', '후시딘', '판피린'],
  ingredient: ['아세트아미노펜', '이부프로펜', '덱스트로메토르판'],
};

const RECENT_SEARCH_KEY = 'pill-trace-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCH_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter(q => q !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable
  }
}

export default function SearchBar({ onSearch, isLoading, compact, initialQuery = '', initialMode = 'drug' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const executeSearch = useCallback((keyword: string, searchMode: SearchMode) => {
    saveRecentSearch(keyword);
    setRecentSearches(getRecentSearches());
    onSearch(keyword, searchMode);
  }, [onSearch]);

  const handleRemoveRecent = useCallback((keyword: string) => {
    try {
      const recent = getRecentSearches().filter(q => q !== keyword);
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recent));
      setRecentSearches(recent);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeSearch(query.trim(), mode);
    }
  };

  const handleQuickSearch = (keyword: string) => {
    setQuery(keyword);
    executeSearch(keyword, mode);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="검색 모드">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'drug'}
          onClick={() => setMode('drug')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'drug'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          약 이름으로 검색
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'ingredient'}
          onClick={() => setMode('ingredient')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'ingredient'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          성분으로 검색
        </button>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'drug'
                  ? '약 이름을 입력하세요 (예: 타이레놀)'
                  : '성분명을 입력하세요 (예: 아세트아미노펜)'
              }
              autoFocus={!compact}
              maxLength={100}
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              aria-label={mode === 'drug' ? '약 이름 검색' : '성분명 검색'}
              className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white shadow-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : !compact && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-2 py-0.5 text-xs text-gray-300 bg-gray-50 border border-gray-200 rounded font-mono" aria-hidden="true">/</kbd>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`px-6 py-3.5 rounded-2xl font-medium transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none ${
              mode === 'drug'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>검색 중</span>
              </div>
            ) : '검색'}
          </button>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">빠른 검색:</span>
            {QUICK_EXAMPLES[mode].map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => handleQuickSearch(keyword)}
                className="px-3 py-1 text-xs bg-white border border-gray-200 text-gray-500 rounded-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>

          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">최근 검색:</span>
              {recentSearches.map((keyword) => (
                <span key={keyword} className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickSearch(keyword)}
                    className="px-3 py-1 text-xs bg-gray-50 border border-gray-200 text-gray-500 rounded-l-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {keyword}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecent(keyword)}
                    aria-label={`${keyword} 검색 기록 삭제`}
                    className="px-1.5 py-1 text-xs bg-gray-50 border border-l-0 border-gray-200 text-gray-300 rounded-r-full hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
