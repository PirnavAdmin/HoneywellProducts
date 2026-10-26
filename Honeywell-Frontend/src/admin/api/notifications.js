import { getApiDomain } from '../../utils/apiConfig.js';
import { getAdminToken } from '../../utils/rbac.js';

export const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain.replace(/\/+$/, '')}/api/Notifications` : '/api/Notifications';
};

export const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  const token = getAdminToken() || sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const extractErrorMessage = async (response, fallbackMessage) => {
  try {
    const text = await response.text();
    if (!text) return `${fallbackMessage} (${response.status})`;
    try {
      const json = JSON.parse(text);
      if (typeof json === 'string') return json;
      if (json?.message) return json.message;
      if (json?.title) return json.title;
      if (json?.detail) return json.detail;
      if (json?.errors) {
        return Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      }
    } catch {
      return text.length < 150 ? text : `${fallbackMessage} (${response.status})`;
    }
  } catch {
    // fallback if stream reading fails
  }
  return `${fallbackMessage} (${response.status})`;
};

/**
 * GET /api/Notifications
 * Fetch all notifications ordered by CreatedAt descending
 */
export const getNotifications = async () => {
  const url = `${getBaseUrl()}?_t=${Date.now()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'Failed to fetch notifications');
    console.warn(`[getNotifications] Status ${response.status}: ${message}`);
    throw new Error(message);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

/**
 * GET /api/Notifications/unread-count
 * Get authoritative unread notifications count
 */
export const getUnreadCount = async () => {
  const url = `${getBaseUrl()}/unread-count?_t=${Date.now()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'Failed to fetch unread count');
    console.warn(`[getUnreadCount] Status ${response.status}: ${message}`);
    throw new Error(message);
  }

  const text = await response.text();
  const parsed = parseInt(text, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * PUT /api/Notifications/{id}/read
 * Mark a single notification as read (returns 204 No Content or 200)
 */
export const markAsRead = async (id) => {
  if (id === undefined || id === null) {
    throw new Error('Notification ID is required');
  }

  const response = await fetch(`${getBaseUrl()}/${id}/read`, {
    method: 'PUT',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok && response.status !== 204) {
    const message = await extractErrorMessage(response, `Failed to mark notification ${id} as read`);
    console.error(`[markAsRead] Error for id ${id}:`, message);
    throw new Error(message);
  }

  return { success: true };
};

/**
 * PUT /api/Notifications/mark-all-read
 * Mark all unread notifications as read (returns 204 No Content or 200)
 */
export const markAllAsRead = async () => {
  const response = await fetch(`${getBaseUrl()}/mark-all-read`, {
    method: 'PUT',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok && response.status !== 204) {
    const message = await extractErrorMessage(response, 'Failed to mark all notifications as read');
    console.error('[markAllAsRead] Error:', message);
    throw new Error(message);
  }

  return { success: true };
};

/**
 * DELETE /api/Notifications/{id}
 * Delete a specific notification (returns 204 No Content or 200)
 */
export const deleteNotification = async (id) => {
  if (id === undefined || id === null) {
    throw new Error('Notification ID is required');
  }

  const response = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok && response.status !== 204) {
    const message = await extractErrorMessage(response, `Failed to delete notification ${id}`);
    console.error(`[deleteNotification] Error for id ${id}:`, message);
    throw new Error(message);
  }

  return { success: true };
};

/**
 * DELETE /api/Notifications/clear-all
 * Clear all notifications (returns 204 No Content or 200)
 */
export const clearAllNotifications = async () => {
  const response = await fetch(`${getBaseUrl()}/clear-all`, {
    method: 'DELETE',
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok && response.status !== 204) {
    const message = await extractErrorMessage(response, 'Failed to clear all notifications');
    console.error('[clearAllNotifications] Error:', message);
    throw new Error(message);
  }

  return { success: true };
};
