import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, getEasyDrugInfo, getDrugPriceInfo, extractItems, batchedAll, MAX_QUERY_LENGTH, MAX_PAGE, DEFAULT_PAGE_SIZE, BATCH_CONCURRENCY } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson, mapDrugItem, buildPriceMap } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, MAX_PAGE);

  const sanitizedQuery = (query || '').trim();
  if (!sanitizedQuery || sanitizedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `성분명을 입력해주세요. (최대 ${MAX_QUERY_LENGTH}자)` }, { status: 400 });
  }

  try {
    const data = await searchDrugsByIngredient(sanitizedQuery, {
      pageNo: page,
      numOfRows: DEFAULT_PAGE_SIZE,
    });

    const { items, totalCount, pageNo, numOfRows } = extractItems(data);

    // Batch-check easy drug info and price data in parallel
    const uniqueNames = Array.from(new Set(items.map(item => String(item.ITEM_NAME || ''))));
    const priceMap = new Map<string, string>();

    const [easyChecks] = await Promise.all([
      batchedAll(
        uniqueNames.map(name => () =>
          getEasyDrugInfo(name, { numOfRows: 1 })
            .then(d => { const { items: ei } = extractItems(d); return { name, seq: ei.length > 0 ? String(ei[0].itemSeq || '') : '' }; })
            .catch(() => ({ name, seq: '' }))
        ),
        BATCH_CONCURRENCY
      ),
      batchedAll(
        uniqueNames.map(name => () =>
          getDrugPriceInfo(name, { numOfRows: 10 })
            .then(d => {
              buildPriceMap(extractItems(d).items).forEach((v, k) => priceMap.set(k, v));
            })
            .catch(() => {})
        ),
        BATCH_CONCURRENCY
      ),
    ]);
    const easySeqs = new Set(easyChecks.map(c => c.seq).filter(Boolean));

    const results = items.map(item => mapDrugItem(item, easySeqs, priceMap));

    return cachedJson({ items: results, totalCount, pageNo, numOfRows });
  } catch (error) {
    return handleApiError(error, '성분 검색');
  }
}
