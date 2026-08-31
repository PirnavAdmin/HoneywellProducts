import { getApiDomain } from '../../utils/apiConfig';
import { 
  getSubcategories, 
  saveSubcategories, 
  upsertSubcategory 
} from './catalogStore';

const BASE_URL = getApiDomain();

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
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
export const mapSubcategory = (raw = {}) => ({
  id: String(raw.id ?? raw.subcategoryId ?? ''),
  categoryId: String(raw.categoryId ?? ''),
  name: raw.name || raw.subcategoryName || raw.subcategory_name || '',
  slug: raw.slug || '',
  description: raw.description || '',
  status: raw.isActive === false ? 'Inactive' : 'Active',
  displayOrder: raw.displayOrder ?? '',
  image: raw.imageUrl || raw.image || '',
  imageUrl: raw.imageUrl || '',
  categoryName: raw.categoryName || '',
  products: raw.products || [],
});

export const fetchSubcategories = async () => {
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data?.data || data?.items || []);
        const mapped = list.map(mapSubcategory);
        if (mapped.length > 0) saveSubcategories(mapped);
        return mapped.length > 0 ? mapped : getSubcategories();
      }
    } catch (err) {}
  }
  return getSubcategories();
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
  
  const list = getSubcategories();
  const found = list.find(s => String(s.id) === String(id));
  if (found) return found;
  throw new Error(`Subcategory with ID ${id} not found`);
};

export const createSubcategory = async (payload) => {
  const bodyData = {
    categoryId: Number(payload.categoryId) || 0,
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    displayOrder: Number(payload.displayOrder) || 0,
    isActive: payload.status !== 'Inactive' && payload.isActive !== false,
  };

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
        const saved = mapSubcategory(data?.data || data);
        const result = {
          ...saved,
          categoryId: saved.categoryId || String(payload.categoryId),
        };
        upsertSubcategory(result);
        return result;
      }
    } catch (err) {}
  }

  return upsertSubcategory(payload);
};

export const updateSubcategory = async (id, payload) => {
  const bodyData = {
    id: Number(id) || Number(payload.id) || 0,
    categoryId: Number(payload.categoryId) || 0,
    name: payload.name || '',
    slug: payload.slug || '',
    description: payload.description || '',
    displayOrder: Number(payload.displayOrder) || 0,
    isActive: payload.status !== 'Inactive' && payload.isActive !== false,
  };

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
        const saved = mapSubcategory(data?.data || data);
        const result = {
          ...saved,
          id: saved.id || String(id),
          categoryId: saved.categoryId || String(payload.categoryId),
          name: saved.name || payload.name,
          slug: saved.slug || payload.slug,
          description: saved.description || payload.description,
          status: payload.status || 'Active'
        };
        upsertSubcategory(result);
        return result;
      }
    } catch (err) {}
  }

  return upsertSubcategory({ ...payload, id });
};

export const deleteSubcategory = async (id) => {
  for (const path of CANDIDATE_PATHS) {
    try {
      const response = await fetch(`${BASE_URL}${path}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        break;
      }
    } catch (err) {}
  }

  const filtered = getSubcategories().filter((s) => String(s.id) !== String(id));
  saveSubcategories(filtered);
  return true;
};

