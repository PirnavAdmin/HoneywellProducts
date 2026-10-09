import { chatService } from '../../services/chatService';

/** GET /api/chat — fetch all chat logs */
export const getAllChats = async () => {
  return await chatService.getAllChats();
};

/** GET /api/chat/{id} — fetch single chat log */
export const getChatById = async (id) => {
  return await chatService.getChatById(id);
};

/** POST /api/chat/message — send chat query */
export const sendChatMessage = async (message) => {
  return await chatService.send(message);
};

/** PUT /api/chat/{id} — update chat log */
export const updateChat = async (id, updates) => {
  return await chatService.updateChat(id, updates);
};

/** DELETE /api/chat/{id} — delete chat log entry */
export const deleteChat = async (id) => {
  return await chatService.deleteChat(id);
};
