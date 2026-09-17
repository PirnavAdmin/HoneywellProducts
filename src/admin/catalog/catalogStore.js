const CATALOG_KEYS = {
  categories: 'sat_catalog_categories',
  subcategories: 'sat_catalog_subcategories',
  products: 'sat_catalog_products',
};

export const defaultCategories = [];
export const defaultSubcategories = [];
export const defaultProducts = [];

const MOCK_IDS = new Set([
  'CAT-001', 'CAT-002', 'CAT-003', 'CAT-004', 'CAT-005',
  'SUB-001', 'SUB-002', 'SUB-003', 'SUB-004', 'SUB-005', 'SUB-006',
  'PRD-001', 'PRD-002', 'PRD-003', 'PRD-004',
  '1', '2', '3', '5', '6', '7'
]);

const readList = (key, fallback) => {
  if (!isStorageAvailable()) return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

/**
 * Strip large base64-encoded image strings from a product before persisting
 * so we don't blow the ~5 MB localStorage quota.
 */
const stripHeavyFields = (product) => {
  const stripped = { ...product };
  // Remove base64 image data (data:image/... strings) — they are re-fetched from API
  if (typeof stripped.image === 'string' && stripped.image.startsWith('data:')) {
    stripped.image = '';
  }
  if (Array.isArray(stripped.images)) {
    stripped.images = stripped.images.map((img) =>
      typeof img === 'string' && img.startsWith('data:') ? '' : img
    );
  }
  return stripped;
};

const writeList = (key, list) => {
  if (!isStorageAvailable()) return;
  try {
    // For the products key, strip heavy fields first to avoid quota errors
    const toStore =
      key === CATALOG_KEYS.products
        ? list.map(stripHeavyFields)
        : list;
    window.localStorage.setItem(key, JSON.stringify(toStore));
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      console.warn(
        `[catalogStore] localStorage quota exceeded for key "${key}". ` +
        'Some product data may not be persisted locally — it will still be saved via the API.'
      );
    } else {
      console.error(`[catalogStore] Failed to write "${key}" to localStorage:`, err);
    }
  }
};

const nextId = (prefix, items) => {
  const nextNumber =
    items.reduce((largest, item) => {
      const numericPart = Number(String(item.id || '').replace(`${prefix}-`, ''));
      return Number.isFinite(numericPart) ? Math.max(largest, numericPart) : largest;
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
};

export const cleanCategoryName = (name) => {
  if (!name || typeof name !== 'string') return '';
  let trimmed = name.trim();
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && parts.every((p) => p.toLowerCase() === parts[0].toLowerCase())) {
      trimmed = parts[0];
    }
  }
  return trimmed;
};

export const slugify = (value) => {
  const clean = cleanCategoryName(value);
  return clean
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getCategories = () => [];
export const getSubcategories = () => [];
export const getProducts = () => [];

export const saveCategories = () => {};
export const saveSubcategories = () => {};
export const saveProducts = () => {};

export const deleteCategoryFromStore = () => {};
export const deleteProductFromStore = () => {};

export const upsertCategory = (category) => {
  const cleanName = cleanCategoryName(category?.name || '');
  const cleanSlug = category?.slug ? slugify(category.slug) : slugify(cleanName);
  return {
    ...category,
    name: cleanName,
    slug: cleanSlug,
  };
};

export const upsertSubcategory = (subcategory) => {
  return {
    ...subcategory,
    slug: subcategory?.slug || slugify(subcategory?.name || ''),
  };
};

export const upsertProduct = (product) => {
  return product;
};

export const getCategoryName = (categories, categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || 'Unassigned';

export const getSubcategoryName = (subcategories, subcategoryId) =>
  subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name || 'Unassigned';


