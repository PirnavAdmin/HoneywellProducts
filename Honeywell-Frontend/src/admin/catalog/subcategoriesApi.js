import { getApiDomain } from '../../utils/apiConfig';
import { apiCache } from '../../utils/apiCache';
import { 
  getSubcategories, 
  saveSubcategories, 
  upsertSubcategory,
  getSubcategoryMetadataOverrides,
  saveSubcategoryMetadataOverride,
  removeSubcategoryMetadataOverride,
} from './catalogStore';

const BASE_URL = getApiDomain();

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const getHeaders = () => {
  const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('adminToken') : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null);
  const headers = { ...DEFAULT_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Candidate paths for Subcategory APIs
const CANDIDATE_PATHS = [
  '/api/Subcategory',
  '/api/Subcategories',
  '/api/Catalog/subcategories'
];

/** Map raw API subcategory object to clean UI format */
export const mapSubcategory = (raw = {}) => {
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
    name: raw.name || raw.subcategoryName || raw.subcategory_name || raw.Name || '',
    slug: raw.slug || raw.Slug || '',
    description: raw.description || raw.Description || '',
    status: isInactive ? 'Inactive' : 'Active',
    isActive: !isInactive,
    displayOrder: displayOrder,
    image: raw.imageUrl || raw.image || raw.ImageUrl || '',
    imageUrl: raw.imageUrl || raw.ImageUrl || '',
    categoryName: raw.categoryName || raw.CategoryName || '',
    products: raw.products || raw.Products || [],
  };
};

export const fetchSubcategories = async (forceRefresh = false) => {
  if (forceRefresh) {
    try {
      apiCache.invalidate('subcategor');
      apiCache.clear();
    } catch (e) {}
  }

  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data?.data || data?.items || []);
        const mappedList = list.map(mapSubcategory);
        return mappedList.sort((a, b) => {
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
      }
    } catch (err) {}
  }
  return [];
};

export const fetchSubcategoryById = async (id) => {
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}/${id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return mapSubcategory(data?.data || data);
      }
    } catch (err) {}
  }
  
  throw new Error(`Subcategory with ID ${id} not found on server.`);
};

export const createSubcategory = async (payload) => {
  const displayOrderVal = payload.displayOrder !== undefined && payload.displayOrder !== null && payload.displayOrder !== '' && !isNaN(Number(payload.displayOrder))
    ? Number(payload.displayOrder)
    : 0;
  const isActive = payload.status !== 'Inactive' && payload.isActive !== false;

  const bodyData = {
    categoryId: Number(payload.categoryId) || 0,
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    displayOrder: displayOrderVal,
    isActive: isActive,
    status: isActive ? 'Active' : 'Inactive',
  };

  let saved = null;
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyData)
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        saved = mapSubcategory(data?.data || data);
        break;
      }
    } catch (err) {}
  }

  const result = saved || {
    id: String(Date.now()),
    categoryId: String(payload.categoryId || ''),
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
  };

  result.displayOrder = displayOrderVal;
  result.status = isActive ? 'Active' : 'Inactive';
  result.isActive = isActive;
  result.categoryId = result.categoryId || String(payload.categoryId || '');

  if (result.id) {
    saveSubcategoryMetadataOverride(result.id, {
      displayOrder: displayOrderVal,
      status: result.status,
      isActive: isActive,
    });
  }

  try {
    apiCache.invalidate('subcategor');
    apiCache.clear();
  } catch (e) {}

  return result;
};

export const updateSubcategory = async (id, payload) => {
  const displayOrderVal = payload.displayOrder !== undefined && payload.displayOrder !== null && payload.displayOrder !== '' && !isNaN(Number(payload.displayOrder))
    ? Number(payload.displayOrder)
    : 0;
  const isActive = payload.status !== 'Inactive' && payload.isActive !== false;

  const bodyData = {
    id: Number(id) || Number(payload.id) || 0,
    categoryId: Number(payload.categoryId) || 0,
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    displayOrder: displayOrderVal,
    isActive: isActive,
    status: isActive ? 'Active' : 'Inactive',
  };

  if (id) {
    saveSubcategoryMetadataOverride(id, {
      displayOrder: displayOrderVal,
      status: isActive ? 'Active' : 'Inactive',
      isActive: isActive,
    });
  }

  let saved = null;
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(bodyData)
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        saved = mapSubcategory(data?.data || data);
        break;
      }
    } catch (err) {}
  }

  const result = saved || {
    id: String(id),
    categoryId: String(payload.categoryId || ''),
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
  };

  result.id = String(id);
  result.displayOrder = displayOrderVal;
  result.status = isActive ? 'Active' : 'Inactive';
  result.isActive = isActive;
  result.categoryId = result.categoryId || String(payload.categoryId || '');

  saveSubcategoryMetadataOverride(result.id, {
    displayOrder: displayOrderVal,
    status: result.status,
    isActive: isActive,
  });

  try {
    apiCache.invalidate('subcategor');
    apiCache.clear();
  } catch (e) {}

  return result;
};

export const deleteSubcategory = async (id) => {
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        removeSubcategoryMetadataOverride(id);
        try {
          apiCache.invalidate('subcategor');
          apiCache.clear();
        } catch (e) {}
        return true;
      }
    } catch (err) {}
  }
  removeSubcategoryMetadataOverride(id);
  try {
    apiCache.invalidate('subcategor');
    apiCache.clear();
  } catch (e) {}
  return true;
};
