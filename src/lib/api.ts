import { ParsedIngredient } from '@/types/drug';
import { normalizeIngredientName } from '@/lib/utils';

const API_KEY = process.env.DATA_GO_KR_API_KEY || '';
const API_TIMEOUT = 10_000;
const FETCH_RETRIES = 1;
const RETRY_DELAY = 500;
export const DEFAULT_PAGE_SIZE = 20;
export const BATCH_CONCURRENCY = 5;
export const MAX_SIMILAR_RESULTS = 20;
export const MAX_QUERY_LENGTH = 100;
export const MAX_PAGE = 500;
const API_MAX_ROWS = 100;

if (!API_KEY && typeof window === 'undefined') {
  console.warn('[Pill Trace] DATA_GO_KR_API_KEY is not set. API calls will fail.');
}

const DRUG_PERMIT_BASE = 'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07';
const EASY_DRUG_BASE = 'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList';
const DRUG_PRICE_BASE = 'https://apis.data.go.kr/B551182/dgamtCrtrInfoService1.2/getDgamtList';

class TimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

async function fetchWithTimeout(url: string, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new TimeoutError();
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function fetchJson(url: string, timeout = API_TIMEOUT, retries = FETCH_RETRIES) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeout);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        throw new Error('API returned non-JSON response');
      }

      return await res.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on client abort or 4xx errors
      if (lastError.name === 'AbortError' || /API error: 4\d{2}/.test(lastError.message)) break;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }
  throw lastError;
}

interface FetchOptions {
  pageNo?: number;
  numOfRows?: number;
}

function buildApiUrl(base: string, extraParams: Record<string, string>, typeParam = 'type'): string {
  const { pageNo = '1', numOfRows = String(API_MAX_ROWS), ...rest } = extraParams;
  const params = new URLSearchParams({ pageNo, numOfRows, [typeParam]: 'json', ...rest });
  // serviceKey must not be double-encoded — append it raw
  return `${base}?serviceKey=${API_KEY}&${params.toString()}`;
}

interface ApiResponseInner {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    items?: Record<string, unknown>[] | { item?: Record<string, unknown> | Record<string, unknown>[] };
    totalCount?: number;
    pageNo?: number;
    numOfRows?: number;
  };
}

type ApiResponse = ApiResponseInner | { response: ApiResponseInner };

export function extractItems(data: ApiResponse): { items: Record<string, unknown>[]; totalCount: number; pageNo: number; numOfRows: number } {
  // Unwrap response wrapper if present (HIRA APIs use { response: { header, body } })
  const unwrapped = 'response' in data && data.response ? data.response : data as ApiResponseInner;

  // Check API-level error codes (data.go.kr returns 200 OK with error in header)
  const resultCode = unwrapped?.header?.resultCode;
  if (resultCode && resultCode !== '00') {
    const msg = unwrapped.header?.resultMsg || 'Unknown API error';
    console.error(`[Pill Trace] API error: resultCode=${resultCode}, resultMsg=${msg}`);
    return { items: [], totalCount: 0, pageNo: 1, numOfRows: DEFAULT_PAGE_SIZE };
  }

  const body = unwrapped?.body;
  const rawItems = body?.items;
  let items: Record<string, unknown>[] = [];

  if (Array.isArray(rawItems)) {
    items = rawItems as Record<string, unknown>[];
  } else if (rawItems && 'item' in rawItems) {
    const rawItem = rawItems.item;
    items = Array.isArray(rawItem) ? rawItem : rawItem ? [rawItem] : [];
  }

  return {
    items,
    totalCount: body?.totalCount || 0,
    pageNo: body?.pageNo || 1,
    numOfRows: body?.numOfRows || DEFAULT_PAGE_SIZE,
  };
}

export async function searchDrugsByName(itemName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = API_MAX_ROWS } = options;
  const url = buildApiUrl(DRUG_PERMIT_BASE, {
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    item_name: itemName,
  });
  return fetchJson(url);
}

export async function searchDrugsByIngredient(materialName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = API_MAX_ROWS } = options;
  const url = buildApiUrl(DRUG_PERMIT_BASE, {
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    item_ingr_name: materialName,
  });
  return fetchJson(url);
}

export async function getEasyDrugInfo(itemName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = API_MAX_ROWS } = options;
  const url = buildApiUrl(EASY_DRUG_BASE, {
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    itemName: itemName,
  });
  return fetchJson(url);
}

export async function getDrugPriceInfo(itemName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = API_MAX_ROWS } = options;
  // HIRA APIs use _type instead of type for JSON format
  const url = buildApiUrl(DRUG_PRICE_BASE, {
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    itmNm: itemName,
  }, '_type');
  return fetchJson(url);
}

export function extractKoreanIngredients(itemName: string): string[] {
  const match = itemName.match(/\(([^)]+)\)\s*$/);
  if (!match) return [];

  const content = match[1];
  // Skip non-ingredient parentheticals like "수출명:..." or pure numbers
  if (/^(수출명|수출용|변경|구\s)/.test(content)) return [];

  return content.split(/[·\/,]/).map(s => s.trim()).filter(Boolean);
}

export function parseIngredients(ingredientName: string, itemName?: string): ParsedIngredient[] {
  if (!ingredientName) return [];

  // MATERIAL_NAME format (legacy): "총량 : ... | 유효성분 : name1 amount1; name2 amount2 | 첨가제 : ..."
  if (ingredientName.includes('|') || ingredientName.includes('총량') || ingredientName.includes('유효성분')) {
    return parseMaterialName(ingredientName);
  }

  // ITEM_INGR_NAME format: "Ingredient1/Ingredient2/Ingredient3"
  const parts = ingredientName.split('/').map(s => s.trim()).filter(Boolean);
  const koreanNames = itemName ? extractKoreanIngredients(itemName) : [];

  // Deduplicate ingredients (API sometimes returns same ingredient twice)
  const seen = new Set<string>();
  const uniqueParts = parts.filter(part => {
    const key = part.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueParts.map((part, idx) => ({
    name: part.replace(/\s*\([^)]*\)\s*/g, '').trim(),
    nameKo: koreanNames.length === uniqueParts.length ? koreanNames[idx] : (koreanNames.length === 1 && uniqueParts.length === 1 ? koreanNames[0] : ''),
    amount: '',
    unit: '',
    raw: part,
  }));
}

function parseMaterialName(materialName: string): ParsedIngredient[] {
  const sections = materialName.split(/[|]/).map(s => s.trim()).filter(Boolean);

  const ingredientParts: string[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^(총량|유효성분|첨가제)\s*:\s*(.*)$/);

    if (headerMatch) {
      const [, header, content] = headerMatch;
      if (header === '총량' || header === '첨가제') continue;
      const subParts = content.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      ingredientParts.push(...subParts);
    } else {
      const subParts = section.split(/[;]/).map(s => s.trim()).filter(Boolean);
      ingredientParts.push(...subParts);
    }
  }

  return ingredientParts.map(part => {
    const amountMatch = part.match(/^(.+?)\s+([\d,.]+\s*[a-zA-Zμ㎍㎎㎖%]+.*)$/);
    const name = amountMatch
      ? amountMatch[1].replace(/\s*\([^)]*\)\s*/g, '').trim()
      : part.replace(/\s*\([^)]*\)\s*/g, '').trim();
    return {
      name,
      nameKo: /[가-힣]/.test(name) ? name : '',
      amount: amountMatch ? amountMatch[2].trim() : '',
      unit: '',
      raw: part,
    };
  });
}

export async function batchedAll<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  return results;
}

export interface SimilarDrugResult extends Record<string, unknown> {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  ITEM_INGR_NAME: string;
  CHART?: string;
  STORAGE_METHOD?: string;
  ITEM_PERMIT_DATE?: string;
  BIG_PRDT_IMG_URL?: string;
  ETC_OTC_CODE?: string;
  SPCLTY_PBLC?: string;
  similarity: number;
  matchCount: number;
}

export function findSimilarDrugs(
  targetMaterials: string[],
  allDrugs: Array<Record<string, unknown>>,
  excludeSeq: string
): SimilarDrugResult[] {
  const targetSet = new Set(targetMaterials.map(m => normalizeIngredientName(m).toLowerCase().trim()));

  return allDrugs
    .filter(drug => String(drug.ITEM_SEQ || '') !== excludeSeq)
    .map(drug => {
      const ingredientName = String(drug.ITEM_INGR_NAME || drug.MATERIAL_NAME || '');
      const drugIngredients = parseIngredients(ingredientName).map(i => normalizeIngredientName(i.name).toLowerCase().trim());
      const matchCount = drugIngredients.filter(i => targetSet.has(i)).length;
      const similarity = targetSet.size > 0 ? matchCount / Math.max(targetSet.size, drugIngredients.length) : 0;
      return {
        ...drug,
        ITEM_SEQ: String(drug.ITEM_SEQ || ''),
        ITEM_NAME: String(drug.ITEM_NAME || ''),
        ENTP_NAME: String(drug.ENTP_NAME || ''),
        ITEM_INGR_NAME: ingredientName,
        similarity,
        matchCount,
      } as SimilarDrugResult;
    })
    .filter(drug => drug.matchCount > 0)
    .sort((a, b) => b.similarity - a.similarity);
}
