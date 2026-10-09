import { getApiDomain } from '../../utils/apiConfig';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain}/api/Notifications` : '/api/Notifications';
};

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * GET /api/Notifications
 * Fetch all notifications for the current admin user / system
 */
export const getNotifications = async () => {
  try {
    const response = await fetch(getBaseUrl(), {
      headers: getHeaders(),
    });
    if (!response.ok) {
      console.warn(`[getNotifications] Status ${response.status}`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[getNotifications] Error:', e);
    return [];
  }
};

/**
 * GET /api/Notifications/unread-count
 * Get current unread notifications count
 */
export const getUnreadCount = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/unread-count`, {
      headers: getHeaders(),
    });
    if (!response.ok) return 0;
    const text = await response.text();
    return parseInt(text, 10) || 0;
  } catch (e) {
    console.error('[getUnreadCount] Error:', e);
    return 0;
  }
};

/**
 * PUT /api/Notifications/{id}/read
 * Mark a single notification as read (returns 204 No Content or 200)
 */
export const markAsRead = async (id) => {
  try {
    const response = await fetch(`${getBaseUrl()}/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed with status ${response.status}`);
    }
    return { success: true };
  } catch (e) {
    console.error(`[markAsRead] Error for id ${id}:`, e);
    throw e;
  }
};

/**
 * PUT /api/Notifications/mark-all-read
 * Mark all notifications as read (returns 204 No Content or 200)
 */
export const markAllAsRead = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/mark-all-read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed with status ${response.status}`);
    }
    return { success: true };
  } catch (e) {
    console.error('[markAllAsRead] Error:', e);
    throw e;
  }
};

/**
 * DELETE /api/Notifications/{id}
 * Delete a specific notification (returns 204 No Content or 200)
 */
export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${getBaseUrl()}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed with status ${response.status}`);
    }
    return { success: true };
  } catch (e) {
    console.error(`[deleteNotification] Error for id ${id}:`, e);
    throw e;
  }
};

/**
 * DELETE /api/Notifications/clear-all
 * Clear all notifications (returns 204 No Content or 200)
 */
export const clearAllNotifications = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/clear-all`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed with status ${response.status}`);
    }
    return { success: true };
  } catch (e) {
    console.error('[clearAllNotifications] Error:', e);
    throw e;
  }
};
