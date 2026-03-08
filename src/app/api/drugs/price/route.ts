import { NextRequest, NextResponse } from 'next/server';
import { getDrugPriceInfo, extractItems } from '@/lib/api';
import { checkRateLimit, handleApiError, cachedJson } from '@/lib/api-helpers';

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

    return cachedJson({ items: prices }, 3600, 7200);
  } catch (error) {
    return handleApiError(error, '약가 정보 조회');
  }
}
