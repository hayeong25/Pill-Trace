import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, getEasyDrugInfo, getDrugPriceInfo, parseIngredients, findSimilarDrugs, extractItems, batchedAll, BATCH_CONCURRENCY, MAX_SIMILAR_RESULTS } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson, mapDrugItem, buildPriceMap } from '@/lib/api-helpers';
import { normalizeIngredientName } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(request.url);
  const materialName = (searchParams.get('material') || '').trim();
  const excludeSeq = (searchParams.get('exclude') || '').trim().slice(0, 20);

  if (!materialName || materialName.length > 2000) {
    return NextResponse.json({ error: '성분 정보가 필요합니다. (최대 2000자)' }, { status: 400 });
  }

  try {
    const ingredients = parseIngredients(materialName);
    const mainIngredient = normalizeIngredientName(ingredients[0]?.name || materialName);

    const data = await searchDrugsByIngredient(mainIngredient, { numOfRows: 100 });

    const { items } = extractItems(data);

    const targetNames = ingredients.map(i => i.name);
    const similar = findSimilarDrugs(targetNames, items, excludeSeq);

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
              buildPriceMap(extractItems(d).items).forEach((v, k) => priceMap.set(k, v));
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

    const enriched = sliced.map(drug => ({
      ...mapDrugItem(drug, easySeqs, priceMap),
      similarity: drug.similarity,
    }));

    return cachedJson({ items: enriched, totalCount });
  } catch (error) {
    return handleApiError(error, '유사 약품 검색');
  }
}
