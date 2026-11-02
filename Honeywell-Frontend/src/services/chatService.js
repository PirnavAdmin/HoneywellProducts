import { apiRequest, API_BASE_URL } from './api';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const mapChatFromApi = (item) => {
  if (!item) return null;
  const rawId = item.id ?? item.chatId ?? item._id ?? '';
  return {
    id: String(rawId),
    message: item.message || item.userMessage || item.query || item.prompt || '',
    reply: item.reply || item.response || item.aiResponse || item.answer || item.text || '',
    sender: item.sender || item.role || 'user',
    status: item.status || 'Success',
    createdAt: item.createdAt || item.timestamp || item.dateCreated || new Date().toISOString()
  };
};

export const chatService = {
  /** POST (Message) — POST /api/chat/message */
  async send(message) {
    const url = `${API_BASE_URL}/api/chat/message`;
    const payload = {
      message: message.trim(),
      prompt: message.trim(),
      query: message.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Chat API request failed (${response.status})`);
      }

      const resData = await response.json();
      const mapped = mapChatFromApi(resData.data || resData.chat || resData);
      
      const replyText = mapped?.reply || resData.message || resData.response || resData.reply || resData.answer || resData.text || 'I have received your request. How else can I assist you today?';
      
      return {
        success: true,
        message: replyText,
        products: resData.products || resData.data?.products || [],
        suggestedActions: resData.suggestedActions || resData.data?.suggestedActions || [],
        raw: resData
      };
    } catch (err) {
      console.warn('Chat API send error:', err.message);
      return {
        success: false,
        message: 'I am unable to reach the server right now. Please ensure the backend service is running, or contact us directly at support@honeywell.com.',
        error: err.message
      };
    }
  },

  /** GET (All) — GET /api/chat */
  async getAllChats() {
    try {
      const data = await apiRequest('/api/chat');
      const list = Array.isArray(data) ? data : (data.chats || data.items || data.history || data.data || []);
      return list.map(mapChatFromApi).filter(Boolean);
    } catch (err) {
      console.warn('Chat API getAllChats error:', err.message);
      return [];
    }
  },

  /** GET (ById) — GET /api/chat/{id} */
  async getChatById(id) {
    if (!id) return null;
    try {
      const data = await apiRequest(`/api/chat/${id}`);
      return mapChatFromApi(data.chat || data.data || data);
    } catch (err) {
      console.warn(`Chat API getChatById(${id}) error:`, err.message);
      throw err;
    }
  },

  /** PUT (Update) — PUT /api/chat/{id} */
  async updateChat(id, updates) {
    const url = `${API_BASE_URL}/api/chat/${id}`;
    const payload = {
      id: isNaN(Number(id)) ? id : Number(id),
      message: updates.message || '',
      reply: updates.reply || updates.response || '',
      sender: updates.sender || 'user',
      status: updates.status || 'Updated'
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to update chat log ${id} (${response.status})`);
    }

    return payload;
  },

  /** DELETE — DELETE /api/chat/{id} */
  async deleteChat(id) {
    const url = `${API_BASE_URL}/api/chat/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete chat log ${id} (${response.status})`);
    }

    return true;
  }
};
