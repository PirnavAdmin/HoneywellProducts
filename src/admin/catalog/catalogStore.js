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

const readList = (key, fallback) => fallback;

const writeList = () => {};

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


