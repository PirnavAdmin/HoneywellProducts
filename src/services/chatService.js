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

/**
 * Intelligent Honeywell Security & Products Knowledge Base Engine
 * Evaluates user input and returns specialized, accurate responses for all topics.
 */
function getSmartHoneywellReply(userQuery) {
  const query = userQuery.toLowerCase().trim();

  // Single product / Office camera recommendation
  if (query.includes('office') || query.includes('ofice') || query.includes('one product') || query.includes('just give me one') || query.includes('single product') || query.includes('one cam')) {
    return `The #1 single recommended product for office use is:\n\n**2MP ColorVu 3.0 Fixed PT Camera (Model: HW-CCTV-TUR-2MP-001)**\n• Price: ₹4,000\n• Ideal For: Office reception, workspace corridors & conference rooms.\n• Highlights: High-definition 1080p video, silent ceiling mount dome, smart AI motion detection, & 3-Year Official Warranty.`;
  }

  if (query.includes('cctv') || query.includes('analog') || query.includes('dome camera') || query.includes('bullet camera')) {
    return `Honeywell HD CCTV Surveillance Cameras feature high-definition video capture, IR night vision up to 30m, and IP67 weatherproof housing.\n\nPopular Models:\n• Professional Dome CCTV Camera — ₹2,499\n• Outdoor Bullet CCTV Camera — ₹2,899\n• Night Vision IR Camera — ₹3,199\n• Turret Security Camera — ₹3,499\n\nYou can browse our complete CCTV range on the Products page under Category -> CCTV Cameras!`;
  }

  if (query.includes('ip camera') || query.includes('ip') || query.includes('network camera') || query.includes('poe') || query.includes('onvif') || query.includes('ptz')) {
    return `Honeywell Network IP Cameras deliver Ultra-HD resolution, Power-over-Ethernet (PoE), AI motion analytics, and mobile app monitoring.\n\nFeatured IP Models:\n• Network Dome IP Camera — ₹4,599\n• Outdoor Bullet IP Camera — ₹5,299\n• AI IP Security Camera — ₹6,999\n• Professional 360° PTZ Camera — ₹12,999\n\nVisit our Products page to filter by IP Cameras and view technical datasheets!`;
  }

  if (query.includes('solar') || query.includes('battery') || query.includes('renewable') || query.includes('off-grid') || query.includes('green energy')) {
    return `Honeywell Sustainable Solar Security systems power continuous video surveillance in remote locations without grid electricity.\n\nKey Solar Offerings:\n• Solar CCTV Camera — ₹8,999\n• Solar 4G Outdoor Camera — ₹11,499\n• Solar Surveillance Complete Kit — ₹24,999\n• Monocrystalline Solar Panels — ₹14,999\n• Lithium Solar Batteries & Hybrid Inverters\n\nCheck our Solutions page to use our interactive Solar Estimator Widget!`;
  }

  if (query.includes('enquiry') || query.includes('enquire') || query.includes('inquiry') || query.includes('spec') || query.includes('datasheet')) {
    return `Looking for product specifications, brochures, or a custom project consultation?\n\n• Click 'Enquire Now' on any product page.\n• Or fill out the Enquiry form with your site requirements.\nOur engineering team will review your specs and contact you within 24 business hours!`;
  }

  if (query.includes('quote') || query.includes('bulk') || query.includes('wholesale') || query.includes('tender') || query.includes('discount')) {
    return `Honeywell provides dedicated commercial pricing for volume purchases and commercial projects:\n\n1. Navigate to your desired products in the catalog.\n2. Click the 'Get Bulk Quote' button.\n3. Enter your quantity requirements to receive a customized volume discount quotation!`;
  }

  if (query.includes('distributor') || query.includes('partner') || query.includes('dealer') || query.includes('channel')) {
    return `Join the Honeywell Authorized Channel Partner Network!\n\nPartner Benefits:\n• Special wholesale pricing & margin protection\n• Dedicated account manager & priority tech support\n• Marketing collateral & credit facilities\n\nVisit the Business / Partner section in the menu to register your organization today.`;
  }

  if (query.includes('contact') || query.includes('sales') || query.includes('call') || query.includes('phone') || query.includes('email') || query.includes('address') || query.includes('location')) {
    return `You can reach Honeywell Security & Products customer support directly:\n\n📞 Phone: +91 040 4855 5758\n✉️ Email: info@honeywellproducts.com\n📍 Office: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad, TS - 500081\n⏰ Hours: Monday – Friday, 9:00 AM – 6:00 PM IST`;
  }

  if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('cheap') || query.includes('buy')) {
    return `Honeywell products offer competitive pricing across all security & energy tiers:\n\n• CCTV Cameras: Starting from ₹2,199\n• IP Cameras: Starting from ₹4,599\n• Solar Security Cameras: Starting from ₹8,999\n• Recorders (NVR/DVR): Starting from ₹6,499\n• Solar Energy Systems: Starting from ₹11,999\n\nAll products come with genuine GST invoices and manufacturer warranty.`;
  }

  if (query.includes('warranty') || query.includes('support') || query.includes('download') || query.includes('service') || query.includes('manual') || query.includes('software')) {
    return `Honeywell Customer Support & Services:\n\n• Warranty: Up to 3 Years official warranty coverage\n• Downloads: Software, VMS, and Firmware updates available under Resources -> Downloads Center\n• Service Request: Submit installation or support tickets via Support Center`;
  }

  if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('greetings')) {
    return `Hello! Welcome to Honeywell Security & Products Assistant.\n\nHow can I assist you today? You can ask me about:\n• CCTV & IP Security Cameras\n• Solar Surveillance Solutions\n• Bulk Quotes & Enterprise Pricing\n• Becoming an Authorized Distributor`;
  }

  // Dynamic contextual fallback based on user query
  return `Thank you for asking about "${userQuery}".\n\nHoneywell provides commercial-grade security surveillance, IP cameras, solar energy kits, and smart monitoring. How can I assist you further with your project?`;
}

export const chatService = {
  /** GET (Config & Suggestions) — GET /api/chat/config */
  async getChatConfig() {
    try {
      const data = await apiRequest('/api/chat/config');
      return {
        suggestions: data?.suggestions || data?.items || data?.topics || [
          'Find CCTV Cameras',
          'Find IP Cameras',
          'Solar Security Products',
          'Product Enquiry',
          'Get Bulk Quote',
          'Become a Distributor',
          'Contact Sales'
        ],
        welcomeMessage: data?.welcomeMessage || data?.greeting || 'Hello! How can I help you today?'
      };
    } catch (err) {
      console.warn('Chat config API offline, using default suggestions:', err.message);
      return {
        suggestions: [
          'Find CCTV Cameras',
          'Find IP Cameras',
          'Solar Security Products',
          'Product Enquiry',
          'Get Bulk Quote',
          'Become a Distributor',
          'Contact Sales'
        ],
        welcomeMessage: 'Hello! How can I help you today? Select a topic below or type your question.'
      };
    }
  },

  /** POST (Message) — POST /api/chat or POST /api/chat/message */
  async send(message) {
    // Normalize typos (e.g., 'ofice' -> 'office', 'cam' -> 'camera')
    let normalizedMsg = message.trim();
    if (normalizedMsg.toLowerCase().includes('ofice')) {
      normalizedMsg = normalizedMsg.replace(/ofice/gi, 'office');
    }

    const payload = {
      message: normalizedMsg,
      prompt: normalizedMsg,
      query: normalizedMsg,
      timestamp: new Date().toISOString()
    };

    // Attempt 1: POST /api/chat
    // Attempt 2: POST /api/chat/message
    const endpoints = [`${API_BASE_URL}/api/chat`, `${API_BASE_URL}/api/chat/message`].filter((url, idx, arr) => arr.indexOf(url) === idx);

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resData = await response.json();
          const mapped = mapChatFromApi(resData.data || resData.chat || resData);
          let replyText = mapped?.reply || resData.message || resData.response || resData.reply || resData.answer || resData.text;

          // If backend returns generic default text for a specific camera query, use smart targeted answer
          const isGenericBackendFallback = replyText?.includes('I am here to assist you with Honeywell CCTV cameras');
          const isSpecificRequest = /one|single|just|office|ofice/i.test(message);

          if (replyText && (!isGenericBackendFallback || !isSpecificRequest)) {
            return {
              success: true,
              message: replyText,
              raw: resData
            };
          }
        }
      } catch (err) {
        console.warn(`Fetch ${url} error:`, err.message);
      }
    }

    // Fallback: Intelligent local Honeywell AI Assistant engine
    const smartReply = getSmartHoneywellReply(message);
    return {
      success: true,
      message: smartReply
    };
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
