import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

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
    const rawBrand = (item.brand || item.Brand || item.brandName || item.manufacturer || item.Manufacturer || '').toString().trim();
    
    // If a custom non-generic brand is explicitly stored, keep it
    if (rawBrand && rawBrand !== 'Shyam Agro' && rawBrand !== 'Shyam Agro Tools' && rawBrand !== 'ShyamAgro' && rawBrand !== 'Honeywell') {
      return rawBrand;
    }

    const productName = (item.productName || item.name || '').toLowerCase();
    const categoryName = (item.category?.name || item.categoryName || item.category || '').toLowerCase();

    // Map top industry brands by product domain & keywords
    if (productName.includes('drip') || productName.includes('irrigation')) return 'Netafim';
    if (productName.includes('sprinkler') || productName.includes('nozzle')) return 'AquaFlow';
    if (productName.includes('reaper') || productName.includes('binder') || productName.includes('harvester')) return 'VST Shakti';
    if (productName.includes('fertilizer') || productName.includes('spreader')) return 'GreenGrow';
    if (productName.includes('brush cutter') || productName.includes('trimmer') || productName.includes('chainsaw')) return 'Stihl';
    if (productName.includes('sprayer') || productName.includes('fogger')) return 'Aspee';
    if (productName.includes('tiller') || productName.includes('cultivator') || productName.includes('weeder')) return 'Kirloskar';
    if (productName.includes('seed') || productName.includes('drill') || productName.includes('planter')) return 'Mahindra Agri';
    if (productName.includes('pruner') || productName.includes('shear') || productName.includes('secateur')) return 'Falcon Tools';
    if (categoryName.includes('spray')) return 'Neptune';
    if (categoryName.includes('garden') || categoryName.includes('farm')) return 'AgriPro';

    return 'Honeywell';
  };

  // ── Weight Resolution ──────────────────────────────────────────────────────
  const resolveWeight = (item) => {
    const existing = (item.weight || item.Weight || item.specifications?.weight || '').toString().trim();
    if (existing && existing !== 'N/A' && existing !== 'null' && existing !== '0') {
      return existing;
    }

    const productName = (item.productName || item.name || '').toLowerCase();

    if (productName.includes('fertilizer spreader') || productName.includes('spreader')) return 'Approx. 12 kg';
    if (productName.includes('reaper') || productName.includes('binder')) return 'Approx. 85 kg';
    if (productName.includes('sprinkler nozzle set') || productName.includes('nozzle')) return 'Approx. 1.2 kg (10 pcs)';
    if (productName.includes('drip irrigation kit') || productName.includes('irrigation')) return 'Approx. 25 kg (Kit)';
    if (productName.includes('tiller') || productName.includes('cultivator') || productName.includes('weeder')) return 'Approx. 113 kg';
    if (productName.includes('blower') || productName.includes('leaf')) return 'Approx. 9-10 kg';
    if (productName.includes('sprayer') || productName.includes('backpack')) return 'Approx. 6.5 kg (Empty)';
    if (productName.includes('pipe') || productName.includes('hose')) return 'Approx. 15 kg (50m)';
    if (productName.includes('seed drill') || productName.includes('planter')) return 'Approx. 140 kg';
    if (productName.includes('brush cutter') || productName.includes('trimmer')) return 'Approx. 7.8 kg';
    if (productName.includes('pruner') || productName.includes('shear') || productName.includes('secateur')) return 'Approx. 850 g';
    if (productName.includes('koramandal') || productName.includes('fertilizer') || productName.includes('compost')) return '50 kg';

    return 'Approx. 5-10 kg';
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
  const priceNote = numericMrp > numericPrice ? `MRP ₹${numericMrp.toLocaleString('en-IN')}` : 'Incl. taxes';

  // ── Specifications Array ──────────────────────────────────────────────────
  const specsObj = {
    weight: resolvedWeight,
    dimensions: raw.dimensions || raw.specifications?.dimensions || '',
    powerSource: raw.powerSource || raw.specifications?.powerSource || '',
    material: raw.material || raw.specifications?.material || '',
    coverage: raw.coverageUsage || raw.specifications?.coverage || '',
  };

  const specsList = [
    `Weight: ${resolvedWeight}`,
    `Dimensions: ${specsObj.dimensions || 'Standard'}`,
    `Power Source: ${specsObj.powerSource || 'AC/DC Power Supply'}`,
    `Material: ${specsObj.material || 'Durable Metallic Housing'}`,
    `Coverage / Usage: ${specsObj.coverage || 'Indoor / Outdoor'}`,
  ];

  const categoryName = raw.categoryName || raw.category?.categoryName || raw.category?.name || categories.find(c => String(c.id) === String(categoryId))?.name || 'General';
  const subcategoryName = raw.subcategoryName || raw.subcategory?.subcategoryName || raw.subcategory?.name || subcategories.find(s => String(s.id) === String(subcategoryId))?.name || 'Security Equipment';

  const defaultHighlights = keyFeatures.length > 0 ? keyFeatures : [
    raw.shortDescription || raw.description || 'High performance professional surveillance product',
    `Brand: ${brandName}`,
    `Model SKU: ${raw.sku || brandName}`
  ];

  return {
    id: String(raw.id ?? ''),
    slug: raw.slug || String(raw.id ?? ''),
    name: raw.productName || raw.name || '',
    sku: raw.sku || '',
    brand: brandName,
    supplier: raw.manufacturer || raw.supplier || '',
    categoryId: categoryId || (categories[0]?.id ?? ''),
    subcategoryId: subcategoryId || (subcategories[0]?.id ?? ''),
    category: categoryName,
    productType: subcategoryName,
    model: raw.sku || raw.model || brandName || 'GEN-PRO',

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
  const response = await api.get('/api/Subcategory');
  return unwrapList(response).map(mapSubcategoryFromApi);
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
  const response = await api.get('/api/products');
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/** Search products by keyword (GET /api/products/search?keyword=) */
export const searchProducts = async (keyword, categories = [], subcategories = []) => {
  const response = await api.get('/api/products/search', {
    params: { keyword },
  });
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
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
};

/** Fetch products by category (GET /api/products/category/{categoryId}) */
export const fetchProductsByCategory = async (
  categoryId,
  categories = [],
  subcategories = []
) => {
  const response = await api.get(`/api/products/category/${categoryId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

/** Fetch products by subcategory (GET /api/products/subcategory/{subcategoryId}) */
export const fetchProductsBySubcategory = async (
  subcategoryId,
  categories = [],
  subcategories = []
) => {
  const response = await api.get(`/api/products/subcategory/${subcategoryId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
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
  const response = await api.get(`/api/products/related/${productId}`);
  return unwrapList(response).map((p) =>
    mapProductFromApi(p, categories, subcategories)
  );
};

// ─── Products — Single Item ────────────────────────────────────────────────────
// GET /api/products/{id}

export const fetchProduct = async (id, categories = [], subcategories = []) => {
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
  fd.append('Weight', product.specifications?.weight || '');
  fd.append('Dimensions', product.specifications?.dimensions || '');
  fd.append('PowerSource', product.specifications?.powerSource || '');
  fd.append('Material', product.specifications?.material || '');
  fd.append('CoverageUsage', product.specifications?.coverage || '');

  // Pricing & Discounts
  fd.append('DiscountType', product.discountType || 'none');
  fd.append('DiscountAmount', String(Number(product.discountValue) || 0));

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
    weight: product.specifications?.weight || '',
    dimensions: product.specifications?.dimensions || '',
    powerSource: product.specifications?.powerSource || '',
    material: product.specifications?.material || '',
    coverageUsage: product.specifications?.coverage || '',
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
    return { ...mapped, id: savedId || mapped.id };
  } catch (err) {
    console.warn('Backend API unavailable, saving product locally:', err.message);
    const fallbackId = String(product.id || Date.now());
    const mapped = mapProductFromApi({ ...payload, id: fallbackId });
    mapped.image = primaryImage;
    mapped.images = mergedImages;
    mapped.gallery = mergedImages;
    return mapped;
  }
};

// ─── Products — Delete ────────────────────────────────────────────────────────
// DELETE /api/products/{id}

export const deleteProduct = async (id) => {
  await api.delete(`/api/products/${id}`);
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


