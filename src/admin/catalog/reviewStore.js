const REVIEWS_KEY = 'sat_catalog_reviews';

export const initialReviews = [
  {
    id: 'rev-101',
    productId: '1',
    customerName: 'Rajesh Kumar',
    rating: 5,
    reviewDate: '2026-08-28T10:15:00.000Z',
    reviewComment: 'Exceptional 4MP image clarity even in low light conditions. The IR LEDs cover our entire warehouse perimeter smoothly. Very satisfied with Honeywell build quality.',
    verifiedPurchase: true,
    status: 'Approved',
  },
  {
    id: 'rev-102',
    productId: '1',
    customerName: 'Ananya Sharma',
    rating: 4,
    reviewDate: '2026-09-02T14:30:00.000Z',
    reviewComment: 'Solid construction and easy PoE installation. Motion alerts are accurate with minimal false alarms.',
    verifiedPurchase: true,
    status: 'Approved',
  },
  {
    id: 'rev-201',
    productId: '2',
    customerName: 'Vikram Singh',
    rating: 5,
    reviewDate: '2026-08-14T09:00:00.000Z',
    reviewComment: '550W modules generating optimal output even on partially cloudy days. Perfect for commercial rooftop installations.',
    verifiedPurchase: true,
    status: 'Approved',
  },
  {
    id: 'rev-301',
    productId: '3',
    customerName: 'Suresh Patel',
    rating: 5,
    reviewDate: '2026-08-20T11:45:00.000Z',
    reviewComment: 'Fast biometric identification and reliable door access controller. Integrated easily with our existing Honeywell software.',
    verifiedPurchase: true,
    status: 'Approved',
  },
  {
    id: 'rev-401',
    productId: '4',
    customerName: 'Meera Nair',
    rating: 4,
    reviewDate: '2026-09-05T16:20:00.000Z',
    reviewComment: 'Heavy duty power supply unit. Clean output voltage with built-in surge protection.',
    verifiedPurchase: true,
    status: 'Approved',
  },
];

const isStorageAvailable = () => typeof window !== 'undefined' && window.localStorage;

export const getReviewsFromStore = () => {
  if (!isStorageAvailable()) return [...initialReviews];
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(initialReviews));
      return [...initialReviews];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...initialReviews];
  } catch (err) {
    console.warn('Error reading reviews from localStorage:', err);
    return [...initialReviews];
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
    rating: Number(reviewData.rating) || 5,
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
