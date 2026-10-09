const REVIEWS_KEY = 'sat_catalog_reviews';

export const initialReviews = [];

const MOCK_REVIEW_IDS = new Set(['rev-101', 'rev-102', 'rev-201', 'rev-301', 'rev-401']);

const isStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

export const getReviewsFromStore = () => {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any legacy mock reviews
    const cleaned = parsed.filter(
      (r) => !MOCK_REVIEW_IDS.has(String(r.id)) && !String(r.id || '').startsWith('rev-10') && !String(r.id || '').startsWith('rev-20') && !String(r.id || '').startsWith('rev-30') && !String(r.id || '').startsWith('rev-40')
    );
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.warn('Error reading reviews from localStorage:', err);
    return [];
  }
};

export const getReviewsByProductIdFromStore = (productId) => {
  if (!productId) return [];
  const all = getReviewsFromStore();
  const targetId = String(productId).trim().toLowerCase();
  return all.filter((r) => String(r.productId || '').trim().toLowerCase() === targetId);
};

export const upsertReviewInStore = (reviewData) => {
  const all = getReviewsFromStore();
  const newId = reviewData.id || `rev-${Date.now()}`;
  const existingIdx = all.findIndex((r) => String(r.id) === String(newId));

  const updatedReview = {
    id: String(newId),
    productId: String(reviewData.productId || ''),
    customerName: reviewData.customerName || reviewData.customer || reviewData.name || 'Anonymous',
    rating: Number(reviewData.rating) || 0,
    reviewDate: reviewData.reviewDate || reviewData.date || new Date().toISOString(),
    reviewComment: reviewData.reviewComment || reviewData.comment || '',
    verifiedPurchase: reviewData.verifiedPurchase !== undefined ? Boolean(reviewData.verifiedPurchase) : (reviewData.verified !== false),
    status: reviewData.status || 'Approved',
  };

  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...updatedReview };
  } else {
    all.unshift(updatedReview);
  }

  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('Error writing reviews to localStorage:', err);
    }
  }

  return updatedReview;
};

export const deleteReviewFromStore = (id) => {
  let all = getReviewsFromStore();
  all = all.filter((r) => String(r.id) !== String(id));
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('Error deleting review from localStorage:', err);
    }
  }
  return true;
};
