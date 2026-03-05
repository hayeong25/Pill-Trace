import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByIngredient, parseIngredients, findSimilarDrugs, extractItems } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const materialName = searchParams.get('material');
  const excludeSeq = searchParams.get('exclude') || '';

  if (!materialName) {
    return NextResponse.json({ error: '성분 정보가 필요합니다.' }, { status: 400 });
  }

  try {
    const ingredients = parseIngredients(materialName);
    const mainIngredient = ingredients[0]?.name || materialName;

    const data = await searchDrugsByIngredient(mainIngredient, { numOfRows: 100 });

    const { items } = extractItems(data);

    const targetNames = ingredients.map(i => i.name);
    const drugItems = items as unknown as Array<{ ITEM_NAME: string; MATERIAL_NAME: string; ITEM_SEQ: string; ENTP_NAME: string }>;
    const similar = findSimilarDrugs(targetNames, drugItems, excludeSeq);

    const results = similar.map(drug => ({
      ...drug,
      ingredients: parseIngredients(drug.MATERIAL_NAME || ''),
    }));

    return NextResponse.json({
      items: results.slice(0, 20),
      totalCount: results.length,
    });
  } catch (error) {
    console.error('Similar drugs search error:', error);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : '유사 약품 검색 중 오류가 발생했습니다.' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
