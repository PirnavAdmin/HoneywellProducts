import { getApiDomain } from '../utils/apiConfig';

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
    const cleanBase = (getApiDomain() || '').replace(/\/$/, '');
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
  const cleanBase = (getApiDomain() || '').replace(/\/$/, '');
  if (!cleanBase) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
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
  const res = await fetch(`${getBaseUrl()}/active`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch active testimonials: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

  return true;
}
