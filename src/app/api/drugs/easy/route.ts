import { NextRequest, NextResponse } from 'next/server';
import { getEasyDrugInfo, extractItems } from '@/lib/api';
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
    const data = await getEasyDrugInfo(itemName, { numOfRows: 1 });
    const { items } = extractItems(data);

    if (items.length === 0) {
      return cachedJson({ item: null });
    }

    return cachedJson({ item: items[0] }, 600, 1200);
  } catch (error) {
    return handleApiError(error, '의약품 상세 정보 조회');
  }
}
