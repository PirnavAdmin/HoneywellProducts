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
    return parsed && typeof parsed === 'object' && parsed.isDynamic && (parsed.title || parsed.image) ? parsed : null;
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

export function usePageBanner(pageType) {
  // Initialize with cached dynamic banner if available
  const [banner, setBanner] = useState(() => {
    return getCachedBanner(pageType);
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadBanner = async () => {
      if (!pageType) {
        if (mounted) {
          setBanner(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Request ONLY the banner type required by this page
        const banners = await bannerService.getActiveBanners(pageType);

        if (!mounted) return;

        if (!Array.isArray(banners) || banners.length === 0) {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const key = getBannerStorageKey(pageType);
            if (key) window.sessionStorage.removeItem(key);
          }
          if (mounted) setBanner(null);
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
          // If no active custom banner exists, clear stale cache and remove banner
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const key = getBannerStorageKey(pageType);
            if (key) window.sessionStorage.removeItem(key);
          }
          if (mounted) {
            setBanner(null);
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
          '';

        const description = String(rawDescription)
          .replace(/\[Type:\w+\]/gi, '')
          .replace(/\[(?:Cta|Btn):\s*[^\]]+\]/gi, '')
          .replace(/\[Sec:\s*[^\]]+\]/gi, '')
          .trim();

        const latestBanner = {
          id: matched.id,
          title: matched.title || '',
          subtitle: description,
          description: description,
          image: image || '',
          bannerType: matched.bannerType || pageType,
          ctaText: matched.ctaText || '',
          secondaryType: matched.secondaryType || '',
          targetUrl: matched.targetUrl || '',
          isDynamic: true
        };

        if (mounted) {
          setBanner(latestBanner);
          setCachedBanner(pageType, latestBanner);
        }
      } catch (error) {
        console.warn(
          `[usePageBanner] Could not load ${pageType} banner from API (server may be offline):`,
          error.message
        );
        if (mounted) {
          setBanner(null);
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const key = getBannerStorageKey(pageType);
            if (key) window.sessionStorage.removeItem(key);
          }
        }
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
  }, [pageType]);

  return {
    banner,
    loading
  };
}
