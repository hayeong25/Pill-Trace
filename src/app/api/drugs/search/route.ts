import { NextRequest, NextResponse } from 'next/server';
import { searchDrugsByName, parseIngredients, extractItems } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  if (!query || query.length > 100) {
    return NextResponse.json({ error: '검색어를 입력해주세요. (최대 100자)' }, { status: 400 });
  }

  try {
    const data = await searchDrugsByName(query, {
      pageNo: page,
      numOfRows: 20,
    });

    const { items, totalCount, pageNo, numOfRows } = extractItems(data);

    const results = items.map((item) => ({
      ...item,
      ingredients: parseIngredients(String(item.MATERIAL_NAME || '')),
    }));

    const response = NextResponse.json({
      items: results,
      totalCount,
      pageNo,
      numOfRows,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Drug search error:', error);
    return NextResponse.json(
      { error: '의약품 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
