export interface EasyDrugInfo {
  entpName: string;
  itemName: string;
  itemSeq: string;
  efcyQesitm: string;
  useMethodQesitm: string;
  atpnWarnQesitm: string;
  atpnQesitm: string;
  intrcQesitm: string;
  seQesitm: string;
  depositMethodQesitm: string;
  openDe: string;
  updateDe: string;
  itemImage: string;
}

export interface ParsedIngredient {
  name: string;
  nameKo: string;
  amount: string;
  unit: string;
  raw: string;
}

export interface DrugSearchResult {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  ITEM_INGR_NAME: string;
  MATERIAL_NAME?: string;
  CHART?: string;
  STORAGE_METHOD?: string;
  ITEM_PERMIT_DATE?: string;
  BIG_PRDT_IMG_URL?: string;
  ingredients: ParsedIngredient[];
  hasEasyInfo: boolean;
  maxPrice?: string;
}

export interface SearchResponse {
  items: DrugSearchResult[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

