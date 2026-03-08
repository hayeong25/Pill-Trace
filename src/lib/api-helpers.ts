import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { parseIngredients } from '@/lib/api';
import { normalizeDrugName } from '@/lib/utils';

/**
 * Check rate limit for the request IP. Returns a 429 response if exceeded, or null if OK.
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = rateLimit(ip);
  if (!success) {
    const res = NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
    res.headers.set('Retry-After', '60');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  return null;
}

/**
 * Create a standardized error response for API route catch blocks.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[Pill Trace] ${context}:`, error);
  const isTimeout = error instanceof Error && error.name === 'AbortError';
  const res = NextResponse.json(
    { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : `${context} 중 오류가 발생했습니다.` },
    { status: isTimeout ? 504 : 500 }
  );
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

/**
 * Create a cached JSON response with standard cache headers.
 */
export function cachedJson(data: unknown, maxAge = 300, staleWhileRevalidate = 600): NextResponse {
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  return response;
}

/**
 * Build a price map from HIRA API items using normalized drug names as keys.
 */
export function buildPriceMap(priceItems: Record<string, unknown>[]): Map<string, string> {
  const priceMap = new Map<string, string>();
  for (const item of priceItems) {
    const name = String(item.itmNm || '');
    const price = String(item.mxCprc || '');
    if (name && price) {
      priceMap.set(normalizeDrugName(name), price);
    }
  }
  return priceMap;
}

/**
 * Convert raw API item to a standardized drug search result object.
 */
export function mapDrugItem(
  item: Record<string, unknown>,
  easySeqs: Set<string>,
  priceMap: Map<string, string>,
) {
  const itemName = String(item.ITEM_NAME || '');
  const ingredientName = String(item.ITEM_INGR_NAME || item.MATERIAL_NAME || '');
  return {
    ITEM_SEQ: String(item.ITEM_SEQ || ''),
    ITEM_NAME: itemName,
    ENTP_NAME: String(item.ENTP_NAME || ''),
    ITEM_INGR_NAME: ingredientName,
    CHART: String(item.CHART || ''),
    STORAGE_METHOD: String(item.STORAGE_METHOD || ''),
    ITEM_PERMIT_DATE: String(item.ITEM_PERMIT_DATE || ''),
    BIG_PRDT_IMG_URL: String(item.BIG_PRDT_IMG_URL || ''),
    ETC_OTC_CODE: String(item.ETC_OTC_CODE || ''),
    ingredients: parseIngredients(ingredientName, itemName),
    hasEasyInfo: easySeqs.has(String(item.ITEM_SEQ || '')),
    maxPrice: priceMap.get(normalizeDrugName(itemName)) || '',
  };
}
