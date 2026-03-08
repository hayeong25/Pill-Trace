import { NextRequest, NextResponse } from 'next/server';
import { getDrugPriceInfo, extractItems } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = rateLimit(ip);
  if (!success) {
    const res = NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    res.headers.set('Retry-After', '60');
    return res;
  }

  const { searchParams } = new URL(request.url);
  const itemName = searchParams.get('name');

  if (!itemName || itemName.length > 200) {
    return NextResponse.json({ error: '약품명이 필요합니다. (최대 200자)' }, { status: 400 });
  }

  try {
    const data = await getDrugPriceInfo(itemName, { numOfRows: 10 });
    const { items } = extractItems(data);

    const prices = items.map(item => ({
      itemName: item.itmNm,
      entpName: item.mnfEntpNm,
      mdsCd: item.mdsCd,
      mxCprc: item.mxCprc,
      unit: item.unit,
      adtStaDd: item.adtStaDd,
      adtEndDd: item.adtEndDd,
    }));

    const response = NextResponse.json({ items: prices });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error) {
    console.error('[Pill Trace] Drug price info error:', error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? '검색 시간이 초과되었습니다. 다시 시도해주세요.' : '약가 정보 조회 중 오류가 발생했습니다.' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
