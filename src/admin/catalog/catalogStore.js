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
  'PRD-001', 'PRD-002', 'PRD-003', 'PRD-004'
]);

const isStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

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

const writeList = (key, list) => {
  if (!isStorageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(list));
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

export const getCategories = () =>
  readList(CATALOG_KEYS.categories, [])
    .filter((c) => !MOCK_IDS.has(c.id))
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

export const getSubcategories = () =>
  readList(CATALOG_KEYS.subcategories, [])
    .filter((s) => !MOCK_IDS.has(s.id))
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

export const getProducts = () =>
  readList(CATALOG_KEYS.products, [])
    .filter((p) => !MOCK_IDS.has(p.id));


export const saveCategories = (categories) => writeList(CATALOG_KEYS.categories, categories);
export const saveSubcategories = (subcategories) => writeList(CATALOG_KEYS.subcategories, subcategories);
export const saveProducts = (products) => writeList(CATALOG_KEYS.products, products);

export const deleteCategoryFromStore = (id) => {
  const categories = getCategories().filter((c) => String(c.id) !== String(id));
  saveCategories(categories);
};

export const deleteProductFromStore = (id) => {
  const products = getProducts().filter((p) => String(p.id) !== String(id));
  saveProducts(products);
};

export const upsertCategory = (category) => {
  const categories = getCategories();
  const cleanName = cleanCategoryName(category.name);
  const cleanSlug = category.slug ? slugify(category.slug) : slugify(cleanName);

  const prepared = {
    ...category,
    name: cleanName,
    id: category.id || nextId('CAT', categories),
    slug: cleanSlug,
    displayOrder: Number(category.displayOrder) || categories.length + 1,
  };

  const exists = categories.some((item) => String(item.id) === String(prepared.id));
  const updated = exists
    ? categories.map((item) => (String(item.id) === String(prepared.id) ? prepared : item))
    : [...categories, prepared];

  saveCategories(updated);
  return prepared;
};

export const upsertSubcategory = (subcategory) => {
  const subcategories = getSubcategories();
  const prepared = {
    ...subcategory,
    id: subcategory.id || nextId('SUB', subcategories),
    slug: subcategory.slug || slugify(subcategory.name),
    displayOrder: Number(subcategory.displayOrder) || subcategories.length + 1,
  };

  const exists = subcategories.some((item) => item.id === prepared.id);
  const updated = exists
    ? subcategories.map((item) => (item.id === prepared.id ? prepared : item))
    : [...subcategories, prepared];

  saveSubcategories(updated);
  return prepared;
};

export const upsertProduct = (product) => {
  const products = getProducts();
  const prepared = {
    ...product,
    id: product.id || nextId('PRD', products),
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || Number(product.price) || 0,
    discountValue: Number(product.discountValue) || 0,
    stock: Number(product.stock) || 0,
    rating: Number(product.rating) || 0,
    totalReviews: Number(product.totalReviews) || 0,
    ratingBreakdown: product.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    specifications: product.specifications || {},
  };

  const exists = products.some((item) => item.id === prepared.id);
  const updated = exists
    ? products.map((item) => (item.id === prepared.id ? prepared : item))
    : [...products, prepared];

  saveProducts(updated);
  return prepared;
};

export const getCategoryName = (categories, categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || 'Unassigned';

export const getSubcategoryName = (subcategories, subcategoryId) =>
  subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name || 'Unassigned';

