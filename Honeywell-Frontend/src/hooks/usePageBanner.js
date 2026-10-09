import { useEffect, useState } from 'react';

import { bannerService } from '../services/bannerService';

import { resolveBannerImage } from '../admin/marketing/bannersApi';
 
export function usePageBanner(

  pageType,

  defaultTitle = '',

  defaultDescription = '',

  defaultImage = ''

) {

  const [banner, setBanner] = useState({

    title: defaultTitle,

    description: defaultDescription,

    image: defaultImage,

    isDynamic: false

  });
 
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {

    let mounted = true;
 
    const loadBanner = async () => {

      if (!pageType) {

        setLoading(false);

        return;

      }
 
      try {

        // Request ONLY the banner type required by this page.

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
 
        if (!mounted) return;
 
        setBanner({

          title: matched.title || defaultTitle,

          description: description || defaultDescription,

          image: image || defaultImage,

          isDynamic: Boolean(image)

        });

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
 
    return () => {

      mounted = false;

    };

  }, [pageType, defaultTitle, defaultDescription, defaultImage]);
 
  return {

    banner,

    loading

  };

}

 