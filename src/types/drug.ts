export interface DrugInfo {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  ITEM_PERMIT_DATE: string;
  CHART: string;
  MATERIAL_NAME: string;
  STORAGE_METHOD: string;
  VALID_TERM: string;
  EE_DOC_DATA: string;
  UD_DOC_DATA: string;
  NB_DOC_DATA: string;
  INSERT_FILE: string;
  BIG_PRDT_IMG_URL: string;
  PERMIT_KIND_NAME: string;
  CANCEL_DATE: string;
  CANCEL_NAME: string;
  EDI_CODE: string;
}

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
  amount: string;
  unit: string;
  raw: string;
}

export interface DrugSearchResult {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  MATERIAL_NAME: string;
  CHART: string;
  STORAGE_METHOD: string;
  ITEM_PERMIT_DATE: string;
  BIG_PRDT_IMG_URL: string;
  ingredients: ParsedIngredient[];
}

export interface SearchResponse {
  items: DrugSearchResult[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

