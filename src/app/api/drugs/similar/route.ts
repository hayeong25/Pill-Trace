import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, findSimilarDrugs, extractItems, batchedAll } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const materialName = searchParams.get('material');
  const excludeSeq = searchParams.get('exclude') || '';

  if (!materialName || materialName.length > 2000) {
    return NextResponse.json({ error: '성분 정보가 필요합니다. (최대 2000자)' }, { status: 400 });
  }

  try {
    const ingredients = parseIngredients(materialName);
    const mainIngredient = ingredients[0]?.name || materialName;

    const data = await searchDrugsByIngredient(mainIngredient, { numOfRows: 100 });

    const { items } = extractItems(data);

    const targetNames = ingredients.map(i => i.name);
    const similar = findSimilarDrugs(targetNames, items, excludeSeq);

    const results = similar.map(drug => {
      const drugRecord = drug as Record<string, unknown>;
      return {
        ...drug,
        ingredients: parseIngredients(String(drug.ITEM_INGR_NAME || ''), String(drugRecord.ITEM_NAME || '')),
      };
    });

    const sliced = results.slice(0, 20);

    const easySeqs = new Set<string>();
    const priceMap = new Map<string, string>();
    const uniqueNames = Array.from(new Set(sliced.map(d => String((d as Record<string, unknown>).ITEM_NAME || ''))));

    const [easyChecks] = await Promise.all([
      batchedAll(
        uniqueNames.map(name => () =>
          getEasyDrugInfo(name, { numOfRows: 1 }).catch(() => null)
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
    for (const easyData of easyChecks) {
      if (!easyData) continue;
      const { items: easyItems } = extractItems(easyData);
      for (const item of easyItems) {
        easySeqs.add(String(item.itemSeq || ''));
      }
    }

    const enriched = sliced.map(drug => {
      const drugRecord = drug as Record<string, unknown>;
      return {
        ...drug,
        hasEasyInfo: easySeqs.has(String(drugRecord.ITEM_SEQ || '')),
        maxPrice: priceMap.get(String(drugRecord.ITEM_NAME || '')) || '',
      };
    });

    const response = NextResponse.json({
      items: enriched,
      totalCount: results.length,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('[Pill Trace] Similar drugs search error:', error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : '유사 약품 검색 중 오류가 발생했습니다.' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
