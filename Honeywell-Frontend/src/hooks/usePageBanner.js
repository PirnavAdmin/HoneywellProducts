import { useEffect, useState } from 'react';
import { bannerService } from '../services/bannerService';
import { resolveBannerImage } from '../admin/marketing/bannersApi';

const getBannerStorageKey = (pageType) => {
  if (!pageType) return null;
  return `page_banner_${String(pageType).trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
};

const getCachedBanner = (pageType) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  const key = getBannerStorageKey(pageType);
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.title ? parsed : null;
  } catch {
    return null;
  }
};

const setCachedBanner = (pageType, bannerData) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  const key = getBannerStorageKey(pageType);
  if (!key || !bannerData) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(bannerData));
  } catch {}
};

export function usePageBanner(
  pageType,
  defaultTitle = '',
  defaultDescription = '',
  defaultImage = ''
) {
  // Initialize with cached banner if available to prevent flash of old/default content on reload
  const [banner, setBanner] = useState(() => {
    const cached = getCachedBanner(pageType);
    if (cached) {
      return cached;
    }
    return {
      title: defaultTitle,
      description: defaultDescription,
      image: defaultImage,
      isDynamic: false
    };
  });

  const [loading, setLoading] = useState(() => !getCachedBanner(pageType));

  useEffect(() => {
    let mounted = true;

    const loadBanner = async () => {
      if (!pageType) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        // Request ONLY the banner type required by this page
        const banners = await bannerService.getActiveBanners(pageType);

        if (!mounted || !Array.isArray(banners)) {
          return;
        }

        const type = String(pageType).trim().toLowerCase();

        const matched = banners.find((item) => {
          if (!item) return false;
          const bannerType = String(item.bannerType || '')
            .trim()
            .toLowerCase();
          const targetUrl = String(item.targetUrl || '')
            .trim()
            .toLowerCase();

          return (
            bannerType === type ||
            targetUrl.includes(`type=${type}`)
          );
        });

        if (!matched) {
          // If no active custom banner exists, clear stale cache and restore defaults
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const key = getBannerStorageKey(pageType);
            if (key) window.sessionStorage.removeItem(key);
          }
          if (mounted) {
            setBanner({
              title: defaultTitle,
              description: defaultDescription,
              image: defaultImage,
              isDynamic: false
            });
          }
          return;
        }

        const imageUrl = String(matched.imageUrl || '').trim();
        let image = resolveBannerImage(imageUrl);

        // Fallback for /uploads/... paths
        if (!image && imageUrl) {
          if (imageUrl.startsWith('/uploads/')) {
            image = imageUrl;
          } else if (imageUrl.includes('/uploads/')) {
            image = imageUrl.substring(
              imageUrl.indexOf('/uploads/')
            );
          }
        }

        const rawDescription =
          matched.subtitle ||
          matched.description ||
          defaultDescription;

        const description = String(rawDescription)
          .replace(/\[Type:\w+\]/gi, '')
          .trim();

        const latestBanner = {
          title: matched.title || defaultTitle,
          description: description || defaultDescription,
          image: image || defaultImage,
          isDynamic: Boolean(image)
        };

        if (mounted) {
          setBanner(latestBanner);
          setCachedBanner(pageType, latestBanner);
        }
      } catch (error) {
        console.warn(
          `[usePageBanner] Failed to load ${pageType} banner`,
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBanner();

    const handleBannerUpdate = () => {
      loadBanner();
    };
    window.addEventListener('banners-updated', handleBannerUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('banners-updated', handleBannerUpdate);
    };
  }, [pageType, defaultTitle, defaultDescription, defaultImage]);

  return {
    banner,
    loading
  };
}
