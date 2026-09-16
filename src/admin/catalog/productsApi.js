import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';
import { getProducts, getCategories, upsertProduct, saveProducts, deleteProductFromStore, defaultProducts } from './catalogStore';
import { apiCache } from '../../utils/apiCache';


// ─── Base URL ────────────────────────────────────────────────────────────────
export const BASE_URL = getApiDomain();

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // Increased to 5 minutes for large media uploads
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
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

/** Resolve a relative image path to a full URL */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().includes('placeholder') || trimmed.includes('honeywell-products-logo.png')) {
    return '/honeywell-products-logo.png';
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/honeywell-products-logo.png') || trimmed.startsWith('/admin-') || trimmed.startsWith('/favicon')) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.slice(trimmed.indexOf('/uploads/'));
    const cleanBase = (BASE_URL || '').replace(/\/$/, '');
    return `${cleanBase}${uploadPath}`;
  }
  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('/honeywell-products-logo')
  ) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  const cleanBase = (BASE_URL || '').replace(/\/$/, '');
  if (!cleanBase) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
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
export const mapCategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? ''),
  name: raw.categoryName || raw.name || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  metaTitle: raw.metaTitle || `${raw.categoryName || raw.name || ''} | Honeywell`,
  metaDescription: raw.metaDescription || raw.description || '',
  image: resolveImageUrl(raw.imageUrl || raw.image || ''),
  imageUrl: raw.imageUrl || '',
  subCategories: raw.subCategories || raw.subcategories || [],
  products: raw.products || [],
  code: raw.categoryCode || String(raw.id || ''),
});

/** Map a raw subcategory object from the API to our frontend shape */
export const mapSubcategoryFromApi = (raw = {}) => ({
  id: String(raw.id ?? ''),
  categoryId: String(raw.categoryId ?? ''),
  name: raw.subcategoryName || raw.name || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  image: resolveImageUrl(raw.imageUrl || raw.image || ''),
  imageUrl: raw.imageUrl || '',
  categoryName: raw.categoryName || raw.category?.categoryName || '',
  products: raw.products || [],
});

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

  const mappedReviews = rawReviews.map((r) => ({
    id: String(r.id ?? ''),
    customer: r.customerName || r.customer || 'Anonymous',
    rating: String(Number(r.rating) || 5),
    date: r.reviewDate
      ? r.reviewDate.slice(0, 7)
      : r.dateCreated
      ? r.dateCreated.slice(0, 7)
      : new Date().toISOString().slice(0, 7),
    comment: r.reviewComment || r.comment || '',
    verified: (r.verifiedPurchase ?? r.verified) !== false,
  }));

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
    reorderLevel: raw.reorderLevel !== undefined ? Number(raw.reorderLevel) : (raw.ReorderLevel !== undefined ? Number(raw.ReorderLevel) : 10),
    status: computeStockStatus(stock, raw.reorderLevel !== undefined ? Number(raw.reorderLevel) : (raw.ReorderLevel !== undefined ? Number(raw.ReorderLevel) : 10)),
    costPrice: raw.costPrice !== undefined ? Number(raw.costPrice) : (raw.CostPrice !== undefined ? Number(raw.CostPrice) : (raw.sellingPrice ? Number(raw.sellingPrice) * 0.7 : (raw.mrp ? Number(raw.mrp) * 0.7 : 0))),

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
    rating: String(raw.averageRating ?? raw.rating ?? '4.8'),
    reviewCount: Number(raw.totalReviews ?? mappedReviews.length ?? 8),
    totalReviews: String(raw.totalReviews ?? mappedReviews.length ?? 8),
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

export const fetchCategories = async () => {
  const response = await api.get('/api/Category');
  return unwrapList(response).map(mapCategoryFromApi);
};

// ─── Subcategories ────────────────────────────────────────────────────────────
// GET /api/Subcategory

export const fetchSubcategories = async () => {
  return await apiCache.fetchWithCache('subcategories_all', async () => {
    const response = await api.get('/api/Subcategory');
    return unwrapList(response).map(mapSubcategoryFromApi);
  }, 10 * 60 * 1000);
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

export const createProductReview = async (productId, review) => {
  return await reviewService.submit({
    productId: Number(productId),
    customerName: review.customer || review.customerName || 'Anonymous',
    rating: Number(review.rating) || 5,
    reviewDate: review.date ? `${review.date}-01T00:00:00Z` : new Date().toISOString(),
    reviewComment: review.comment || review.reviewComment || '',
    verifiedPurchase: review.verified !== false,
  });
};

export const updateProductReview = async (id, reviewData) => {
  return await reviewService.update(id, reviewData);
};

export const deleteProductReview = async (id) => {
  return await reviewService.delete(id);
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
export const fetchProducts = async (categories = [], subcategories = []) => {
  return await apiCache.fetchWithCache('products_all', async () => {
    const response = await api.get('/api/products');
    const apiProducts = unwrapList(response).map((p) =>
      mapProductFromApi(p, categories, subcategories)
    );
    return apiProducts;
  }, 5 * 60 * 1000);
};

/** Search products by keyword (GET /api/products/search?keyword=) */
export const searchProducts = async (keyword, categories = [], subcategories = []) => {
  const cacheKey = `search_${(keyword || '').toLowerCase()}`;
  return await apiCache.fetchWithCache(cacheKey, async () => {
    const response = await api.get('/api/products/search', {
      params: { keyword },
    });
    return unwrapList(response).map((p) =>
      mapProductFromApi(p, categories, subcategories)
    );
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
    const response = await api.get('/api/products/paged', {
      params: { page, pageSize, ...params },
    });
    const raw = response?.data;
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
      ? raw.items
      : [];
    return {
      products: items.map((p) => mapProductFromApi(p, categories, subcategories)),
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
    return unwrapList(response).map((p) =>
      mapProductFromApi(p, categories, subcategories)
    );
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
    return unwrapList(response).map((p) =>
      mapProductFromApi(p, categories, subcategories)
    );
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
    return unwrapList(response).map((p) =>
      mapProductFromApi(p, categories, subcategories)
    );
  }, 5 * 60 * 1000);
};

// ─── Products — Single Item ────────────────────────────────────────────────────
// GET /api/products/{id}

export const fetchProduct = async (id, categories = [], subcategories = []) => {
  return await apiCache.fetchWithCache(`product_${id}`, async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      const product = unwrapItem(response);

      // Fetch features and reviews in parallel; never let them crash the product load
      const [features, reviews] = await Promise.all([
        fetchProductFeatures(id).catch((e) => {
          console.warn('Could not load features for product', id, e?.message);
          return [];
        }),
        fetchProductReviews(id).catch((e) => {
          console.warn('Could not load reviews for product', id, e?.message);
          return [];
        }),
      ]);

      return mapProductFromApi(product, categories, subcategories, features, reviews);
    } catch (err) {
      console.error(`GET /api/products/${id} failed:`, err.message);
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
  const isEditing = Boolean(product.id);

  // Convert File objects to Base64 data URLs for offline/fallback storage
  const fileDataUrls = await Promise.all(
    (imageFiles || []).map((file) =>
      new Promise((resolve) => {
        if (!file || typeof file === 'string') return resolve(file || '');
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
    fd.append('Id', String(product.id));
  }
  fd.append('Name', product.name || '');
  fd.append('SKU', product.sku || '');
  fd.append('Brand', product.brand || 'Honeywell');
  fd.append('SupplierName', product.supplier || product.manufacturer || '');
  fd.append('MRP', String(Number(product.mrp) || 0));
  fd.append('SellingPrice', String(Number(product.price) || 0));
  fd.append('StockQuantity', String(Number(product.stock) || 0));
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
  fd.append('Stock', String(Number(product.stock) || 0));

  // Images & Media
  if (Array.isArray(imageFiles)) {
    imageFiles.forEach((file) => fd.append('Images', file));
  }
  if (videoFile) fd.append('Video', videoFile);
  if (posterFile) fd.append('Poster', posterFile);

  try {
    const response = await api({
      method: isEditing ? 'PUT' : 'POST',
      url: isEditing ? `/api/products/${product.id}` : '/api/products',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const saved = unwrapItem(response);
    const mapped = mapProductFromApi(saved);
    if (!mapped.image && primaryImage) mapped.image = primaryImage;
    if ((!mapped.images || mapped.images.length === 0) && mergedImages.length > 0) {
      mapped.images = mergedImages;
      mapped.gallery = mergedImages;
    }
    upsertProduct(mapped);
    return mapped;
  } catch (err) {
    console.warn('FormData product upload failed, attempting JSON fallback:', err.message);
  }

  // Standard JSON payload fallback
  const payload = {
    id: isEditing ? Number(product.id) : undefined,
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
    stock: Number(product.stock) || 0,
    stockQuantity: Number(product.stock) || 0,
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
    isActive: product.status !== 'Inactive' && product.isActive !== false,
    imageUrl: primaryImage,
    image: primaryImage,
    images: mergedImages,
  };

  try {
    const response = await api({
      method: isEditing ? 'PUT' : 'POST',
      url: isEditing ? `/api/products/${product.id}` : '/api/products',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });
    const saved = unwrapItem(response);
    const savedId = String(saved.productId || saved.id || product.id || '');
    const mapped = mapProductFromApi(saved?.productId ? { ...payload, id: saved.productId } : saved);
    if (!mapped.image && primaryImage) mapped.image = primaryImage;
    if ((!mapped.images || mapped.images.length === 0) && mergedImages.length > 0) {
      mapped.images = mergedImages;
      mapped.gallery = mergedImages;
    }
    const finalProduct = { ...mapped, id: savedId || mapped.id };
    upsertProduct(finalProduct);
    return finalProduct;
  } catch (err) {
    console.error('Backend API unavailable to save product:', err.message);
    throw new Error('Unable to save product. Backend server is unreachable.');
  }
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
      try {
        await api.delete(`/api/products/delete/${id}`);
      } catch (err2) {
        if (err2.response?.status !== 404) {
          console.warn(`DELETE /api/products/delete/${id} failed:`, err2.message);
        }
      }
    }
  } finally {
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


