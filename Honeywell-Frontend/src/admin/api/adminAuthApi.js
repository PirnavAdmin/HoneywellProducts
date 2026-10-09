import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

const HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json'
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    ...HEADERS,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const adminAuthApi = {
  // Login credentials check -> triggers OTP on backend
  async login(email, password) {
    const payload = { email: email.trim(), password };
    const response = await axios.post(`${getApiDomain()}/api/Auth/login`, payload, {
      headers: HEADERS,
      timeout: 15000
    });
    return response.data;
  },

  // Verify OTP -> returns token & user details
  async verifyOtp(email, otp) {
    const payload = { email: email.trim(), otp: String(otp).trim(), otpCode: String(otp).trim() };
    const response = await axios.post(`${getApiDomain()}/api/Auth/verify-otp`, payload, {
      headers: HEADERS,
      timeout: 15000
    });
    return response.data;
  },

  // Resend OTP
  async resendOtp(email) {
    const payload = { email: email.trim() };
    const response = await axios.post(`${getApiDomain()}/api/Auth/resend-otp`, payload, {
      headers: HEADERS,
      timeout: 15000
    });
    return response.data;
  },

  // Request password reset email/code
  async forgotPassword(email) {
    const payload = { email: email.trim() };
    const response = await axios.post(`${getApiDomain()}/api/Auth/forgot-password`, payload, {
      headers: HEADERS,
      timeout: 15000
    });
    return response.data;
  },

  // Reset password with token/code
  async resetPassword(payload) {
    const response = await axios.post(`${getApiDomain()}/api/Auth/reset-password`, payload, {
      headers: HEADERS,
      timeout: 15000
    });
    return response.data;
  },

  // Create new user (Admin portal)
  async createUser(userData) {
    const response = await axios.post(`${getApiDomain()}/api/Auth/create-user`, userData, {
      headers: getAuthHeaders(),
      timeout: 15000
    });
    return response.data;
  },

  // Get Admin Profile
  async getProfile() {
    const response = await axios.get(`${getApiDomain()}/api/AdminProfile`, {
      headers: getAuthHeaders(),
      timeout: 10000
    });
    return response.data;
  },

  // Update Admin Profile
  async updateProfile(profileData) {
    const response = await axios.put(`${getApiDomain()}/api/AdminProfile`, profileData, {
      headers: getAuthHeaders(),
      timeout: 15000
    });
    return response.data;
  },

  // Create Admin Profile
  async createProfile(profileData) {
    const response = await axios.post(`${getApiDomain()}/api/AdminProfile`, profileData, {
      headers: getAuthHeaders(),
      timeout: 15000
    });
    return response.data;
  },

  // Get Admin Settings
  async getSettings() {
    const response = await axios.get(`${getApiDomain()}/api/AdminProfile/settings`, {
      headers: getAuthHeaders(),
      timeout: 10000
    });
    return response.data;
  },

  // Update Admin Settings
  async updateSettings(settingsData) {
    const response = await axios.put(`${getApiDomain()}/api/AdminProfile/settings`, settingsData, {
      headers: getAuthHeaders(),
      timeout: 15000
    });
    return response.data;
  },

  // Create Admin Settings
  async createSettings(settingsData) {
    const response = await axios.post(`${getApiDomain()}/api/AdminProfile/settings`, settingsData, {
      headers: getAuthHeaders(),
      timeout: 15000
    });
    return response.data;
  }
};
