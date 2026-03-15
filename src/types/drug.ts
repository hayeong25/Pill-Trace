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
  CHART?: string;
  STORAGE_METHOD?: string;
  ITEM_PERMIT_DATE?: string;
  BIG_PRDT_IMG_URL?: string;
  ETC_OTC_CODE?: string;
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

