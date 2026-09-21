import { quoteService } from '../../services/quoteService';

/** GET /api/quotes — Fetch all live quote requests */
export const getQuotes = async () => {
  return await quoteService.getAll();
};

/** GET /api/quotes/{id} — Fetch single quote request by ID */
export const getQuoteById = async (id) => {
  return await quoteService.getById(id);
};

/** POST /api/quotes — Create a new quote request */
export const createQuote = async (payload) => {
  return await quoteService.submit(payload);
};

/** PUT /api/quotes/{id} — Update quote amount/status/details */
export const updateQuote = async (id, updateData) => {
  return await quoteService.update(id, updateData);
};

/** DELETE /api/quotes/{id} — Delete a quote request */
export const deleteQuote = async (id) => {
  return await quoteService.delete(id);
};
