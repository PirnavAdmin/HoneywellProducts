import { getApiDomain, resolveMediaUrl } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain}/api/Testimonials` : '/api/Testimonials';
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

export const resolveImageUrl = (url) => {
  return resolveMediaUrl(url);
};

/**
 * Fetch all testimonials (for Admin)
 * GET /api/Testimonials
 */
export async function getTestimonials() {
  const res = await fetch(getBaseUrl(), {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch testimonials: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch active testimonials (for Public Frontend)
 * GET /api/Testimonials/active
 */
export async function getActiveTestimonials() {
  return await apiCache.fetchWithCache('testimonials_active', async () => {
    const res = await fetch(`${getBaseUrl()}/active`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch active testimonials: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, 10 * 60 * 1000);
}

/**
 * Fetch single testimonial by ID
 * GET /api/Testimonials/{id}
 */
export async function getTestimonialById(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch testimonial ${id}: ${res.status}`);
  }
  return res.json();
}

/**
 * Create testimonial
 * POST /api/Testimonials
 */
export async function createTestimonial(data) {
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
    throw new Error(errText || `Failed to create testimonial: ${res.status}`);
  }

  apiCache.invalidate('testimonials');
  return res.json().catch(() => ({ success: true }));
}

/**
 * Update testimonial
 * PUT /api/Testimonials/{id}
 */
export async function updateTestimonial(id, data) {
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
    throw new Error(errText || `Failed to update testimonial ${id}: ${res.status}`);
  }

  apiCache.invalidate('testimonials');
  return res.json().catch(() => ({ success: true }));
}

/**
 * Delete testimonial
 * DELETE /api/Testimonials/{id}
 */
export async function deleteTestimonial(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Failed to delete testimonial ${id}: ${res.status}`);
  }

  apiCache.invalidate('testimonials');
  return true;
}
