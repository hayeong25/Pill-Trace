import { ParsedIngredient } from '@/types/drug';

const API_KEY = process.env.DATA_GO_KR_API_KEY || '';
const API_TIMEOUT = 10000;

const DRUG_PERMIT_BASE = 'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq07';
const EASY_DRUG_BASE = 'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList';

function fetchWithTimeout(url: string, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

async function fetchJson(url: string, timeout = API_TIMEOUT) {
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    throw new Error('API returned non-JSON response');
  }

  return res.json();
}

interface FetchOptions {
  pageNo?: number;
  numOfRows?: number;
}

interface ApiResponse {
  body?: {
    items?: Record<string, unknown>[] | { item?: Record<string, unknown> | Record<string, unknown>[] };
    totalCount?: number;
    pageNo?: number;
    numOfRows?: number;
  };
}

export function extractItems(data: ApiResponse): { items: Record<string, unknown>[]; totalCount: number; pageNo: number; numOfRows: number } {
  const body = data?.body;
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
    numOfRows: body?.numOfRows || 20,
  };
}

export async function searchDrugsByName(itemName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = 100 } = options;
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    type: 'json',
    item_name: itemName,
  });

  return fetchJson(`${DRUG_PERMIT_BASE}?${params.toString()}`);
}

export async function searchDrugsByIngredient(materialName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = 100 } = options;
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    type: 'json',
    item_ingr_name: materialName,
  });

  return fetchJson(`${DRUG_PERMIT_BASE}?${params.toString()}`);
}

export async function getEasyDrugInfo(itemName: string, options: FetchOptions = {}) {
  const { pageNo = 1, numOfRows = 100 } = options;
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    type: 'json',
    itemName: itemName,
  });

  return fetchJson(`${EASY_DRUG_BASE}?${params.toString()}`);
}

export function parseIngredients(materialName: string): ParsedIngredient[] {
  if (!materialName) return [];

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
    if (amountMatch) {
      return {
        name: amountMatch[1].replace(/\s*\(.*?\)\s*/g, '').trim(),
        amount: amountMatch[2].trim(),
        unit: '',
        raw: part,
      };
    }

    return {
      name: part.replace(/\s*\(.*?\)\s*/g, '').trim(),
      amount: '',
      unit: '',
      raw: part,
    };
  });
}

export function findSimilarDrugs(
  targetMaterials: string[],
  allDrugs: Array<Record<string, unknown>>,
  excludeSeq: string
) {
  const targetSet = new Set(targetMaterials.map(m => m.toLowerCase().trim()));

  return allDrugs
    .filter(drug => String(drug.ITEM_SEQ || '') !== excludeSeq)
    .map(drug => {
      const materialName = String(drug.MATERIAL_NAME || '');
      const drugIngredients = parseIngredients(materialName).map(i => i.name.toLowerCase().trim());
      const matchCount = drugIngredients.filter(i => targetSet.has(i)).length;
      const similarity = targetSet.size > 0 ? matchCount / Math.max(targetSet.size, drugIngredients.length) : 0;
      return { ...drug, similarity, matchCount, MATERIAL_NAME: materialName };
    })
    .filter(drug => drug.matchCount > 0)
    .sort((a, b) => b.similarity - a.similarity);
}
