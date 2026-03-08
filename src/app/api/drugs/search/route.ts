import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByName, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, extractItems, MAX_QUERY_LENGTH, MAX_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, MAX_PAGE);

  const sanitizedQuery = (query || '').trim();
  if (!sanitizedQuery || sanitizedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `검색어를 입력해주세요. (최대 ${MAX_QUERY_LENGTH}자)` }, { status: 400 });
  }

  try {
    const [data, easyData, priceData] = await Promise.all([
      searchDrugsByName(sanitizedQuery, { pageNo: page, numOfRows: DEFAULT_PAGE_SIZE }),
      getEasyDrugInfo(sanitizedQuery, { numOfRows: 100 }).catch(() => null),
      getDrugPriceInfo(sanitizedQuery, { numOfRows: 100 }).catch(() => null),
    ]);

    const { items, totalCount, pageNo, numOfRows } = extractItems(data);

    const easySeqs = new Set<string>();
    if (easyData) {
      const { items: easyItems } = extractItems(easyData);
      for (const item of easyItems) {
        easySeqs.add(String(item.itemSeq || ''));
      }
    }

    const priceMap = new Map<string, string>();
    if (priceData) {
      const { items: priceItems } = extractItems(priceData);
      for (const item of priceItems) {
        const name = String(item.itmNm || '');
        const price = String(item.mxCprc || '');
        if (name && price) {
          priceMap.set(name, price);
        }
      }
    }

    const results = items.map((item) => {
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
        ingredients: parseIngredients(ingredientName, itemName),
        hasEasyInfo: easySeqs.has(String(item.ITEM_SEQ || '')),
        maxPrice: priceMap.get(itemName) || '',
      };
    });

    return cachedJson({ items: results, totalCount, pageNo, numOfRows });
  } catch (error) {
    return handleApiError(error, '의약품 검색');
  }
}
