import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, extractItems, batchedAll } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 500);

  if (!query || query.length > 100) {
    return NextResponse.json({ error: '성분명을 입력해주세요. (최대 100자)' }, { status: 400 });
  }

  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return NextResponse.json({ error: '성분명을 입력해주세요.' }, { status: 400 });
  }

  try {
    const data = await searchDrugsByIngredient(sanitizedQuery, {
      pageNo: page,
      numOfRows: 20,
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
        5
      ),
      batchedAll(
        uniqueNames.map(name => () =>
          getDrugPriceInfo(name, { numOfRows: 10 })
            .then(d => {
              const { items: priceItems } = extractItems(d);
              for (const p of priceItems) {
                const pName = String(p.itmNm || '');
                const price = String(p.mxCprc || '');
                if (pName && price) priceMap.set(pName, price);
              }
            })
            .catch(() => {})
        ),
        5
      ),
    ]);
    const easySeqs = new Set(easyChecks.map(c => c.seq).filter(Boolean));

    const results = items.map((item) => {
      const itemName = String(item.ITEM_NAME || '');
      return {
        ...item,
        ingredients: parseIngredients(String(item.ITEM_INGR_NAME || item.MATERIAL_NAME || ''), itemName),
        hasEasyInfo: easySeqs.has(String(item.ITEM_SEQ || '')),
        maxPrice: priceMap.get(itemName) || '',
      };
    });

    return cachedJson({ items: results, totalCount, pageNo, numOfRows });
  } catch (error) {
    return handleApiError(error, '성분 검색');
  }
}
