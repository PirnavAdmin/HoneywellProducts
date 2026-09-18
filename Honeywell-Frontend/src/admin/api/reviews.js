import { reviewService } from '../../services/reviewService';

/** GET /api/reviews/{productId} — Fetch reviews for a product */
export const getReviewsByProduct = async (productId) => {
  return await reviewService.getByProduct(productId);
};

/** GET /api/reviews/item/{id} — Fetch single review by ID */
export const getReviewById = async (id) => {
  return await reviewService.getById(id);
};

/** POST /api/reviews — Create a new review */
export const createReview = async (payload) => {
  return await reviewService.submit(payload);
};

/** PUT /api/reviews/{id} — Update review rating/comment/details */
export const updateReview = async (id, updateData) => {
  return await reviewService.update(id, updateData);
};

/** DELETE /api/reviews/{id} — Delete a review */
export const deleteReview = async (id) => {
  return await reviewService.delete(id);
};
