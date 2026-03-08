import { describe, it, expect } from 'vitest';
import { parseIngredients, extractKoreanIngredients, findSimilarDrugs, extractItems, batchedAll, DEFAULT_PAGE_SIZE } from '@/lib/api';

describe('parseIngredients', () => {
  it('parses slash-separated ITEM_INGR_NAME format', () => {
    const result = parseIngredients('Acetaminophen/Caffeine');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Acetaminophen');
    expect(result[1].name).toBe('Caffeine');
  });

  it('extracts Korean names from item name parenthetical', () => {
    const result = parseIngredients('Acetaminophen/Ibuprofen', '테스트약(아세트아미노펜·이부프로펜)');
    expect(result).toHaveLength(2);
    expect(result[0].nameKo).toBe('아세트아미노펜');
    expect(result[1].nameKo).toBe('이부프로펜');
  });

  it('parses MATERIAL_NAME format with sections', () => {
    const result = parseIngredients('총량 : 1정 | 유효성분 : 아세트아미노펜 500mg; 카페인 50mg | 첨가제 : 전분');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('아세트아미노펜');
    expect(result[0].amount).toBe('500mg');
    expect(result[1].name).toBe('카페인');
    expect(result[1].amount).toBe('50mg');
  });

  it('returns empty array for empty input', () => {
    expect(parseIngredients('')).toEqual([]);
  });

  it('deduplicates same ingredient names', () => {
    const result = parseIngredients('Acetaminophen/Acetaminophen');
    expect(result).toHaveLength(1);
  });

  it('strips parenthetical content from names', () => {
    const result = parseIngredients('Acetaminophen (USP)');
    expect(result[0].name).toBe('Acetaminophen');
  });

  it('parses pipe-separated format without headers', () => {
    const result = parseIngredients('성분A 100mg; 성분B 200mg | 성분C 50mg');
    expect(result).toHaveLength(3);
  });

  it('handles Korean ingredient names with amounts', () => {
    const result = parseIngredients('유효성분 : 아세트아미노펜 500mg');
    expect(result[0].name).toBe('아세트아미노펜');
    expect(result[0].amount).toBe('500mg');
    expect(result[0].nameKo).toBe('아세트아미노펜');
  });
});

describe('extractKoreanIngredients', () => {
  it('extracts from parenthetical at end of name', () => {
    const result = extractKoreanIngredients('테스트약(아세트아미노펜·이부프로펜)');
    expect(result).toEqual(['아세트아미노펜', '이부프로펜']);
  });

  it('returns empty for no parenthetical', () => {
    expect(extractKoreanIngredients('타이레놀')).toEqual([]);
  });

  it('skips export name parenthetical', () => {
    expect(extractKoreanIngredients('약(수출명:test)')).toEqual([]);
  });

  it('splits by slash, dot, and comma', () => {
    const result = extractKoreanIngredients('약(성분1/성분2)');
    expect(result).toEqual(['성분1', '성분2']);
  });

  it('handles middot separator', () => {
    const result = extractKoreanIngredients('약(가·나·다)');
    expect(result).toEqual(['가', '나', '다']);
  });

  it('skips parenthetical starting with 변경', () => {
    expect(extractKoreanIngredients('약(변경사항)')).toEqual([]);
  });
});

describe('findSimilarDrugs', () => {
  const drugs = [
    { ITEM_SEQ: '1', ITEM_INGR_NAME: 'Acetaminophen/Caffeine', ITEM_NAME: 'Drug A' },
    { ITEM_SEQ: '2', ITEM_INGR_NAME: 'Acetaminophen', ITEM_NAME: 'Drug B' },
    { ITEM_SEQ: '3', ITEM_INGR_NAME: 'Ibuprofen', ITEM_NAME: 'Drug C' },
    { ITEM_SEQ: '4', ITEM_INGR_NAME: 'Acetaminophen/Caffeine/Aspirin', ITEM_NAME: 'Drug D' },
  ];

  it('finds drugs with matching ingredients', () => {
    const result = findSimilarDrugs(['Acetaminophen'], drugs, '0');
    expect(result.length).toBe(3); // Drug A, B, D
  });

  it('excludes drug by ITEM_SEQ', () => {
    const result = findSimilarDrugs(['Acetaminophen'], drugs, '1');
    expect(result.length).toBe(2); // Drug B, D (excludes Drug A)
  });

  it('sorts by similarity descending', () => {
    const result = findSimilarDrugs(['Acetaminophen'], drugs, '0');
    expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
  });

  it('returns empty for no matches', () => {
    const result = findSimilarDrugs(['UnknownDrug'], drugs, '0');
    expect(result).toHaveLength(0);
  });

  it('handles case-insensitive matching', () => {
    const result = findSimilarDrugs(['acetaminophen'], drugs, '0');
    expect(result.length).toBe(3);
  });
});

describe('extractItems', () => {
  it('extracts items from body.items array', () => {
    const data = { body: { items: [{ name: 'test' }], totalCount: 1 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('extracts single item from body.items.item', () => {
    const data = { body: { items: { item: { name: 'test' } }, totalCount: 1 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(1);
  });

  it('extracts item array from body.items.item', () => {
    const data = { body: { items: { item: [{ name: 'a' }, { name: 'b' }] }, totalCount: 2 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(2);
  });

  it('returns empty for error resultCode', () => {
    const data = { header: { resultCode: '99', resultMsg: 'Error' }, body: { items: [{ name: 'test' }] } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(0);
  });

  it('returns empty for null/undefined data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = extractItems({} as any);
    expect(result.items).toHaveLength(0);
  });

  it('handles body with null items', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = { body: { items: null as any, totalCount: 0 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(0);
  });

  it('passes through resultCode 00 as success', () => {
    const data = { header: { resultCode: '00' }, body: { items: [{ name: 'test' }], totalCount: 1 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(1);
  });
});

describe('batchedAll', () => {
  it('executes all tasks with concurrency limit', async () => {
    const order: number[] = [];
    const tasks = [1, 2, 3, 4, 5].map(n => async () => {
      order.push(n);
      return n * 2;
    });

    const results = await batchedAll(tasks, 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
    expect(order).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty task list', async () => {
    const results = await batchedAll([], 5);
    expect(results).toEqual([]);
  });

  it('handles concurrency greater than task count', async () => {
    const tasks = [1, 2].map(n => async () => n);
    const results = await batchedAll(tasks, 10);
    expect(results).toEqual([1, 2]);
  });

  it('propagates errors from failing tasks', async () => {
    const tasks = [
      async () => 1,
      async () => { throw new Error('fail'); },
    ];
    await expect(batchedAll(tasks, 2)).rejects.toThrow('fail');
  });

  it('handles single task', async () => {
    const results = await batchedAll([async () => 42], 1);
    expect(results).toEqual([42]);
  });

  it('respects concurrency limit', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const tasks = Array.from({ length: 6 }, () => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise(r => setTimeout(r, 10));
      concurrent--;
      return maxConcurrent;
    });
    await batchedAll(tasks, 3);
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });
});

describe('edge cases', () => {
  it('findSimilarDrugs with empty target materials returns empty', () => {
    const drugs = [{ ITEM_SEQ: '1', ITEM_INGR_NAME: 'Acetaminophen', ITEM_NAME: 'Drug A' }];
    const result = findSimilarDrugs([], drugs, '0');
    expect(result).toHaveLength(0);
  });

  it('parseIngredients maps single Korean name to single ingredient', () => {
    const result = parseIngredients('Acetaminophen', '타이레놀(아세트아미노펜)');
    expect(result).toHaveLength(1);
    expect(result[0].nameKo).toBe('아세트아미노펜');
  });

  it('parseIngredients with mismatched Korean name count sets empty', () => {
    const result = parseIngredients('Acetaminophen/Caffeine', '약(아세트아미노펜·이부프로펜·카페인)');
    // 3 Korean names vs 2 ingredients → no match
    expect(result[0].nameKo).toBe('');
    expect(result[1].nameKo).toBe('');
  });

  it('extractItems returns defaults for missing body fields', () => {
    const data = { body: { items: [{ name: 'test' }] } };
    const result = extractItems(data);
    expect(result.totalCount).toBe(0);
    expect(result.pageNo).toBe(1);
    expect(result.numOfRows).toBe(DEFAULT_PAGE_SIZE);
  });

  it('findSimilarDrugs calculates similarity correctly for full match', () => {
    const drugs = [{ ITEM_SEQ: '1', ITEM_INGR_NAME: 'A/B', ITEM_NAME: 'Drug' }];
    const result = findSimilarDrugs(['A', 'B'], drugs, '0');
    expect(result[0].similarity).toBe(1);
  });

  it('extractKoreanIngredients skips 구 prefix parenthetical', () => {
    expect(extractKoreanIngredients('약(구 성분명)')).toEqual([]);
  });

  it('extractKoreanIngredients skips 수출용 prefix', () => {
    expect(extractKoreanIngredients('약(수출용제품)')).toEqual([]);
  });

  it('parseIngredients handles comma-separated in MATERIAL_NAME', () => {
    const result = parseIngredients('유효성분 : 성분A 10mg, 성분B 20mg');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('성분A');
    expect(result[1].name).toBe('성분B');
  });

  it('findSimilarDrugs partial match gives fractional similarity', () => {
    const drugs = [{ ITEM_SEQ: '1', ITEM_INGR_NAME: 'A/B/C', ITEM_NAME: 'Drug' }];
    const result = findSimilarDrugs(['A'], drugs, '0');
    expect(result[0].similarity).toBeGreaterThan(0);
    expect(result[0].similarity).toBeLessThan(1);
  });

  it('extractItems handles items.item as empty array', () => {
    const data = { body: { items: { item: [] }, totalCount: 0 } };
    const result = extractItems(data);
    expect(result.items).toHaveLength(0);
  });

  it('batchedAll preserves order across batches', async () => {
    const tasks = [10, 20, 30].map(n => async () => n);
    const results = await batchedAll(tasks, 1);
    expect(results).toEqual([10, 20, 30]);
  });

  it('findSimilarDrugs returns matchCount and typed fields', () => {
    const drugs = [{ ITEM_SEQ: '1', ITEM_INGR_NAME: 'A/B/C', ITEM_NAME: 'Drug X', ENTP_NAME: 'Corp' }];
    const result = findSimilarDrugs(['A', 'C'], drugs, '0');
    expect(result[0].matchCount).toBe(2);
    expect(result[0].ITEM_SEQ).toBe('1');
    expect(result[0].ITEM_NAME).toBe('Drug X');
    expect(result[0].ENTP_NAME).toBe('Corp');
    expect(result[0].ITEM_INGR_NAME).toBe('A/B/C');
  });

  it('findSimilarDrugs falls back to MATERIAL_NAME when ITEM_INGR_NAME is empty', () => {
    const drugs = [{ ITEM_SEQ: '1', MATERIAL_NAME: 'X/Y', ITEM_NAME: 'Drug' }];
    const result = findSimilarDrugs(['X'], drugs, '0');
    expect(result).toHaveLength(1);
    expect(result[0].ITEM_INGR_NAME).toBe('X/Y');
  });

  it('parseIngredients with only 총량 section returns empty', () => {
    const result = parseIngredients('총량 : 1정 중');
    expect(result).toHaveLength(0);
  });

  it('parseIngredients skips 첨가제 section', () => {
    const result = parseIngredients('총량 : 1정 | 유효성분 : 성분A 10mg | 첨가제 : 전분, 유당');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('성분A');
  });

  it('findSimilarDrugs returns typed ITEM_SEQ as string for numeric input', () => {
    const drugs = [{ ITEM_SEQ: 12345, ITEM_INGR_NAME: 'A', ITEM_NAME: 'Drug' }];
    const result = findSimilarDrugs(['A'], drugs as Record<string, unknown>[], '0');
    expect(result[0].ITEM_SEQ).toBe('12345');
    expect(typeof result[0].ITEM_SEQ).toBe('string');
  });

  it('extractKoreanIngredients handles comma-separated names', () => {
    const result = extractKoreanIngredients('약(성분1,성분2)');
    expect(result).toEqual(['성분1', '성분2']);
  });

  it('extractKoreanIngredients returns empty for empty parenthetical', () => {
    expect(extractKoreanIngredients('약()')).toEqual([]);
  });

  it('parseIngredients deduplicates case-insensitively', () => {
    const result = parseIngredients('acetaminophen/Acetaminophen');
    expect(result).toHaveLength(1);
  });

  it('findSimilarDrugs sorts higher similarity first', () => {
    const drugs = [
      { ITEM_SEQ: '1', ITEM_INGR_NAME: 'A', ITEM_NAME: 'Drug1' },
      { ITEM_SEQ: '2', ITEM_INGR_NAME: 'A/B', ITEM_NAME: 'Drug2' },
      { ITEM_SEQ: '3', ITEM_INGR_NAME: 'A/B/C', ITEM_NAME: 'Drug3' },
    ];
    const result = findSimilarDrugs(['A', 'B'], drugs, '0');
    expect(result[0].ITEM_SEQ).toBe('2'); // 100% match
    expect(result[0].similarity).toBeGreaterThan(result[1].similarity);
  });

  it('parseIngredients with pipe-separated sections without header', () => {
    const result = parseIngredients('성분X 100mg; 성분Y 200mg | 성분Z 50mg');
    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe('100mg');
    expect(result[2].amount).toBe('50mg');
  });

  it('findSimilarDrugs with all drugs excluded returns empty', () => {
    const drugs = [{ ITEM_SEQ: '1', ITEM_INGR_NAME: 'A', ITEM_NAME: 'Drug' }];
    const result = findSimilarDrugs(['A'], drugs, '1');
    expect(result).toHaveLength(0);
  });

  it('extractKoreanIngredients treats dot as non-separator', () => {
    const result = extractKoreanIngredients('약(성분1.성분2)');
    expect(result).toEqual(['성분1.성분2']);
  });
});
