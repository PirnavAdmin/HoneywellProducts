/**
 * Standardized SKU Generator Utility
 * Format: BRAND-CATEGORY-TYPE-SPEC-SEQ
 * Example: HW-CCTV-BLT-12MP-001
 */

// Standardized Brand Codes Mapping
export const BRAND_CODES = {
  'honeywell': 'HW',
  'honeywell security': 'HW',
  'cp plus': 'CP',
  'cp-plus': 'CP',
  'cpplus': 'CP',
  'gramstrong': 'GS',
  'gramstrong republic': 'GS',
  'kisankraft': 'KK',
  'netafim': 'NET',
  'stihl': 'STI',
  'aspee': 'ASP',
  'kirloskar': 'KIR',
  'mahindra agri': 'MAH',
  'mahindra': 'MAH',
  'falcon tools': 'FAL',
  'falcon': 'FAL',
  'neptune': 'NEP',
  'agripro': 'AGP',
  'aquaflow': 'AQF',
  'vst shakti': 'VST',
  'vst': 'VST',
  'greengrow': 'GGR',
};

// Standardized Category Codes Mapping
export const CATEGORY_CODES = {
  'cctv / security products': 'CCTV',
  'cctv & security': 'CCTV',
  'cctv': 'CCTV',
  'security products': 'CCTV',
  'security': 'CCTV',
  'network cameras': 'CCTV',
  'cameras': 'CCTV',
  'surveillance': 'CCTV',
  'solar products': 'SOL',
  'solar & renewable': 'SOL',
  'solar': 'SOL',
};

// Standardized Product Type / Subcategory Codes Mapping
export const TYPE_CODES = {
  // CCTV & Security Types
  'bullet camera': 'BLT',
  'bullet': 'BLT',
  'dome camera': 'DOM',
  'dome': 'DOM',
  'ptz camera': 'PTZ',
  'ptz': 'PTZ',
  'turret camera': 'TUR',
  'turret': 'TUR',
  'network camera': 'IPC',
  'ip camera': 'IPC',
  'network/ip camera': 'IPC',
  'nvr': 'NVR',
  'dvr': 'DVR',
  'poe switch': 'SWT',
  'network switch': 'SWT',
  'switch': 'SWT',
  'cable': 'CBL',
  'hard disk': 'HDD',
  'surveillance hdd': 'HDD',
  'hdd': 'HDD',
  'power supply': 'PSU',
  'adapter': 'ADP',
  'connector': 'CON',
  'junction box': 'JBX',
  'monitor': 'MON',

  // Solar Product Types
  'solar panel': 'PNL',
  'panel': 'PNL',
  'inverter': 'INV',
  'solar inverter': 'INV',
  'battery': 'BAT',
  'solar battery': 'BAT',
  'charge controller': 'CC',
  'mounting kit': 'MNT',
  'solar cable': 'CBL',
  'combiner box': 'CMB',
  'solar accessory': 'ACC',
  'accessory': 'ACC',
};

/**
 * Resolve or generate Brand Code (2-4 uppercase characters)
 */
export const resolveBrandCode = (brandName) => {
  if (!brandName || !brandName.trim()) return '';
  const clean = brandName.trim().toLowerCase();
  if (BRAND_CODES[clean]) return BRAND_CODES[clean];

  // Dynamic brand code extraction
  const words = brandName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    // Take first letter of up to 4 words
    const code = words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
    return code.replace(/[^A-Z]/g, '');
  }
  // Single word: take first 2 to 3 uppercase letters
  const single = brandName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return single.slice(0, Math.min(3, single.length));
};

/**
 * Resolve or generate Category Code (CCTV, SOL, or 3-4 letter code)
 */
export const resolveCategoryCode = (categoryName) => {
  if (!categoryName || !categoryName.trim()) return '';
  const clean = categoryName.trim().toLowerCase();
  
  if (CATEGORY_CODES[clean]) return CATEGORY_CODES[clean];
  if (clean.includes('cctv') || clean.includes('camera') || clean.includes('surveillance') || clean.includes('security')) {
    return 'CCTV';
  }
  if (clean.includes('solar') || clean.includes('renewable') || clean.includes('pv')) {
    return 'SOL';
  }

  // Fallback abbreviation
  const word = categoryName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return word.slice(0, Math.min(4, word.length));
};

/**
 * Resolve or generate Product Type Code (3 uppercase letters)
 */
export const resolveTypeCode = (typeName) => {
  if (!typeName || !typeName.trim()) return '';
  const clean = typeName.trim().toLowerCase();
  
  if (TYPE_CODES[clean]) return TYPE_CODES[clean];

  // Try matching substring keywords
  for (const [key, code] of Object.entries(TYPE_CODES)) {
    if (clean.includes(key)) return code;
  }

  // Dynamic 3-letter abbreviation
  const word = typeName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return word.slice(0, Math.min(3, word.length));
};

/**
 * Extract & Normalize Main Specification Code (e.g. 12MP, 8MP, 550W, 5KW, 200AH, 16CH, 2TB, 12V)
 */
export const extractAndNormalizeSpec = (specInput, productName = '', description = '') => {
  const textToSearch = [specInput, productName, description].filter(Boolean).join(' ');
  if (!textToSearch.trim()) return '';

  // Specific regex patterns for common specs
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(megapixels?|megapixel|mp)\b/i,          // 12 MP -> 12MP
    /(\d+(?:\.\d+)?)\s*(channels?|channel|ch)\b/i,               // 16 CH -> 16CH
    /(\d+(?:\.\d+)?)\s*(terabytes?|terabyte|tb)\b/i,             // 2 TB -> 2TB
    /(\d+(?:\.\d+)?)\s*(gigabytes?|gigabyte|gb)\b/i,             // 500 GB -> 500GB
    /(\d+(?:\.\d+)?)\s*(kilowatts?|kilowatt|kw)\b/i,             // 5 KW -> 5KW
    /(\d+(?:\.\d+)?)\s*(watts?|watt|w)\b/i,                      // 550 W -> 550W
    /(\d+(?:\.\d+)?)\s*(ampere\s*hours?|amp\s*hours?|ah)\b/i,    // 200 AH -> 200AH
    /(\d+(?:\.\d+)?)\s*(volts?|volt|v)\b/i,                      // 12 V -> 12V
    /(\d+(?:\.\d+)?)\s*(litres?|litre|l)\b/i,                    // 16 L -> 16L
    /(\d+(?:\.\d+)?)\s*(kilograms?|kg)\b/i,                      // 50 KG -> 50KG
  ];

  for (const pattern of patterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      const num = match[1];
      let unit = match[2].toUpperCase();
      if (unit.startsWith('MEGAPIXEL') || unit.startsWith('MP')) unit = 'MP';
      else if (unit.startsWith('CHANNEL') || unit.startsWith('CH')) unit = 'CH';
      else if (unit.startsWith('TERABYTE') || unit.startsWith('TB')) unit = 'TB';
      else if (unit.startsWith('GIGABYTE') || unit.startsWith('GB')) unit = 'GB';
      else if (unit.startsWith('KILOWATT') || unit.startsWith('KW')) unit = 'KW';
      else if (unit.startsWith('WATT') || unit.startsWith('W')) unit = 'W';
      else if (unit.startsWith('AMP') || unit.startsWith('AH')) unit = 'AH';
      else if (unit.startsWith('VOLT') || unit.startsWith('V')) unit = 'V';
      else if (unit.startsWith('LITRE') || unit.startsWith('L')) unit = 'L';
      else if (unit.startsWith('KG')) unit = 'KG';
      return `${num}${unit}`;
    }
  }

  // Fallback: If specInput was passed directly as a string (e.g. "12MP", "550W")
  if (specInput && specInput.trim()) {
    const cleanSpec = specInput.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
    if (cleanSpec) return cleanSpec;
  }

  return '';
};

/**
 * Generate Standardized SKU with Duplicate Sequence Protection
 */
export const generateStandardizedSku = ({
  brand = '',
  categoryName = '',
  subcategoryName = '',
  specification = '',
  productName = '',
  description = '',
  existingProducts = [],
}) => {
  const brandCode = resolveBrandCode(brand);
  if (!brandCode) {
    return { success: false, error: 'Please select a brand before generating SKU.' };
  }

  const categoryCode = resolveCategoryCode(categoryName);
  if (!categoryCode) {
    return { success: false, error: 'Please select a category before generating SKU.' };
  }

  const typeCode = resolveTypeCode(subcategoryName);
  if (!typeCode) {
    return { success: false, error: 'Please select a product type / subcategory before generating SKU.' };
  }

  const specCode = extractAndNormalizeSpec(specification, productName, description);
  if (!specCode) {
    return {
      success: false,
      error: 'Please provide the main product specification (e.g. 12MP, 550W, 200AH, 16CH) before generating SKU.',
    };
  }

  const prefix = `${brandCode}-${categoryCode}-${typeCode}-${specCode}`;

  // Find all existing SKUs with exact prefix: PREFIX-001, PREFIX-002, etc.
  const matchingSequences = [];
  const prefixPattern = new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}-(\\d{3,})$`, 'i');

  if (Array.isArray(existingProducts)) {
    existingProducts.forEach((p) => {
      const sku = (p.sku || p.SKU || '').trim();
      const match = sku.match(prefixPattern);
      if (match) {
        matchingSequences.push(parseInt(match[1], 10));
      }
    });
  }

  // Compute highest sequence (never re-use deleted numbers lower than max)
  const maxSeq = matchingSequences.length > 0 ? Math.max(...matchingSequences) : 0;
  const nextSeq = maxSeq + 1;
  const seqCode = String(nextSeq).padStart(3, '0');

  const finalSku = `${prefix}-${seqCode}`;

  return {
    success: true,
    sku: finalSku,
    prefix,
    sequence: seqCode,
    brandCode,
    categoryCode,
    typeCode,
    specCode,
  };
};
