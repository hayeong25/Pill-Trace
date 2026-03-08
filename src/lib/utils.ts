export function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normalize drug name for price matching across different APIs.
 * HIRA uses abbreviations (mg, ml) while 허가정보 uses Korean (밀리그램, 밀리리터).
 */
export function normalizeDrugName(name: string): string {
  return name
    // Strip HIRA dose suffix like _(80mg/1정)
    .replace(/_\([^)]*\)\s*$/, '')
    .replace(/밀리그[램람]/g, 'mg')
    .replace(/마이크로그[램람]/g, 'mcg')
    .replace(/밀리리터/g, 'ml')
    .replace(/그[램람]/g, 'g')
    .replace(/리터/g, 'l')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Strip pharmaceutical form modifiers from ingredient names for better matching.
 * e.g. "Acetaminophen Micronized" → "Acetaminophen"
 */
export function normalizeIngredientName(name: string): string {
  const MODIFIERS = /\s+(?:Micronized|Granules?|Anhydrous|Hydrate|Monohydrate|Dihydrate|Trihydrate|Hemihydrate|Crystalline|Amorphous|Powder|Pellets?|DC|Compacted|Coated|Buffered|Dried)\b/gi;
  return name.replace(MODIFIERS, '').trim();
}

export function formatPermitDate(date: string): string {
  if (/^\d{8}$/.test(date)) {
    return `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`;
  }
  return date;
}
