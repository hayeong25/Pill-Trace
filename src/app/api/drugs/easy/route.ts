import { NextRequest, NextResponse } from 'next/server';
import { getEasyDrugInfo, extractItems } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemName = searchParams.get('name');

  if (!itemName) {
    return NextResponse.json({ error: '약품명이 필요합니다.' }, { status: 400 });
  }

  try {
    const data = await getEasyDrugInfo(itemName, { numOfRows: 1 });
    const { items } = extractItems(data);

    if (items.length === 0) {
      return NextResponse.json({ item: null });
    }

    return NextResponse.json({ item: items[0] });
  } catch (error) {
    console.error('Easy drug info error:', error);
    return NextResponse.json(
      { error: '의약품 상세 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
