import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Notifications`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// GET /api/Notifications - fetch all notifications
export const getNotifications = async () => {
  try {
    const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    return [];
  }
};

// GET /api/Notifications/unread-count - get unread count
export const getUnreadCount = async () => {
  try {
    const response = await fetch(`${BASE_URL}/unread-count`, { headers: DEFAULT_HEADERS });
    if (!response.ok) return 0;
    const text = await response.text();
    return parseInt(text, 10) || 0;
  } catch (e) {
    return 0;
  }
};

// PUT /api/Notifications/{id}/read - mark a notification as read (returns 204 NoContent)
export const markAsRead = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}/read`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
    });
    if (!response.ok && response.status !== 204) throw new Error(`Status ${response.status}`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
};

// PUT /api/Notifications/mark-all-read - mark all notifications as read (returns 204 NoContent)
export const markAllAsRead = async () => {
  try {
    const response = await fetch(`${BASE_URL}/mark-all-read`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
    });
    if (!response.ok && response.status !== 204) throw new Error(`Status ${response.status}`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
};

// DELETE /api/Notifications/{id} - delete a specific notification (returns 204 NoContent)
export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS,
    });
    if (!response.ok && response.status !== 204) throw new Error(`Status ${response.status}`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
};

// DELETE /api/Notifications/clear-all - clear all notifications (returns 204 NoContent)
export const clearAllNotifications = async () => {
  try {
    const response = await fetch(`${BASE_URL}/clear-all`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS,
    });
    if (!response.ok && response.status !== 204) throw new Error(`Status ${response.status}`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
};
