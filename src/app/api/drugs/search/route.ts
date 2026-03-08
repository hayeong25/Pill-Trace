import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByName, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, extractItems } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : Math.min(pageParam, 500);

  if (!query || query.length > 100) {
    return NextResponse.json({ error: '검색어를 입력해주세요. (최대 100자)' }, { status: 400 });
  }

  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
  }

  try {
    const [data, easyData, priceData] = await Promise.all([
      searchDrugsByName(sanitizedQuery, { pageNo: page, numOfRows: 20 }),
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
      const maxPrice = priceMap.get(itemName) || '';
      return {
        ...item,
        ingredients: parseIngredients(String(item.ITEM_INGR_NAME || item.MATERIAL_NAME || ''), itemName),
        hasEasyInfo: easySeqs.has(String(item.ITEM_SEQ || '')),
        maxPrice,
      };
    });

    return cachedJson({ items: results, totalCount, pageNo, numOfRows });
  } catch (error) {
    return handleApiError(error, '의약품 검색');
  }
}
