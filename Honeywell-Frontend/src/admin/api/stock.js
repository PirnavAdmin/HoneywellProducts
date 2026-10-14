import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

export const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export const mapStockItemFromApi = (raw = {}) => {
  const currentStock = Number(raw.currentStock ?? raw.stockQuantity ?? raw.stock ?? 0);
  const reorderLevel = Number(raw.reorderLevel ?? raw.ReorderLevel ?? 0);
  
  // Force determine status regardless of what the backend string says
  let status = 'In Stock';
  if (currentStock === 0) {
    status = 'Out of Stock';
  } else if (currentStock <= reorderLevel) {
    status = 'Low Stock';
  } else {
    // If backend provided a specific status that isn't 'Low' or 'Out of', preserve it if needed
    // But typically we just want 'In Stock'
    status = 'In Stock';
  }

  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.replace(/[^0-9.]/g, '');
      return parseFloat(clean) || 0;
    }
    return 0;
  };

  let cp = parseAmount(raw.rawCostPrice ?? raw.costPrice ?? raw.CostPrice ?? raw.basePrice ?? 0);
  let sp = parseAmount(raw.rawSellingPrice ?? raw.sellingPrice ?? raw.SellingPrice ?? raw.price ?? 0);

  return {
    id: raw.id ?? raw.productId ?? '',
    sku: raw.sku || '',
    name: raw.productName || raw.name || '',
    category: raw.categoryName || raw.category || 'General',
    categoryId: raw.categoryId ?? '',
    subcategory: raw.subcategoryName || raw.subcategory || 'General',
    supplier: raw.supplierName || raw.supplier || 'Unknown',
    currentStock,
    reorderLevel,
    unit: raw.stockUnit || raw.unit || 'Pcs',
    costPrice: cp,
    sellingPrice: sp,
    status,
    lastUpdated: raw.lastUpdated ? raw.lastUpdated.slice(0, 10) : new Date().toISOString().slice(0, 10),
    trend: raw.trend || 'stable',
    change: Number(raw.change ?? 0),
  };
};

/**
 * Fetch Stock Ledger
 * GET /api/Stock/ledger
 */
export const getStockLedger = async (params = {}) => {
  const response = await api.get('/api/Stock/ledger', { params });
  const data = response.data;
  const list = Array.isArray(data) 
    ? data 
    : (Array.isArray(data?.Products) 
      ? data.Products 
      : (Array.isArray(data?.products) 
        ? data.products 
        : (Array.isArray(data?.data) 
          ? data.data 
          : (Array.isArray(data?.items) 
            ? data.items 
            : []))));
  return {
    items: list.map(mapStockItemFromApi),
    apiMetrics: data
  };
};

/**
 * Adjust stock for a product ID
 * POST /api/Stock/adjust/{productId}
 */
export const adjustStock = async (productId, adjustmentData) => {
  const payload = {
    actionType: adjustmentData.actionType || 'ADD', // 'Add' or 'Remove' or 'Set'
    quantity: Number(adjustmentData.quantity || 0),
    reason: adjustmentData.reason || '',
    note: adjustmentData.note || '',
  };

  if (adjustmentData.reorderLevel !== undefined && adjustmentData.reorderLevel !== null && adjustmentData.reorderLevel !== '') {
    payload.reorderLevel = Number(adjustmentData.reorderLevel);
  }
  if (adjustmentData.costPrice !== undefined && adjustmentData.costPrice !== null && adjustmentData.costPrice !== '') {
    payload.costPrice = Number(adjustmentData.costPrice);
  }
  if (adjustmentData.sellingPrice !== undefined && adjustmentData.sellingPrice !== null && adjustmentData.sellingPrice !== '') {
    payload.sellingPrice = Number(adjustmentData.sellingPrice);
  }

  const response = await api.post(`/api/Stock/adjust/${productId}`, payload);
  return response.data;
};

/**
 * Get adjustments list
 * GET /api/Stock/adjustments
 */
export const getStockAdjustments = async () => {
  const response = await api.get('/api/Stock/adjustments');
  return response.data;
};

/**
 * Create a new stock entry
 * POST /api/Stock/entry
 */
export const addStockEntry = async (entryData) => {
  // entryData should match NewStockEntryRequest schema:
  // { productName, sku, categoryId, subcategoryName, supplierName, initialStockQty, reorderLevel, stockUnit, costPrice, sellingPrice }
  const response = await api.post('/api/Stock/entry', {
    productName: entryData.productName,
    sku: entryData.sku,
    categoryId: entryData.categoryId ? Number(entryData.categoryId) : null,
    subcategoryName: entryData.subcategoryName || '',
    supplierName: entryData.supplierName || '',
    initialStockQty: Number(entryData.initialStockQty ?? 0),
    reorderLevel: Number(entryData.reorderLevel ?? 0),
    stockUnit: entryData.stockUnit || 'Pcs',
    costPrice: Number(entryData.costPrice ?? 0),
    sellingPrice: Number(entryData.sellingPrice ?? 0),
  });
  return response.data;
};
