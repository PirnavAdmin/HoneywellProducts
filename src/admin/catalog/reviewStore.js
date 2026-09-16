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

export const getReviewsFromStore = () => [];

export const getReviewsByProductIdFromStore = () => [];

export const upsertReviewInStore = (reviewData) => reviewData;

export const deleteReviewFromStore = () => true;
