import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

const API_BASE = `${getApiDomain()}/api/Banners`;

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...getHeaders(),
    ...config.headers,
  };
  return config;
});

/**
 * GET /api/Banners/admin
 * Fetch all banners for admin panel
 */
export const fetchAdminBanners = async () => {
  const response = await api.get('/admin');
  return response.data;
};

/**
 * GET /api/Banners
 * Fetch active banners for public frontend
 */
export const fetchActiveBanners = async (type = '') => {
  const response = await api.get(type ? `?type=${type}` : '');
  return response.data;
};

/**
 * GET /api/Banners/{id}
 * Fetch single banner by ID
 */
export const fetchBannerById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

/**
 * POST /api/Banners
 * Create a new banner
 */
export const createBanner = async (bannerData) => {
  const response = await api.post('', bannerData);
  return response.data;
};

/**
 * PUT /api/Banners/{id}
 * Update an existing banner
 */
export const updateBanner = async (id, bannerData) => {
  const response = await api.put(`/${id}`, bannerData);
  return response.data;
};

/**
 * PUT /api/Banners/{id}/toggle
 * Toggle active status of a banner
 */
export const toggleBannerActive = async (id) => {
  const response = await api.put(`/${id}/toggle`);
  return response.data;
};

/**
 * DELETE /api/Banners/{id}
 * Delete a banner by ID
 */
export const deleteBanner = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

/**
 * POST /api/Banners/upload-image
 * Upload a banner image file
 */
export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
