import { NextRequest, NextResponse } from 'next/server';
import { getEasyDrugInfo, extractItems } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemName = searchParams.get('name');

  if (!itemName || itemName.length > 200) {
    return NextResponse.json({ error: '약품명이 필요합니다. (최대 200자)' }, { status: 400 });
  }

  try {
    const data = await getEasyDrugInfo(itemName, { numOfRows: 1 });
    const { items } = extractItems(data);

    if (items.length === 0) {
      const response = NextResponse.json({ item: null });
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return response;
    }

    const response = NextResponse.json({ item: items[0] });
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return response;
  } catch (error) {
    console.error('Easy drug info error:', error);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : '의약품 상세 정보 조회 중 오류가 발생했습니다.' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
