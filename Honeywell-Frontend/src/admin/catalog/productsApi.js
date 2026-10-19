import axios from 'axios';
import { getApiDomain, resolveMediaUrl } from '../../utils/apiConfig';
import { getProducts, getCategories, upsertProduct, saveProducts, deleteProductFromStore, defaultProducts, getCategoryMetadataOverrides, getSubcategoryMetadataOverrides } from './catalogStore';
import { apiCache } from '../../utils/apiCache';


// ─── Base URL ────────────────────────────────────────────────────────────────
export const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // Increased to 5 minutes for large media uploads
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

// Intercept requests to inject Auth token and bust browser caching on GET requests
api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
});

// ─── Stock Status Calculator ──────────────────────────────────────────────────
export const computeStockStatus = (stockVal, reorderVal) => {
  const stock = Number(stockVal || 0);
  const reorder = reorderVal !== undefined && reorderVal !== null && !isNaN(Number(reorderVal))
    ? Number(reorderVal)
    : 10;
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorder) return 'Low Stock';
  return 'In Stock';
};

// ─── Local Reorder Levels Store ───────────────────────────────────────────────
const REORDER_STORE_KEY = 'sat_product_reorder_levels';

export const getStoredReorderLevels = () => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(REORDER_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setStoredReorderLevel = (productId, reorderLevel) => {
  if (!productId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getStoredReorderLevels();
    current[String(productId)] = Number(reorderLevel);
    window.localStorage.setItem(REORDER_STORE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to persist reorder level locally:', err);
  }
};

// ─── Local Cost Prices Store ──────────────────────────────────────────────────
const COST_PRICE_STORE_KEY = 'sat_product_cost_prices';

export const getStoredCostPrices = () => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(COST_PRICE_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setStoredCostPrice = (productId, costPrice) => {
  if (!productId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getStoredCostPrices();
    current[String(productId)] = Number(costPrice);
    window.localStorage.setItem(COST_PRICE_STORE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to persist cost price locally:', err);
  }
};

/** Resolve a relative image path to a full URL */
export const resolveImageUrl = (url) => {
  return resolveMediaUrl(url);
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

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Map a raw category object from the API to our frontend shape */
export const mapCategoryFromApi = (raw = {}) => {
  const catId = String(raw.id ?? '');
  const overrides = getCategoryMetadataOverrides();
  const override = catId ? overrides[catId] : null;

  let isInactive;
  if (override && (override.status !== undefined || override.isActive !== undefined)) {
    isInactive = override.status === 'Inactive' || override.isActive === false;
  } else {
    isInactive = raw.isActive === false || raw.status === 'Inactive' || raw.Status === 'Inactive';
  }

  let displayOrder;
  if (override && override.displayOrder !== undefined && override.displayOrder !== null && !isNaN(Number(override.displayOrder))) {
    displayOrder = Number(override.displayOrder);
  } else {
    displayOrder = Number(raw.displayOrder ?? raw.DisplayOrder ?? raw.display_order ?? 0);
  }

  return {
    id: catId,
    name: raw.categoryName || raw.name || '',
    slug: raw.slug || '',
    description: raw.description || '',
    status: isInactive ? 'Inactive' : 'Active',
    isActive: !isInactive,
    displayOrder: displayOrder,
    metaTitle: raw.metaTitle || `${raw.categoryName || raw.name || ''} | Honeywell`,
    metaDescription: raw.metaDescription || raw.description || '',
    image: resolveImageUrl(raw.imageUrl || raw.image || ''),
    imageUrl: raw.imageUrl || '',
    subCategories: raw.subCategories || raw.subcategories || [],
    products: raw.products || [],
    code: raw.categoryCode || String(raw.id || ''),
  };
};

/** Map a raw subcategory object from the API to our frontend shape */
export const mapSubcategoryFromApi = (raw = {}) => {
  const subId = String(raw.id ?? raw.subcategoryId ?? raw.SubcategoryId ?? raw.Id ?? '');
  const overrides = getSubcategoryMetadataOverrides();
  const override = subId ? overrides[subId] : null;

  let isInactive;
  if (override && (override.status !== undefined || override.isActive !== undefined)) {
    isInactive = override.status === 'Inactive' || override.isActive === false;
  } else {
    const rawIsActive = raw.isActive ?? raw.IsActive;
    const rawStatus = raw.status ?? raw.Status;
    isInactive =
      rawIsActive === false ||
      rawStatus === 'Inactive' ||
      rawStatus === false;
  }

  let displayOrder;
  if (override && override.displayOrder !== undefined && override.displayOrder !== null && !isNaN(Number(override.displayOrder))) {
    displayOrder = Number(override.displayOrder);
  } else {
    const rawOrder = raw.displayOrder ?? raw.DisplayOrder ?? raw.display_order;
    displayOrder = rawOrder !== undefined && rawOrder !== null && rawOrder !== '' && !isNaN(Number(rawOrder))
      ? Number(rawOrder)
      : 0;
  }

  return {
    id: subId,
    categoryId: String(raw.categoryId ?? raw.CategoryId ?? ''),
    name: raw.subcategoryName || raw.name || raw.Name || '',
    slug: raw.slug || raw.Slug || '',
    description: raw.description || raw.Description || '',
    status: isInactive ? 'Inactive' : 'Active',
    isActive: !isInactive,
    displayOrder: displayOrder,
    image: resolveImageUrl(raw.imageUrl || raw.image || ''),
    imageUrl: raw.imageUrl || '',
    categoryName: raw.categoryName || raw.category?.categoryName || '',
    products: raw.products || [],
  };
};

/**
 * Map a raw product object from the API to the frontend shape expected by
 * ProductsForm and ProductsList.
 *
 * @param {object} raw           - Raw product from API
 * @param {Array}  categories    - Loaded category list (for fallback resolution)
 * @param {Array}  subcategories - Loaded subcategory list (for fallback resolution)
 * @param {Array}  features      - Optional array from GET /api/features/{id}
 * @param {Array}  reviews       - Optional array from GET /api/reviews/{id}
 */
export const mapProductFromApi = (
  raw = {},
  categories = [],
  subcategories = [],
  features = [],
  reviews = []
) => {
  // ── IDs ──────────────────────────────────────────────────────────────────
  const subcategoryId = String(raw.subcategoryId ?? '');
  const categoryId = String(
    raw.categoryId ??
      raw.category?.id ??
      subcategories.find((s) => s.id === subcategoryId)?.categoryId ??
      ''
  );

  // ── Brand Resolution ──────────────────────────────────────────────────────
  const resolveBrandName = (item) => {
    const rawBrand = (item.brand || item.Brand || item.brandName || item.manufacturer || item.Manufacturer || item.supplier || item.SupplierName || '').toString().trim();
    if (rawBrand) return rawBrand;
    return 'Honeywell';
  };

  // ── Weight Resolution ──────────────────────────────────────────────────────
  const resolveWeight = (item) => {
    const existing = (item.weight || item.Weight || item.specifications?.weight || '').toString().trim();
    if (existing && existing !== 'N/A' && existing !== 'null') {
      return existing;
    }
    return '';
  };

  const brandName = resolveBrandName(raw);
  const resolvedWeight = resolveWeight(raw);
  const stock = Number(raw.stock ?? raw.stockQuantity ?? 0);
  // Priority: separately fetched features → embedded raw.features → raw.keyFeatures
  const keyFeatures =
    Array.isArray(features) && features.length > 0
      ? features.map((f) => f.feature || f.featureName || '')
      : Array.isArray(raw.features) && raw.features !== null
      ? raw.features.map((f) => f.feature || f.featureName || '')
      : Array.isArray(raw.keyFeatures)
      ? raw.keyFeatures
      : [];

  // ── Reviews ───────────────────────────────────────────────────────────────
  // Priority: separately fetched reviews → embedded raw.reviews
  const rawReviews =
    Array.isArray(reviews) && reviews.length > 0
      ? reviews
      : Array.isArray(raw.reviews) && raw.reviews !== null
      ? raw.reviews
      : [];

  const mappedReviews = rawReviews.map((r) => {
    const custName = r.customerName || r.customer || r.name || r.author || 'Anonymous';
    const revComment = r.reviewComment || r.comment || r.message || r.text || '';
    const revDate = r.reviewDate || r.date || r.dateCreated || r.createdAt || new Date().toISOString();
    const parsedRating = Number(r.rating);
    const numRating = !isNaN(parsedRating) && parsedRating >= 0 ? parsedRating : 0;
    const isVerified = (r.verifiedPurchase ?? r.verified) !== false;
    return {
      id: String(r.id ?? ''),
      customer: custName,
      customerName: custName,
      rating: numRating,
      ratingStr: String(numRating),
      date: revDate,
      reviewDate: revDate,
      comment: revComment,
      reviewComment: revComment,
      verified: isVerified,
      verifiedPurchase: isVerified,
    };
  });

  // ── Images ────────────────────────────────────────────────────────────────
  const rawImages = raw.images || raw.media || [];
  const images = Array.isArray(rawImages)
    ? rawImages.map((img) => {
        if (!img) return '';
        if (typeof img === 'string') return resolveImageUrl(img);
        return resolveImageUrl(
          img.imageUrl ||
          img.ImageUrl ||
          img.url ||
          img.Url ||
          img.image ||
          img.Image ||
          img.mediaUrl ||
          img.MediaUrl ||
          ''
        );
      }).filter(Boolean)
    : [];
  const mainImageUrl = images[0] || resolveImageUrl(raw.imageUrl || '');

  // ── Videos ────────────────────────────────────────────────────────────────
  const videos = Array.isArray(raw.videos)
    ? raw.videos.map((vid) => resolveImageUrl(vid.videoUrl || vid.url || ''))
    : [];
  const mainVideoUrl = videos[0] || resolveImageUrl(raw.videoUrl || '');

  // ── Gallery & Media ───────────────────────────────────────────────────────
  const gallery = images.length > 0 ? images : [mainImageUrl].filter(Boolean);

  // ── Price formatting ──────────────────────────────────────────────────────
  const numericPrice = Number(raw.sellingPrice ?? raw.price ?? raw.mrp ?? raw.MRP ?? 0);
  const numericMrp = Number(raw.mrp ?? raw.MRP ?? raw.Mrp ?? numericPrice);
  const priceLabel = `₹${numericPrice.toLocaleString('en-IN')}`;
  const priceNote = numericMrp > numericPrice ? `MRP ₹${numericMrp.toLocaleString('en-IN')}` : '';

  // ── Specifications Resolution (Array / Object / String / DTO fields) ──────
  let rawSpecs = raw.specifications ?? raw.specificationsObj ?? raw.Specifications ?? {};
  if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
    try {
      rawSpecs = JSON.parse(rawSpecs);
    } catch {
      rawSpecs = [rawSpecs];
    }
  }

  const specsObj = {};
  const specsList = [];

  if (Array.isArray(rawSpecs)) {
    rawSpecs.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        specsList.push(item.trim());
        const colonIdx = item.indexOf(':');
        if (colonIdx > 0) {
          const k = item.slice(0, colonIdx).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const v = item.slice(colonIdx + 1).trim();
          if (k) specsObj[k] = v;
        }
      }
    });
  } else if (rawSpecs && typeof rawSpecs === 'object') {
    Object.entries(rawSpecs).forEach(([key, val]) => {
      if (val !== undefined && val !== null && String(val).trim()) {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        specsList.push(`${formattedKey}: ${val}`);
        specsObj[key] = String(val);
      }
    });
  }

  // Fallback: Check direct DTO properties if not already present
  const weight = resolvedWeight || raw.weight || raw.Weight || '';
  const dimensions = raw.dimensions || raw.Dimensions || '';
  const powerSource = raw.powerSource || raw.PowerSource || '';
  const material = raw.material || raw.Material || '';
  const coverage = raw.coverageUsage || raw.CoverageUsage || raw.coverage || raw.Coverage || '';

  if (weight && !specsList.some((s) => s.toLowerCase().startsWith('weight'))) {
    specsList.push(`Weight: ${weight}`);
  }
  if (dimensions && !specsList.some((s) => s.toLowerCase().startsWith('dimensions'))) {
    specsList.push(`Dimensions: ${dimensions}`);
  }
  if (powerSource && !specsList.some((s) => s.toLowerCase().startsWith('power source'))) {
    specsList.push(`Power Source: ${powerSource}`);
  }
  if (material && !specsList.some((s) => s.toLowerCase().startsWith('material'))) {
    specsList.push(`Material: ${material}`);
  }
  if (coverage && !specsList.some((s) => s.toLowerCase().startsWith('coverage'))) {
    specsList.push(`Coverage / Usage: ${coverage}`);
  }

  if (weight) specsObj.weight = weight;
  if (dimensions) specsObj.dimensions = dimensions;
  if (powerSource) specsObj.powerSource = powerSource;
  if (material) specsObj.material = material;
  if (coverage) specsObj.coverage = coverage;

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

  const defaultHighlights = keyFeatures.length > 0 ? keyFeatures : [
    raw.shortDescription || raw.description || 'High performance professional surveillance product',
    `Brand: ${brandName}`,
    `Model SKU: ${resolvedSku || brandName}`
  ];

  return {
    id: String(raw.id ?? ''),
    slug: raw.slug || String(raw.id ?? ''),
    name: resolvedName,
    sku: resolvedSku,
    brand: brandName,
    supplier: raw.manufacturer || raw.supplier || '',
    categoryId: categoryId || (categories[0]?.id ?? ''),
    subcategoryId: subcategoryId || (subcategories[0]?.id ?? ''),
    category: categoryName,
    productType: subcategoryName,
    model: resolvedSku || brandName || 'GEN-PRO',

    // Pricing
    mrp: String(numericMrp),
    price: numericPrice,
    priceLabel,
    priceNote,
    discountType: (() => {
      const dt = (raw.discountType || '').toLowerCase();
      if (dt === 'percentage' || dt === 'percent') return 'percentage';
      if (dt === 'flat' || dt === 'fixed') return 'fixed';
      return 'none';
    })(),
    discountValue: String(raw.discountAmount ?? raw.discountValue ?? ''),

    // Inventory
    stock: String(stock),
    availability: stock > 0 ? 'In Stock' : 'Out of Stock',
    reorderLevel: (() => {
      const prodIdStr = String(raw.id ?? '');
      const localReorders = getStoredReorderLevels();
      if (localReorders[prodIdStr] !== undefined && localReorders[prodIdStr] !== null && !isNaN(Number(localReorders[prodIdStr]))) {
        return Number(localReorders[prodIdStr]);
      }
      if (raw.reorderLevel !== undefined && raw.reorderLevel !== null && !isNaN(Number(raw.reorderLevel))) {
        return Number(raw.reorderLevel);
      }
      if (raw.ReorderLevel !== undefined && raw.ReorderLevel !== null && !isNaN(Number(raw.ReorderLevel))) {
        return Number(raw.ReorderLevel);
      }
      return 10;
    })(),
    status: (() => {
      const prodIdStr = String(raw.id ?? '');
      const localReorders = getStoredReorderLevels();
      const resolvedReorder = (localReorders[prodIdStr] !== undefined && localReorders[prodIdStr] !== null && !isNaN(Number(localReorders[prodIdStr])))
        ? Number(localReorders[prodIdStr])
        : (raw.reorderLevel !== undefined && raw.reorderLevel !== null && !isNaN(Number(raw.reorderLevel))
          ? Number(raw.reorderLevel)
          : (raw.ReorderLevel !== undefined && raw.ReorderLevel !== null && !isNaN(Number(raw.ReorderLevel)) ? Number(raw.ReorderLevel) : 10));
      return computeStockStatus(stock, resolvedReorder);
    })(),
    costPrice: (() => {
      const prodIdStr = String(raw.id ?? '');
      const localCosts = getStoredCostPrices();
      if (localCosts[prodIdStr] !== undefined && localCosts[prodIdStr] !== null && !isNaN(Number(localCosts[prodIdStr]))) {
        return Number(localCosts[prodIdStr]);
      }
      return raw.costPrice !== undefined ? Number(raw.costPrice) : (raw.CostPrice !== undefined ? Number(raw.CostPrice) : (raw.sellingPrice ? Number(raw.sellingPrice) * 0.7 : (raw.mrp ? Number(raw.mrp) * 0.7 : 0)));
    })(),

    // Delivery
    countryOfOrigin: raw.countryOfOrigin || 'India',
    codAvailable: raw.codAvailability === true || raw.codAvailable === 'Yes' ? 'Yes' : 'No',
    deliveryEstimate: raw.estimatedDelivery || raw.deliveryEstimate || '3-7 business days',
    returnPolicy: raw.deliveryReturn || raw.returnPolicy || 'Easy Returns',

    // Content
    shortDescription: raw.shortDescription || raw.shortDesc || '',
    description: raw.description || raw.shortDescription || '',
    productDetails: raw.productDetails || raw.longDesc || '',
    packageIncludes: raw.packageIncludes || '',

    // Specifications & Highlights
    specifications: specsList,
    specificationsObj: specsObj,
    highlights: defaultHighlights,
    keyFeatures: defaultHighlights,
    downloads: Array.isArray(raw.downloads) && raw.downloads.length > 0 ? raw.downloads : ['Product Specification Datasheet (PDF)', 'User Installation Manual (PDF)'],
    faq: Array.isArray(raw.faq) && raw.faq.length > 0 ? raw.faq : [
      { question: 'What is the warranty coverage for this model?', answer: 'This product includes a standard 1-year manufacturer hardware warranty with technical support.' },
      { question: 'Is professional installation supported?', answer: 'Yes, full installation guidance and regional technician support are available.' }
    ],

    // Features & Reviews
    rating: (() => {
      if (mappedReviews.length > 0) {
        const sum = mappedReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
        return (sum / mappedReviews.length).toFixed(1);
      }
      const revCount = Number(raw.totalReviews ?? raw.reviewCount ?? 0);
      if (revCount > 0) {
        const rawNum = Number(raw.averageRating ?? raw.rating);
        return !isNaN(rawNum) && rawNum > 0 ? rawNum.toFixed(1) : '0';
      }
      return '0';
    })(),
    reviewCount: mappedReviews.length > 0
      ? mappedReviews.length
      : (Number(raw.totalReviews) > 0 ? Number(raw.totalReviews) : 0),
    totalReviews: String(
      mappedReviews.length > 0
        ? mappedReviews.length
        : (Number(raw.totalReviews) > 0 ? Number(raw.totalReviews) : 0)
    ),
    ratingBreakdown: raw.ratingBreakdown ?? { 5: '80%', 4: '15%', 3: '5%', 2: '0%', 1: '0%' },
    reviews: mappedReviews,

    // Media
    image: mainImageUrl,
    imageUrl: raw.images?.[0]?.imageUrl || raw.imageUrl || '',
    images,
    gallery,
    video: mainVideoUrl,
    videoUrl: raw.videos?.[0]?.videoUrl || raw.videoUrl || '',
    videos,
    posterUrl: resolveImageUrl(raw.posterUrl || raw.posterImage || raw.poster || raw.PosterUrl || raw.PosterImage || ''),
  };
};

// ─── Categories ───────────────────────────────────────────────────────────────
// GET /api/Category

export const fetchCategories = async (forceRefresh = false) => {
  if (forceRefresh) {
    apiCache.clear();
  }
  return await apiCache.fetchWithCache('categories_all', async () => {
    const response = await api.get('/api/Category');
    const cats = unwrapList(response).map(mapCategoryFromApi);
    return cats.sort((a, b) => {
      const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
      const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
      const hasA = !isNaN(orderA) && orderA > 0;
      const hasB = !isNaN(orderB) && orderB > 0;

      if (hasA && hasB) {
        if (orderA !== orderB) return orderA - orderB;
      } else if (hasA) {
        return -1;
      } else if (hasB) {
        return 1;
      }
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, forceRefresh ? 0 : 60 * 1000);
};

// ─── Subcategories ────────────────────────────────────────────────────────────
// GET /api/Subcategory

export const fetchSubcategories = async (forceRefresh = false) => {
  if (forceRefresh) {
    apiCache.invalidate('subcategories_all');
  }
  return await apiCache.fetchWithCache('subcategories_all', async () => {
    const response = await api.get('/api/Subcategory');
    const subs = unwrapList(response).map(mapSubcategoryFromApi);
    return subs.sort((a, b) => {
      const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
      const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
      const hasA = !isNaN(orderA) && orderA > 0;
      const hasB = !isNaN(orderB) && orderB > 0;

      if (hasA && hasB) {
        if (orderA !== orderB) return orderA - orderB;
      } else if (hasA) {
        return -1;
      } else if (hasB) {
        return 1;
      }
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, forceRefresh ? 0 : 60 * 1000);
};


// ─── Product Features ─────────────────────────────────────────────────────────
// POST /api/features
// GET  /api/features/{productId}
// DELETE /api/features/{id}

export const fetchProductFeatures = async (productId) => {
  const response = await api.get(`/api/features/${productId}`);
  return unwrapList(response);
};

export const createProductFeature = async (productId, featureText) => {
  const response = await api.post(
    '/api/features',
    { productId: Number(productId), feature: featureText.trim() },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const deleteProductFeature = async (id) => {
  const response = await api.delete(`/api/features/${id}`);
  return response.data;
};

// ─── Product Reviews ──────────────────────────────────────────────────────────
// GET    /api/reviews/{productId}
// GET    /api/reviews/item/{id}
// POST   /api/reviews
// PUT    /api/reviews/{id}
// DELETE /api/reviews/{id}

import { reviewService } from '../../services/reviewService';

export const fetchProductReviews = async (productId) => {
  return await reviewService.getByProduct(productId);
};

export const fetchProductReviewById = async (id) => {
  return await reviewService.getById(id);
};

const formatReviewDate = (d) => {
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') {
    if (d.includes('T')) return d;
    if (d.length === 7) return `${d}-01T00:00:00Z`;
    if (d.length === 10) return `${d}T00:00:00Z`;
  }
  return new Date(d).toISOString();
};

export const createProductReview = async (productId, review) => {
  const rNum = Number(review.rating);
  const result = await reviewService.submit({
    productId: String(productId || '').trim(),
    customerName: review.customer || review.customerName || 'Anonymous',
    rating: !isNaN(rNum) && rNum >= 0 ? rNum : 0,
    reviewDate: formatReviewDate(review.date || review.reviewDate),
    reviewComment: review.comment || review.reviewComment || '',
    verifiedPurchase: review.verified !== false,
  });
  apiCache.invalidate('product');
  apiCache.invalidate('products_all');
  apiCache.invalidate(`prod_${productId}`);
  return result;
};

export const updateProductReview = async (id, reviewData) => {
  const result = await reviewService.update(id, reviewData);
  apiCache.invalidate('product');
  apiCache.invalidate('products_all');
  return result;
};

export const deleteProductReview = async (id) => {
  const result = await reviewService.delete(id);
  apiCache.invalidate('product');
  apiCache.invalidate('products_all');
  return result;
};

// ─── Products — List & Search ─────────────────────────────────────────────────
// GET /api/products
// GET /api/products/search?keyword=
// GET /api/products/paged?page=&pageSize=&categoryId=&sort=
// GET /api/products/category/{categoryId}
// GET /api/products/subcategory/{subcategoryId}
// GET /api/products/dashboard
// GET /api/products/related/{productId}

/** Fetch all products (GET /api/products) */
export const fetchProducts = async (arg1 = false, arg2 = [], arg3 = []) => {
  let forceRefresh = false;
  let categories = [];
  let subcategories = [];

  if (typeof arg1 === 'boolean') {
    forceRefresh = arg1;
    categories = Array.isArray(arg2) ? arg2 : [];
    subcategories = Array.isArray(arg3) ? arg3 : [];
  } else if (Array.isArray(arg1)) {
    categories = arg1;
    subcategories = Array.isArray(arg2) ? arg2 : [];
    forceRefresh = typeof arg3 === 'boolean' ? arg3 : false;
  }

  if (forceRefresh) {
    apiCache.invalidate('products');
    apiCache.invalidate('product');
    apiCache.invalidate('paged');
    apiCache.invalidate('search');
  }

  return await apiCache.fetchWithCache('products_all', async () => {
    const [response, ledgerRes] = await Promise.all([
      api.get('/api/products').catch(() => null),
      api.get('/api/Stock/ledger').catch(() => null),
    ]);

    const rawList = unwrapList(response);
    const rawLedger = ledgerRes?.data;
    const ledgerList = Array.isArray(rawLedger)
      ? rawLedger
      : (Array.isArray(rawLedger?.Products)
        ? rawLedger.Products
        : (Array.isArray(rawLedger?.products) ? rawLedger.products : (Array.isArray(rawLedger?.items) ? rawLedger.items : [])));

    const ledgerMap = {};
    ledgerList.forEach((item) => {
      const itemId = String(item.id || item.productId || '');
      if (itemId) ledgerMap[itemId] = item;
    });

    const localReorders = getStoredReorderLevels();
    const localCosts = getStoredCostPrices();

    const apiProducts = rawList
      .filter((p) => p.isActive !== false && p.IsActive !== false)
      .map((p) => {
        const prodId = String(p.id ?? '');
        const ledgerItem = ledgerMap[prodId] || {};

        if (localReorders[prodId] !== undefined && localReorders[prodId] !== null && !isNaN(Number(localReorders[prodId]))) {
          p.reorderLevel = Number(localReorders[prodId]);
        } else if (p.reorderLevel === undefined && p.ReorderLevel === undefined) {
          if (ledgerItem.reorderLevel !== undefined || ledgerItem.ReorderLevel !== undefined) {
            p.reorderLevel = Number(ledgerItem.reorderLevel ?? ledgerItem.ReorderLevel);
          }
        }

        if (localCosts[prodId] !== undefined && localCosts[prodId] !== null && !isNaN(Number(localCosts[prodId]))) {
          p.costPrice = Number(localCosts[prodId]);
        } else if (p.costPrice === undefined && p.CostPrice === undefined && ledgerItem.costPrice !== undefined) {
          const cleanCp = String(ledgerItem.costPrice).replace(/[^0-9.]/g, '');
          const numCp = parseFloat(cleanCp);
          if (!isNaN(numCp) && numCp >= 0) p.costPrice = numCp;
        }

        const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
        return mapProductFromApi(p, categories, subcategories, [], prodReviews);
      });
    return apiProducts;
  }, forceRefresh ? 0 : 60 * 1000);
};

/** Search products by keyword (GET /api/products/search?keyword=) */
export const searchProducts = async (keyword, categories = [], subcategories = []) => {
  const cacheKey = `search_${(keyword || '').toLowerCase()}`;
  return await apiCache.fetchWithCache(cacheKey, async () => {
    const response = await api.get('/api/products/search', { params: { keyword } });
    return unwrapList(response)
      .filter((p) => p.isActive !== false && p.IsActive !== false)
      .map((p) => {
        const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
        return mapProductFromApi(p, categories, subcategories, [], prodReviews);
      });
  }, 3 * 60 * 1000);
};

/**
 * Fetch paginated products (GET /api/products/paged?page=&pageSize=&categoryId=&sort=)
 * Accepts either options object { page, pageSize, categoryId, sort } or positional arguments.
 * Returns { products, page, pageSize, total }
 */
export const fetchProductsPaged = async (
  pageOrOpts = 1,
  pageSizeArg = 10,
  categories = [],
  subcategories = [],
  extraParams = {}
) => {
  let page = 1;
  let pageSize = 10;
  let params = {};

  if (typeof pageOrOpts === 'object' && pageOrOpts !== null) {
    const opts = pageOrOpts;
    page = opts.page || 1;
    pageSize = opts.pageSize || 10;
    if (opts.categoryId !== undefined && opts.categoryId !== null && opts.categoryId !== '') params.categoryId = opts.categoryId;
    if (opts.sort) params.sort = opts.sort;
    if (opts.keyword) params.keyword = opts.keyword;
  } else {
    page = pageOrOpts;
    pageSize = pageSizeArg;
    params = extraParams;
  }

  const cacheKey = `paged_${page}_${pageSize}_${params.categoryId || ''}_${params.sort || ''}_${params.keyword || ''}`;
  return await apiCache.fetchWithCache(cacheKey, async () => {
    const response = await api.get('/api/products/paged', { params: { page, pageSize, ...params } });
    const raw = response?.data;
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
      ? raw.items
      : [];
    return {
      products: items.map((p) => {
        const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
        return mapProductFromApi(p, categories, subcategories, [], prodReviews);
      }),
      page: raw?.page ?? page,
      pageSize: raw?.pageSize ?? pageSize,
      total: raw?.total ?? items.length,
    };
  }, 3 * 60 * 1000);
};

/** Fetch products by category (GET /api/products/category/{categoryId}) */
export const fetchProductsByCategory = async (
  categoryId,
  categories = [],
  subcategories = []
) => {
  return await apiCache.fetchWithCache(`cat_prods_${categoryId}`, async () => {
    const response = await api.get(`/api/products/category/${categoryId}`);
    return unwrapList(response).map((p) => {
      const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
      return mapProductFromApi(p, categories, subcategories, [], prodReviews);
    });
  }, 5 * 60 * 1000);
};

/** Fetch products by subcategory (GET /api/products/subcategory/{subcategoryId}) */
export const fetchProductsBySubcategory = async (
  subcategoryId,
  categories = [],
  subcategories = []
) => {
  return await apiCache.fetchWithCache(`subcat_prods_${subcategoryId}`, async () => {
    const response = await api.get(`/api/products/subcategory/${subcategoryId}`);
    return unwrapList(response).map((p) => {
      const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
      return mapProductFromApi(p, categories, subcategories, [], prodReviews);
    });
  }, 5 * 60 * 1000);
};

/** Fetch dashboard stats (GET /api/products/dashboard) */
export const fetchProductsDashboard = async () => {
  const response = await api.get('/api/products/dashboard');
  return unwrapItem(response);
};

/** Fetch related products (GET /api/products/related/{productId}) */
export const fetchRelatedProducts = async (
  productId,
  categories = [],
  subcategories = []
) => {
  return await apiCache.fetchWithCache(`related_${productId}`, async () => {
    const response = await api.get(`/api/products/related/${productId}`);
    return unwrapList(response).map((p) => {
      const prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
      return mapProductFromApi(p, categories, subcategories, [], prodReviews);
    });
  }, 5 * 60 * 1000);
};

// ─── Products — Single Item ────────────────────────────────────────────────────
// GET /api/products/{id}

export const fetchProduct = async (id, categories = [], subcategories = []) => {
  return await apiCache.fetchWithCache(`product_${id}`, async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      const product = unwrapItem(response);
      const prodId = product.id || id;

      // The backend /api/products/{id} already includes Features and Reviews via EF navigation properties.
      // Only fetch separately if not present in the payload.
      let features = Array.isArray(product.features) ? product.features : [];
      let reviews = Array.isArray(product.reviews) ? product.reviews : [];

      if (features.length === 0 && (!product.keyFeatures || product.keyFeatures.length === 0)) {
        features = await fetchProductFeatures(prodId).catch(() => []);
      }
      if (reviews.length === 0 && !product.totalReviews) {
        reviews = await fetchProductReviews(prodId).catch(() => []);
      }

      const strictReviews = (Array.isArray(reviews) ? reviews : []).filter(
        (r) => !r.productId || String(r.productId) === String(prodId)
      );

      // If backend product response omits reorderLevel or costPrice, enrich from stored levels or stock ledger
      const localReorders = getStoredReorderLevels();
      if (localReorders[String(prodId)] !== undefined && localReorders[String(prodId)] !== null && !isNaN(Number(localReorders[String(prodId)]))) {
        product.reorderLevel = Number(localReorders[String(prodId)]);
      }
      const localCosts = getStoredCostPrices();
      if (localCosts[String(prodId)] !== undefined && localCosts[String(prodId)] !== null && !isNaN(Number(localCosts[String(prodId)]))) {
        product.costPrice = Number(localCosts[String(prodId)]);
      }

      if (product && ((product.reorderLevel === undefined && product.ReorderLevel === undefined) || product.costPrice === undefined)) {
        try {
          const ledgerRes = await api.get('/api/Stock/ledger', { params: { _t: Date.now() } });
          const rawLedger = ledgerRes?.data;
          const list = Array.isArray(rawLedger)
            ? rawLedger
            : (Array.isArray(rawLedger?.Products)
              ? rawLedger.Products
              : (Array.isArray(rawLedger?.products) ? rawLedger.products : []));
          const match = list.find((p) => String(p.id || p.Id) === String(prodId));
          if (match) {
            if ((product.reorderLevel === undefined && product.ReorderLevel === undefined) && (match.reorderLevel !== undefined || match.ReorderLevel !== undefined)) {
              product.reorderLevel = match.reorderLevel ?? match.ReorderLevel;
            }
            if (match.costPrice !== undefined || match.CostPrice !== undefined) {
              const cleanCp = String(match.costPrice ?? match.CostPrice).replace(/[^0-9.]/g, '');
              const numCp = parseFloat(cleanCp);
              if (!isNaN(numCp) && numCp >= 0) product.costPrice = numCp;
            }
          }
        } catch (e) {
          // ignore ledger enrichment failure
        }
      }

      return mapProductFromApi(product, categories, subcategories, features, strictReviews);
    } catch (err) {
      console.warn(`GET /api/products/${id} failed (${err.message}), attempting catalog fallback search.`);
      try {
        const allProds = await fetchProducts(categories, subcategories);
        if (Array.isArray(allProds) && allProds.length > 0) {
          const cleanId = String(id).trim().toLowerCase();
          const found = allProds.find((p) => {
            const pId = String(p.id || '').toLowerCase();
            const pSlug = String(p.slug || '').toLowerCase();
            const pName = String(p.name || p.title || '').toLowerCase();
            const pCode = String(p.sku || p.code || '').toLowerCase();
            return (
              pId === cleanId ||
              pSlug === cleanId ||
              pCode === cleanId ||
              pName === cleanId ||
              pName.replace(/\s+/g, '-') === cleanId ||
              pName.includes(cleanId) ||
              cleanId.includes(pName)
            );
          });
          if (found) return found;
        }
      } catch (fallbackErr) {
        console.error('Fallback catalog search also failed:', fallbackErr.message);
      }
      throw err;
    }
  }, 5 * 60 * 1000);
};


// ─── Products — Create / Update ───────────────────────────────────────────────
// POST /api/products
// PUT  /api/products/{id}
// POST /api/features  (per feature)
// POST /api/reviews   (per review)

export const saveProduct = async (product, imageFiles = [], videoFile = null, posterFile = null) => {
  const prodId = product.id || product.productId;
  const isEditing = Boolean(prodId);

  // Convert File objects to Base64 data URLs for offline / fallback / JSON payload storage
  const fileDataUrls = await Promise.all(
    (imageFiles || []).map((file) =>
      new Promise((resolve) => {
        if (!file || typeof file === 'string') return resolve(file || '');
        if (typeof FileReader === 'undefined') return resolve('');
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      })
    )
  ).then((list) => list.filter(Boolean));

  const existingImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : []);
  const mergedImages = [...existingImages, ...fileDataUrls].filter(Boolean);
  const primaryImage = mergedImages[0] || product.image || '';

  const fd = new FormData();
  if (isEditing) {
    fd.append('Id', String(prodId));
    fd.append('id', String(prodId));
    fd.append('ProductId', String(prodId));
  }
  fd.append('Name', product.name || '');
  fd.append('SKU', product.sku || '');
  fd.append('Brand', product.brand || 'Honeywell');
  fd.append('SupplierName', product.supplier || product.manufacturer || '');
  const parseNumOrDef = (val, def) => (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) ? Number(val) : def);
  const stockVal = parseNumOrDef(product.stock, 0);
  const reorderVal = parseNumOrDef(product.reorderLevel, 10);
  const costVal = parseNumOrDef(product.costPrice, 0);
  const computedStatus = product.status || computeStockStatus(stockVal, reorderVal);

  if (prodId) {
    setStoredReorderLevel(prodId, reorderVal);
    setStoredCostPrice(prodId, costVal);
  }

  const effectiveBasePrice = String(Number(product.basePrice) || Number(product.price) || Number(product.mrp) || 0);
  fd.append('MRP', String(Number(product.mrp) || 0));
  fd.append('SellingPrice', String(Number(product.price) || 0));
  fd.append('BasePrice', effectiveBasePrice);
  fd.append('basePrice', effectiveBasePrice);
  fd.append('StockQuantity', String(stockVal));
  fd.append('Stock', String(stockVal));
  fd.append('StockStatus', computedStatus);
  fd.append('stockStatus', computedStatus);
  fd.append('ReorderLevel', String(reorderVal));
  fd.append('reorderLevel', String(reorderVal));
  fd.append('CostPrice', String(costVal));
  fd.append('costPrice', String(costVal));
  fd.append('CategoryId', String(Number(product.categoryId) || 0));
  fd.append('SubcategoryId', String(Number(product.subcategoryId) || 0));
  fd.append('ShortDescription', product.shortDescription || product.description || '');
  fd.append('ProductDetails', product.productDetails || '');
  fd.append('PackageIncludes', product.packageIncludes || '');

  // Specifications
  const specWeight = product.specifications?.weight || '';
  const specDimensions = product.specifications?.dimensions || '';
  const specPower = product.specifications?.powerSource || '';
  const specMaterial = product.specifications?.material || '';
  const specCoverage = product.specifications?.coverage || product.specifications?.coverageUsage || '';
  const specJsonStr = JSON.stringify(product.specifications || {});

  fd.append('Weight', specWeight);
  fd.append('Dimensions', specDimensions);
  fd.append('PowerSource', specPower);
  fd.append('Material', specMaterial);
  fd.append('CoverageUsage', specCoverage);
  fd.append('Specifications', specJsonStr);

  // Pricing & Discounts
  fd.append('DiscountType', product.discountType || 'none');
  fd.append('DiscountAmount', String(Number(product.discountValue) || 0));

  // Delivery & Trust
  fd.append('CountryOfOrigin', product.countryOfOrigin || 'India');
  fd.append('CodAvailability', product.codAvailable === 'Yes' || product.codAvailable === true ? 'true' : 'false');
  fd.append('EstimatedDelivery', product.deliveryEstimate || '3-7 business days');
  fd.append('DeliveryReturn', product.returnPolicy || 'Easy Returns');
  fd.append('IsActive', product.status !== 'Inactive' ? 'true' : 'false');

  // Alternate key aliases for maximum backend DTO compatibility
  fd.append('ProductName', product.name || '');
  fd.append('Manufacturer', product.supplier || product.manufacturer || '');
  fd.append('Price', String(Number(product.price) || 0));
  fd.append('Stock', String(stockVal));
  fd.append('StockStatus', computedStatus);
  fd.append('stockStatus', computedStatus);
  fd.append('reorderLevel', String(reorderVal));
  fd.append('ReorderLevel', String(reorderVal));
  fd.append('costPrice', String(costVal));
  fd.append('CostPrice', String(costVal));
  fd.append('Description', product.shortDescription || product.description || '');
  fd.append('Overview', product.shortDescription || product.description || '');
  fd.append('LongDescription', product.productDetails || '');
  fd.append('Details', product.productDetails || '');
  fd.append('Coverage', specCoverage);

  // Ratings & Reviews
  let calculatedRating = Number(product.rating) || 0;
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const validRatings = product.reviews
      .map((r) => Number(r.rating))
      .filter((n) => !isNaN(n) && n > 0);
    if (validRatings.length > 0) {
      calculatedRating = Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2));
    }
  }
  const calculatedTotalReviews = Array.isArray(product.reviews) && product.reviews.length > 0
    ? product.reviews.length
    : (Number(product.totalReviews) || 0);

  fd.append('Rating', String(calculatedRating));
  fd.append('AverageRating', String(calculatedRating));
  fd.append('TotalReviews', String(calculatedTotalReviews));

  // Images & Media
  if (Array.isArray(imageFiles)) {
    imageFiles.forEach((file) => fd.append('Images', file));
  }
  if (videoFile) fd.append('Video', videoFile);
  if (posterFile) fd.append('Poster', posterFile);

  let mapped = null;
  let savedId = String(prodId || '');

  try {
    const response = await api({
      method: isEditing ? 'PUT' : 'POST',
      url: isEditing ? `/api/products/${prodId}` : '/api/products',
      data: fd,
    });
    const saved = unwrapItem(response);
    savedId = String(saved?.productId || saved?.id || prodId || '');
    if (savedId) {
      setStoredReorderLevel(savedId, reorderVal);
      setStoredCostPrice(savedId, costVal);
    }
    mapped = mapProductFromApi(saved);
  } catch (err) {
    console.warn('FormData product upload failed, attempting JSON fallback:', err.message);

    // Standard JSON payload fallback
    const payload = {
      id: isEditing ? Number(prodId) : undefined,
      productName: product.name || '',
      name: product.name || '',
      sku: product.sku || '',
      brand: product.brand || 'Honeywell',
      manufacturer: product.supplier || product.manufacturer || '',
      subcategoryId: Number(product.subcategoryId) || 0,
      categoryId: Number(product.categoryId) || 0,
      mrp: Number(product.mrp) || 0,
      price: Number(product.price) || 0,
      sellingPrice: Number(product.price) || 0,
      basePrice: Number(product.basePrice) || Number(product.price) || Number(product.mrp) || 0,
      BasePrice: Number(product.basePrice) || Number(product.price) || Number(product.mrp) || 0,
      stock: stockVal,
      stockQuantity: stockVal,
      reorderLevel: reorderVal,
      costPrice: costVal,
      stockStatus: computedStatus,
      StockStatus: computedStatus,
      shortDescription: product.shortDescription || product.description || '',
      productDetails: product.productDetails || '',
      packageIncludes: product.packageIncludes || '',
      weight: specWeight,
      dimensions: specDimensions,
      powerSource: specPower,
      material: specMaterial,
      coverageUsage: specCoverage,
      specifications: product.specifications || {},
      discountType: product.discountType || 'none',
      discountAmount: Number(product.discountValue) || 0,
      rating: calculatedRating,
      averageRating: calculatedRating,
      totalReviews: calculatedTotalReviews,
      isActive: product.status !== 'Inactive' && product.isActive !== false,
      imageUrl: primaryImage,
      image: primaryImage,
      images: mergedImages,
    };

    try {
      const response = await api({
        method: isEditing ? 'PUT' : 'POST',
        url: isEditing ? `/api/products/${prodId}` : '/api/products',
        data: payload,
        headers: { 'Content-Type': 'application/json' },
      });
      const saved = unwrapItem(response);
      savedId = String(saved?.productId || saved?.id || prodId || '');
      if (savedId) {
        setStoredReorderLevel(savedId, reorderVal);
        setStoredCostPrice(savedId, costVal);
      }
      mapped = mapProductFromApi(saved?.productId ? { ...payload, id: saved.productId } : saved);
    } catch (err2) {
      console.error('Backend API failed to save product:', err2);
      throw err2;
    }
  }

  if (mapped) {
    if (!mapped.image && primaryImage) mapped.image = primaryImage;
    if ((!mapped.images || mapped.images.length === 0) && mergedImages.length > 0) {
      mapped.images = mergedImages;
      mapped.gallery = mergedImages;
    }
  }

  const targetId = String(savedId || mapped?.id || product.id || '').trim();
  if (targetId) {
    setStoredReorderLevel(targetId, reorderVal);
    setStoredCostPrice(targetId, costVal);
  }

  // If deletedReviewIds provided, delete them in parallel
  if (Array.isArray(product.deletedReviewIds) && product.deletedReviewIds.length > 0) {
    await Promise.all(
      product.deletedReviewIds
        .filter(Boolean)
        .map((dId) => deleteProductReview(dId).catch((e) => console.warn('Could not delete review:', dId, e?.message)))
    );
  }

  // If reviews provided in product, persist them in parallel
  let savedReviews = [];
  if (targetId && Array.isArray(product.reviews) && product.reviews.length > 0) {
    const validReviews = product.reviews.filter((r) => r && (r.customer || r.customerName || r.comment || r.reviewComment));
    const results = await Promise.all(
      validReviews.map(async (r) => {
        try {
          if (r.id) {
            return await updateProductReview(r.id, { ...r, productId: targetId });
          } else {
            return await createProductReview(targetId, r);
          }
        } catch (revErr) {
          console.warn('Could not persist product review:', revErr?.message);
          return null;
        }
      })
    );
    savedReviews = results.filter(Boolean);
  } else if (targetId && calculatedRating > 0) {
    // User set Average Rating in the product form without adding a Featured Review
    try {
      const existing = await reviewService.getByProduct(targetId);
      if (Array.isArray(existing) && existing.length > 0) {
        const first = existing[0];
        const updated = await updateProductReview(first.id, {
          ...first,
          rating: calculatedRating,
          productId: targetId,
        });
        if (updated) savedReviews.push(updated);
      } else {
        const created = await createProductReview(targetId, {
          customer: 'Customer Rating',
          rating: calculatedRating,
          comment: 'Verified Customer Rating',
          verified: true,
        });
        if (created) savedReviews.push(created);
      }
    } catch (e) {
      console.warn('Could not auto-seed review for product rating:', e?.message);
    }
  }

  const finalProduct = {
    ...product,
    ...(mapped || {}),
    id: targetId || mapped?.id || prodId,
    stock: String(stockVal),
    reorderLevel: reorderVal,
    status: computedStatus,
    costPrice: costVal,
    shortDescription: mapped?.shortDescription || product.shortDescription || product.description || '',
    productDetails: mapped?.productDetails || product.productDetails || '',
    specifications: mapped?.specificationsObj || product.specifications || {},
    specificationsObj: mapped?.specificationsObj || product.specifications || {},
    rating: String(calculatedRating > 0 ? calculatedRating.toFixed(1) : (mapped?.rating || product.rating || '0')),
    averageRating: calculatedRating,
    totalReviews: String(calculatedTotalReviews),
    reviewCount: calculatedTotalReviews,
    reviews: (savedReviews.length > 0 ? savedReviews : (product.reviews || [])).map((r) => {
      const rRating = Number(r.rating) || calculatedRating;
      const rDate = r.reviewDate || r.date || new Date().toISOString();
      const rName = r.customerName || r.customer || 'Anonymous';
      const rComment = r.reviewComment || r.comment || '';
      return {
        id: String(r.id || ''),
        productId: targetId,
        customer: rName,
        customerName: rName,
        rating: rRating,
        ratingStr: String(rRating),
        comment: rComment,
        reviewComment: rComment,
        date: rDate,
        reviewDate: rDate,
        verified: r.verified !== false,
        verifiedPurchase: r.verified !== false,
      };
    }),
  };
  upsertProduct(finalProduct);

  apiCache.invalidate(); // Clear all cache so fresh products, search, paged, and stock ledger are always loaded
  if (finalProduct.id) {
    apiCache.set(`product_${finalProduct.id}`, finalProduct);
  }
  reviewService.clearCache();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('product-updated', { detail: finalProduct }));
    window.dispatchEvent(new CustomEvent('catalog-updated', { detail: finalProduct }));
  }

  return finalProduct;
};

// ─── Products — Delete ────────────────────────────────────────────────────────
// DELETE /api/products/{id}

export const deleteProduct = async (id) => {
  if (!id) return;
  try {
    await api.delete(`/api/products/${id}`);
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) {
      console.warn(`DELETE /api/products/${id} returned 404 (item not found on server). Cleaning up locally.`);
    } else {
      let deleted = false;
      try {
        await api.delete(`/api/products/delete/${id}`);
        deleted = true;
      } catch (err2) {
        if (err2.response?.status === 404) {
          deleted = true;
        }
      }

      // If hard delete failed (e.g. server missing WishlistItems table or FK restriction), deactivate product via PUT
      if (!deleted) {
        try {
          const fd = new FormData();
          fd.append('IsActive', 'false');
          fd.append('isActive', 'false');
          await api.put(`/api/products/${id}`, fd);
          deleted = true;
        } catch {
          try {
            await api.put(`/api/products/${id}`, { isActive: false, IsActive: false }, {
              headers: { 'Content-Type': 'application/json' }
            });
            deleted = true;
          } catch (putErr) {
            console.warn('Fallback product deactivation also failed:', putErr.message);
          }
        }
      }
    }
  } finally {
    apiCache.invalidate('products');
    apiCache.invalidate('product');
    apiCache.invalidate('prod_');
    apiCache.invalidate('paged');
    apiCache.invalidate('search');
    apiCache.invalidate('cat_prods');
    apiCache.invalidate('subcat_prods');
    apiCache.invalidate('related');
    deleteProductFromStore(id);
  }
};

// ─── Products — Patch Stock ───────────────────────────────────────────────────
// PATCH /api/products/{id}/stock

export const updateProductStock = async (id, newStock) => {
  try {
    const response = await api.patch(`/api/products/${id}/stock`, { stockQuantity: Number(newStock) }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/api/products/${id}/stock`, null, {
      params: { stock: Number(newStock) },
    });
    return response.data;
  }
};


