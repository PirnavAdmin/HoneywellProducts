import { useEffect, useState } from 'react';
import { bannerService } from '../services/bannerService';
import { resolveBannerImage } from '../admin/marketing/bannersApi';

/**
 * Hook to dynamically fetch page banner uploaded via Admin panel (Marketing -> Banners)
 * @param {string} pageType - e.g. 'Products', 'Solutions', 'Business', 'Contact'
 * @param {string} defaultTitle - Default title if no custom banner exists
 * @param {string} defaultDescription - Default description if no custom banner exists
 * @param {string} defaultImage - Default background image if no custom banner exists
 */
export function usePageBanner(pageType, defaultTitle = '', defaultDescription = '', defaultImage = '') {
  const [banner, setBanner] = useState({
    title: defaultTitle,
    description: defaultDescription,
    image: defaultImage,
    isDynamic: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!pageType) {
      setLoading(false);
      return;
    }

    bannerService.getActiveBanners(pageType)
      .then((banners) => {
        if (!isMounted) return;
        if (Array.isArray(banners) && banners.length > 0) {
          const pType = pageType.toLowerCase();
          const matched = banners.find(b => {
            const bType = (b.bannerType || '').toLowerCase();
            const bTarget = (b.targetUrl || '').toLowerCase();
            return bType === pType || bTarget.includes(pType) || (pType === 'about' && (bTarget.includes('about') || bType === 'about')) || (pType === 'resources' && (bTarget.includes('resources') || bType === 'resources'));
          });

          if (matched) {
            const dynamicImg = resolveBannerImage(matched.imageUrl);
            const rawSub = matched.subtitle || matched.description || '';
            const cleanSub = String(rawSub).replace(/\[Type:\w+\]/gi, '').trim();

            setBanner({
              title: matched.title || defaultTitle,
              description: cleanSub || defaultDescription,
              image: dynamicImg || defaultImage,
              isDynamic: true
            });
          }
        }
      })
      .catch((err) => {
        console.warn(`[usePageBanner] Could not load banner for ${pageType}:`, err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [pageType, defaultTitle, defaultDescription, defaultImage]);

  return { banner, loading };
}
