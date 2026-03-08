import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, findSimilarDrugs, extractItems, batchedAll, BATCH_CONCURRENCY, MAX_SIMILAR_RESULTS } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const materialName = searchParams.get('material');
  const excludeSeq = (searchParams.get('exclude') || '').slice(0, 20);

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

    const str = (val: unknown) => String(val || '');
    const totalCount = similar.length;
    const sliced = similar.slice(0, MAX_SIMILAR_RESULTS);

    const easySeqs = new Set<string>();
    const priceMap = new Map<string, string>();
    const uniqueNames = Array.from(new Set(sliced.map(d => d.ITEM_NAME)));

    const [easyChecks] = await Promise.all([
      batchedAll(
        uniqueNames.map(name => () =>
          getEasyDrugInfo(name, { numOfRows: 1 }).catch(() => null)
        ),
        BATCH_CONCURRENCY
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
        BATCH_CONCURRENCY
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
      const d = drug as Record<string, unknown>;
      return {
        ITEM_SEQ: drug.ITEM_SEQ,
        ITEM_NAME: drug.ITEM_NAME,
        ENTP_NAME: drug.ENTP_NAME,
        ITEM_INGR_NAME: drug.ITEM_INGR_NAME,
        CHART: str(d.CHART),
        STORAGE_METHOD: str(d.STORAGE_METHOD),
        ITEM_PERMIT_DATE: str(d.ITEM_PERMIT_DATE),
        BIG_PRDT_IMG_URL: str(d.BIG_PRDT_IMG_URL),
        ingredients: parseIngredients(drug.ITEM_INGR_NAME, drug.ITEM_NAME),
        similarity: drug.similarity,
        hasEasyInfo: easySeqs.has(drug.ITEM_SEQ),
        maxPrice: priceMap.get(drug.ITEM_NAME) || '',
      };
    });

    return cachedJson({ items: enriched, totalCount });
  } catch (error) {
    return handleApiError(error, '유사 약품 검색');
  }
}
