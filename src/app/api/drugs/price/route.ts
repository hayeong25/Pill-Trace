import { NextRequest, NextResponse } from 'next/server';
import { getDrugPriceInfo, extractItems } from '@/lib/api';
import { checkRateLimit, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

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
    return handleApiError(error, '약가 정보 조회');
  }
}
