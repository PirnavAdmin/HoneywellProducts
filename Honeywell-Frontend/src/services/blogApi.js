import { getApiDomain, DEFAULT_BACKEND_URL, resolveMediaUrl } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain}/api/Blog` : '/api/Blog';
};

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const resolveBlogImageUrl = (url) => {
  if (!url) return '';
  return resolveMediaUrl(url);
};

/**
 * GET /api/Blog
 * Fetch all blog articles
 */
export async function getBlogs() {
  return await apiCache.fetchWithCache('blogs_all', async () => {
    const res = await fetch(getBaseUrl(), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch blogs: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, 10 * 60 * 1000);
}

/**
 * GET /api/Blog/{id}
 * Fetch single blog article by ID
 */
export async function getBlogById(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch blog ${id}: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/Blog
 * Create a new blog article
 */
export async function createBlog(data) {
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Failed to create blog: ${res.status}`);
  }

  apiCache.invalidate('blogs');
  return res.json().catch(() => ({ success: true }));
}

/**
 * PUT /api/Blog/{id}
 * Update an existing blog article
 */
export async function updateBlog(id, data) {
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'PUT',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Failed to update blog ${id}: ${res.status}`);
  }

  apiCache.invalidate('blogs');
  return res.json().catch(() => ({ success: true }));
}

/**
 * DELETE /api/Blog/{id}
 * Delete a blog article by ID
 */
export async function deleteBlog(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Failed to delete blog ${id}: ${res.status}`);
  }

  apiCache.invalidate('blogs');
  return true;
}
