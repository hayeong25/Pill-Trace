import { describe, it, expect } from 'vitest';
import { parseIngredients, extractKoreanIngredients, findSimilarDrugs, extractItems, batchedAll } from '@/lib/api';

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
});
