import { fetchActiveBanners, fetchBannerById } from '../admin/marketing/bannersApi';

export const bannerService = {
  /** GET /api/marketing/banners — Fetch active promo banners */
  async getActiveBanners(type = '') {
    return await fetchActiveBanners(type);
  },

  /** GET /api/marketing/banners/{id} — Fetch single banner details */
  async getBannerById(id) {
    return await fetchBannerById(id);
  }
};
