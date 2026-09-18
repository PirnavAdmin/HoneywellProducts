import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';
import { 
  getCategories, 
  saveCategories, 
  upsertCategory, 
  getProducts, 
  saveProducts, 
  upsertProduct,
  cleanCategoryName,
  slugify,
  deleteCategoryFromStore
} from './catalogStore';

// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE_URL = getApiDomain();

// Axios instance — always skip the ngrok browser-warning page
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

// Intercept requests to inject Authorization token if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a relative image path to a full URL */
const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().includes('placeholder') || trimmed.includes('honeywell-products-logo.png')) {
    return '/honeywell-products-logo.png';
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/honeywell-products-logo.png') || trimmed.startsWith('/admin-') || trimmed.startsWith('/favicon')) {
    return trimmed;
  }

  let result = '';
  if (/^https?:\/\//i.test(trimmed)) {
    result = trimmed;
  } else if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.slice(trimmed.indexOf('/uploads/'));
    const cleanBase = (BASE_URL || '').replace(/\/$/, '');
    result = `${cleanBase}${uploadPath}`;
  } else if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('/honeywell-products-logo')
  ) {
    result = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  } else {
    const cleanBase = (BASE_URL || '').replace(/\/$/, '');
    result = !cleanBase ? (trimmed.startsWith('/') ? trimmed : `/${trimmed}`) : `${cleanBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  if (result.includes('/uploads/') || result.includes('ngrok-free.dev')) {
    const separator = result.includes('?') ? '&' : '?';
    return `${result}${separator}v=${Date.now()}`;
  }
  return result;
};

/** Extract an array from various API response shapes */
const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/** Extract a single object from an API response */
const unwrapItem = (response) => {
  const data = response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data;
  }
  return data ?? {};
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

export const mapCategoryFromApi = (raw = {}) => {
  const rawName = raw.name || raw.categoryName || '';
  const cleanName = cleanCategoryName(rawName);
  let rawSlug = raw.slug || '';
  if (!rawSlug || (rawSlug.includes('-') && rawSlug.split('-').length > 6)) {
    rawSlug = slugify(cleanName);
  } else {
    // Check if slug is repeated like "network-video-recorders-network-video-recorders"
    const parts = rawSlug.split('-');
    if (parts.length % 2 === 0 && parts.length >= 4) {
      const half = parts.length / 2;
      const first = parts.slice(0, half).join('-');
      const second = parts.slice(half).join('-');
      if (first === second) {
        rawSlug = first;
      }
    }
  }

  return {
    id: String(raw.id ?? raw.categoryId ?? ''),
    name: cleanName,
    slug: rawSlug || slugify(cleanName),
    description: raw.description || '',
    status: raw.isActive === false ? 'Inactive' : 'Active',
    displayOrder: Number(raw.displayOrder ?? raw.display_order ?? 0),
    metaTitle: raw.metaTitle || `${cleanName} | Honeywell`,
    metaDescription: raw.metaDescription || raw.description || '',
    image: resolveImageUrl(raw.imageUrl || raw.image),
    imageUrl: raw.imageUrl || '',
    subCategories: raw.subCategories || raw.subcategories || [],
    products: raw.products || [],
    code: raw.categoryCode || String(raw.id || ''),
  };
};

export const mapSubcategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? raw.subcategoryId ?? ''),
  categoryId: String(raw.categoryId ?? ''),
  name: raw.name || raw.subcategoryName || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  image: resolveImageUrl(raw.imageUrl || raw.image),
  imageUrl: raw.imageUrl || '',
  categoryName: raw.categoryName || '',
  products: raw.products || [],
});

export const mapProductFromApi = (raw = {}, categories = [], subcategories = []) => {
  const subcategoryId = String(raw.subcategoryId ?? raw.subCategoryId ?? '');
  const categoryId = String(
    raw.categoryId ??
    subcategories.find((s) => s.id === subcategoryId)?.categoryId ??
    ''
  );

  let brandName = 'Honeywell';
  if (typeof raw.brand === 'string') {
    brandName = raw.brand;
  } else if (raw.brand && typeof raw.brand === 'object') {
    brandName = raw.brand.name || raw.brand.brandName || brandName;
  }

  const stock = Number(raw.stockQuantity ?? raw.stock ?? 0);

  const reviews = (Array.isArray(raw.reviews) ? raw.reviews : []).map((r) => {
    const rNum = Number(r.rating);
    return {
      customer: r.customerName || r.customer || 'Anonymous',
      rating: String(!isNaN(rNum) && rNum >= 0 ? rNum : 0),
      date: r.dateCreated ? r.dateCreated.slice(0, 7) : new Date().toISOString().slice(0, 7),
      comment: r.comment || '',
      verified: r.verified !== false,
    };
  });

  const keyFeatures = Array.isArray(raw.features)
    ? raw.features.map((f) =>
        f.featureName && f.featureValue
          ? `${f.featureName}: ${f.featureValue}`
          : f.featureName || ''
      )
    : Array.isArray(raw.keyFeatures)
    ? raw.keyFeatures
    : [];

  const media = Array.isArray(raw.media) ? raw.media : [];

  const categoryName = raw.categoryName || raw.category?.categoryName || raw.category?.name || categories.find(c => String(c.id) === String(categoryId))?.name || 'General';
  const subcategoryName = raw.subcategoryName || raw.subcategory?.subcategoryName || raw.subcategory?.name || subcategories.find(s => String(s.id) === String(subcategoryId))?.name || 'Security Equipment';

  const resolvedName = (
    raw.productName || 
    raw.name || 
    raw.Name || 
    raw.ProductName || 
    raw.title || 
    raw.Title || 
    (subcategoryName && subcategoryName !== 'Security Equipment' ? subcategoryName : '') || 
    (categoryName && categoryName !== 'General' ? categoryName : '') || 
    `Honeywell Product #${raw.id || '1'}`
  ).trim();

  const resolvedSku = (
    raw.sku || 
    raw.SKU || 
    raw.productCode || 
    raw.code || 
    `HON-PRD-${String(raw.id || '001').padStart(3, '0')}`
  ).trim();

  return {
    id: String(raw.id ?? ''),
    name: resolvedName,
    sku: resolvedSku,
    brand: brandName,
    supplier: raw.supplier || raw.manufacturer || '',
    categoryId: categoryId || categories[0]?.id || '',
    subcategoryId: subcategoryId || subcategories[0]?.id || '',
    mrp: String(raw.basePrice ?? raw.mrp ?? raw.price ?? ''),
    price: String(raw.price ?? ''),
    discountType: raw.discountType || 'none',
    discountValue: String(raw.discountValue ?? ''),
    stock: String(stock),
    status: raw.isActive === false ? 'Out of Stock' : stock > 0 ? 'In Stock' : 'Out of Stock',
    countryOfOrigin: raw.countryOfOrigin || 'India',
    codAvailable: raw.codAvailable || 'Yes',
    deliveryEstimate: raw.deliveryEstimate || '3-7 business days',
    returnPolicy: raw.returnPolicy || 'Easy Returns',
    shortDescription: raw.shortDescription || raw.shortDesc || raw.description || '',
    description: raw.description || '',
    productDetails: raw.productDetails || raw.longDesc || raw.description || '',
    packageIncludes: raw.packageIncludes || '',
    specifications: {
      weight: raw.weight || raw.specifications?.weight || '',
      dimensions: raw.dimensions || raw.specifications?.dimensions || '',
      powerSource: raw.powerSource || raw.specifications?.powerSource || '',
      material: raw.material || raw.specifications?.material || '',
      coverage: raw.coverageUsage || raw.specifications?.coverage || '',
    },
    keyFeatures,
    rating: reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / reviews.length).toFixed(1)
      : (Number(raw.totalReviews ?? raw.reviewCount ?? 0) > 0 && Number(raw.rating ?? raw.averageRating ?? 0) > 0
          ? Number(raw.rating ?? raw.averageRating).toFixed(1)
          : '0'),
    totalReviews: String(reviews.length > 0 ? reviews.length : (Number(raw.totalReviews) > 0 ? Number(raw.totalReviews) : 0)),
    ratingBreakdown: raw.ratingBreakdown ?? { 5: '', 4: '', 3: '', 2: '', 1: '' },
    reviews,
    image: resolveImageUrl(raw.imageUrl || media[0]?.mediaUrl || ''),
    imageUrl: raw.imageUrl || media[0]?.mediaUrl || '',
  };
};

// ─── Category API ─────────────────────────────────────────────────────────────

export const fetchCategories = async () => {
  try {
    const response = await api.get('/api/Category');
    const apiCategories = unwrapList(response).map(mapCategoryFromApi);
    return apiCategories;
  } catch (err) {
    console.error('API error fetching categories:', err.message);
    throw new Error('Unable to connect to backend server or fetch categories.');
  }
};

export const fetchCategory = async (id) => {
  try {
    const response = await api.get(`/api/Category/${id}`);
    const item = unwrapItem(response);
    return mapCategoryFromApi(item);
  } catch (err) {
    console.warn(`GET /api/Category/${id} unavailable (${err.message}), falling back to category list search.`);
    const categories = await fetchCategories();
    const found = categories.find((c) => String(c.id) === String(id));
    if (found) return found;
    return mapCategoryFromApi({ id });
  }
};

export const saveCategory = async (category) => {
  const isEditing = Boolean(category.id);
  const cleanName = cleanCategoryName(category.name);
  const cleanSlug = category.slug ? slugify(category.slug) : slugify(cleanName);

  const fd = new FormData();
  if (isEditing) {
    fd.append('Id', String(category.id));
  }
  fd.append('Name', cleanName);
  fd.append('Description', category.description || '');
  fd.append('Slug', cleanSlug);
  fd.append('DisplayOrder', category.displayOrder !== undefined && category.displayOrder !== null && category.displayOrder !== '' ? String(category.displayOrder) : '0');
  fd.append('IsActive', category.status === 'Active' ? 'true' : 'false');
  fd.append('MetaTitle', category.metaTitle || `${cleanName} | Honeywell`);
  fd.append('MetaDescription', category.metaDescription || category.description || '');

  if (category.imageFile) {
    fd.append('ImageFile', category.imageFile);
  } else if (category.imageUrl || category.image) {
    fd.append('ImageUrl', category.imageUrl || category.image || '');
  }

  const categoryImage = category.image || category.imageUrl || '';

  try {
    const response = await api({
      method: isEditing ? 'PUT' : 'POST',
      url: isEditing ? `/api/Category/${category.id}` : '/api/Category',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const saved = unwrapItem(response);
    const mapped = mapCategoryFromApi(saved);
    if (!mapped.image && categoryImage) {
      mapped.image = categoryImage;
      mapped.imageUrl = categoryImage;
    }
    upsertCategory(mapped);
    return mapped;
  } catch (err) {
    console.warn('FormData category request failed, attempting JSON payload fallback:', err.message);
  }

  // Standard JSON payload fallback
  const payload = {
    id: isEditing ? Number(category.id) || category.id : undefined,
    name: cleanName,
    description: category.description || '',
    slug: cleanSlug,
    displayOrder: Number(category.displayOrder || 0),
    isActive: category.status === 'Active',
    metaTitle: category.metaTitle || `${cleanName} | Honeywell`,
    metaDescription: category.metaDescription || category.description || '',
    imageUrl: categoryImage,
    image: categoryImage,
  };

  try {
    const response = await api({
      method: isEditing ? 'PUT' : 'POST',
      url: isEditing ? `/api/Category/${category.id}` : '/api/Category',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });

    const saved = unwrapItem(response);
    const mapped = mapCategoryFromApi(saved);
    if (!mapped.image && categoryImage) {
      mapped.image = categoryImage;
      mapped.imageUrl = categoryImage;
    }
    upsertCategory(mapped);
    return mapped;
  } catch (err) {
    console.error('Backend API unavailable to save category:', err.message);
    throw new Error('Unable to save category. Backend server is unreachable.');
  }
};

export const deleteCategory = async (id) => {
  try {
    await api.delete(`/api/Category/${id}`);
  } catch (err) {
    console.warn(`DELETE /api/Category/${id} failed:`, err.message);
  }
  deleteCategoryFromStore(id);
};

// ─── Subcategory API ──────────────────────────────────────────────────────────
import { 
  fetchSubcategories as fetchSubcategoriesApi,
  fetchSubcategoryById as fetchSubcategoryApi,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory as deleteSubcategoryApi,
} from './subcategoriesApi';

export const fetchSubcategories = async () => {
  return await fetchSubcategoriesApi();
};

export const fetchSubcategory = async (id) => {
  return await fetchSubcategoryApi(id);
};

export const saveSubcategory = async (subcategory) => {
  if (subcategory.id) {
    return await updateSubcategory(subcategory.id, subcategory);
  }
  return await createSubcategory(subcategory);
};

export const deleteSubcategory = async (id) => {
  return await deleteSubcategoryApi(id);
};

// ─── Products API ─────────────────────────────────────────────────────────────

export const fetchProducts = async (categories = [], subcategories = []) => {
  try {
    const response = await api.get('/api/products');
    const list = unwrapList(response).map((p) => mapProductFromApi(p, categories, subcategories));
    return list;
  } catch {
    const response = await api.get('/api/Products');
    const list = unwrapList(response).map((p) => mapProductFromApi(p, categories, subcategories));
    return list;
  }
};

export const fetchProduct = async (id, categories = [], subcategories = []) => {
  try {
    const response = await api.get(`/api/products/${id}`);
    return mapProductFromApi(unwrapItem(response), categories, subcategories);
  } catch {
    const response = await api.get(`/api/Products/${id}`);
    return mapProductFromApi(unwrapItem(response), categories, subcategories);
  }
};

export const saveProduct = async (product, imageFiles = [], videoFile = null) => {
  const isEditing = Boolean(product.id);

  const fd = new FormData();
  fd.append('SubcategoryId', Number(product.subcategoryId) || 0);
  fd.append('Name', product.name || '');
  fd.append('Sku', product.sku || '');
  fd.append('Brand', product.brand || 'Honeywell');
  fd.append('Supplier', product.supplier || '');
  fd.append('Description', product.shortDescription || product.description || '');
  fd.append('ProductDetails', product.productDetails || '');
  fd.append('PackageIncludes', product.packageIncludes || '');
  fd.append('Price', Number(product.price) || 0);
  fd.append('BasePrice', Number(product.mrp) || Number(product.price) || 0);
  fd.append('DiscountType', product.discountType || 'none');
  fd.append('DiscountValue', Number(product.discountValue) || 0);
  fd.append('StockQuantity', Number(product.stock) || 0);
  fd.append('Status', product.status || 'In Stock');
  fd.append('CountryOfOrigin', product.countryOfOrigin || 'India');
  fd.append('CodAvailable', product.codAvailable || 'Yes');
  fd.append('DeliveryEstimate', product.deliveryEstimate || '3-7 business days');
  fd.append('ReturnPolicy', product.returnPolicy || 'Easy Returns');
  fd.append('Rating', Number(product.rating) || 0);
  fd.append('TotalReviews', Number(product.totalReviews) || 0);

  // Specifications
  fd.append('Weight', product.specifications?.weight || '');
  fd.append('Dimensions', product.specifications?.dimensions || '');
  fd.append('PowerSource', product.specifications?.powerSource || '');
  fd.append('Material', product.specifications?.material || '');
  fd.append('CoverageUsage', product.specifications?.coverage || '');

  // Key features
  if (Array.isArray(product.keyFeatures)) {
    product.keyFeatures
      .filter((f) => f && f.trim())
      .forEach((feature, idx) => {
        let name = feature.trim();
        let val = '';
        if (feature.includes(':')) {
          const parts = feature.split(':');
          name = parts[0].trim();
          val = parts.slice(1).join(':').trim();
        }
        fd.append(`Features[${idx}].FeatureName`, name);
        fd.append(`Features[${idx}].FeatureValue`, val);
      });
  }

  // Images
  if (Array.isArray(imageFiles) && imageFiles.length > 0) {
    imageFiles.forEach((file) => fd.append('ImageFiles', file));
  } else if (product.imageUrl) {
    fd.append('ImageUrl', product.imageUrl);
  }

  // Video
  if (videoFile) {
    fd.append('VideoFile', videoFile);
  }

  const response = await api({
    method: isEditing ? 'PUT' : 'POST',
    url: isEditing ? `/api/products/${product.id}` : '/api/products',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const saved = mapProductFromApi(unwrapItem(response));
  return { ...saved, id: saved.id || product.id || '' };
};

export const deleteProduct = async (id) => {
  await api.delete(`/api/products/${id}`);
};
