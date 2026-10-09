import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Tickets`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const mapServerTicketToFrontend = (st) => {
  if (!st) return null;
  const stId = String(st.id ?? '');
  
  let status = st.status || st.ticketStatus || 'Open';
  if (status === 'InProgress') status = 'In Progress';
  
  let type = 'general';
  const src = (st.sourceType || st.type || '').toLowerCase();
  if (src.includes('order')) type = 'order_related';
  else if (src.includes('chat')) type = 'chatbot';

  let orderId = 'N/A';
  if (st.orderReference) orderId = String(st.orderReference).replace('#', '');
  else if (st.orderId) orderId = String(st.orderId);

  return {
    id: stId,
    ticketNo: st.ticketId || `TCK-${stId}`,
    customer: st.name || st.customerName || 'Customer',
    email: st.email || '',
    phone: st.phone || '',
    issue: st.message || st.subject || 'No Description',
    subject: st.subject || '',
    priority: st.priority || 'Medium',
    status: status,
    assignedTo: st.assignedAgent || st.assignedTo || 'Unassigned',
    type: type,
    orderId: orderId,
    notes: st.auditNote || st.notes || '',
    createdAt: st.createdAt || new Date().toISOString(),
    chatHistory: st.chatHistory || []
  };
};

/** GET /api/Tickets — Fetch all live tickets */
export const getTickets = async () => {
  try {
    const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch tickets (${response.status})`);
    const serverTickets = await response.json();
    
    const serverList = serverTickets && Array.isArray(serverTickets.tickets) 
      ? serverTickets.tickets 
      : (Array.isArray(serverTickets) ? serverTickets : []);

    return serverList.map(mapServerTicketToFrontend).filter(Boolean);
  } catch (err) {
    console.warn("Tickets API fetch error:", err.message);
    return [];
  }
};

/** GET /api/Tickets/{id} — Fetch single ticket */
export const getTicketById = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch ticket ${id} (${response.status})`);
  const data = await response.json();
  return mapServerTicketToFrontend(data.ticket || data);
};

/** POST /api/Tickets — Create ticket */
export const createTicket = async (payload) => {
  const apiPayload = {
    name: payload.customer || payload.name || 'Customer',
    email: payload.email || '',
    phone: payload.phone || '',
    subject: payload.subject || payload.issue || 'Support Request',
    message: payload.issue || payload.message || 'No Description',
    sourceType: payload.type === 'order_related' ? 'Order-Related' : payload.type === 'chatbot' ? 'Chatbot' : 'General',
    orderReference: payload.orderId && payload.orderId !== 'N/A' ? `#${payload.orderId}` : null,
    priority: payload.priority || 'Medium',
    status: payload.status === 'In Progress' ? 'InProgress' : (payload.status || 'Open'),
    assignedAgent: payload.assignedTo === 'Unassigned' ? null : payload.assignedTo,
    auditNote: payload.notes || 'No notes added'
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(apiPayload)
  });

  if (!response.ok) throw new Error(`Failed to create ticket (${response.status})`);
  const serverTicket = await response.json();
  return mapServerTicketToFrontend(serverTicket);
};

/** PUT /api/Tickets/{id} — Update ticket */
export const updateTicket = async (id, updatedFields) => {
  let currentObj = {};
  try {
    const detailData = await getTicketById(id);
    if (detailData) currentObj = detailData;
  } catch (e) {
    console.warn("Could not fetch pre-update ticket details:", e.message);
  }

  const merged = { ...currentObj, ...updatedFields };

  let status = merged.status || 'Open';
  if (status === 'In Progress') status = 'InProgress';

  const apiPayload = {
    id: Number(id),
    ticketId: merged.ticketNo || `TCK-${id}`,
    name: merged.customer || merged.name || 'Customer',
    email: merged.email || '',
    phone: merged.phone || '',
    subject: merged.subject || merged.issue || 'Support Request',
    message: merged.issue || merged.message || '',
    sourceType: merged.type === 'order_related' ? 'Order-Related' : merged.type === 'chatbot' ? 'Chatbot' : 'General',
    orderReference: merged.orderId && merged.orderId !== 'N/A' ? `#${merged.orderId}` : null,
    priority: merged.priority || 'Medium',
    status: status,
    assignedAgent: merged.assignedTo === 'Unassigned' ? null : merged.assignedTo,
    auditNote: merged.notes || 'No notes added'
  };

  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(apiPayload)
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to update ticket ${id} (${response.status})`);
  }

  return mapServerTicketToFrontend(apiPayload);
};

/** DELETE /api/Tickets/{id} — Delete ticket */
export const deleteTicket = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete ticket ${id} (${response.status})`);
  }
  return true;
};
