import React, { useState, useEffect } from 'react';

const LIVE_DOMAIN = 'https://honeywellproducts.com';
const NGROK_DOMAIN = 'https://drab-smoking-unstaffed.ngrok-free.dev';

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  style = {},
  loading = 'lazy',
  fetchPriority = undefined,
  decoding = 'async',
  fallbackSrc = '',
  aspectRatio,
  onLoad,
  onError,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryStage, setRetryStage] = useState(0);

  // Normalize image source without hardcoded brand logo substitution
  const imageSrc = (!src || String(src).toLowerCase().includes('placeholder'))
    ? (fallbackSrc || '')
    : src;

  const [currentSrc, setCurrentSrc] = useState(imageSrc);

  useEffect(() => {
    setCurrentSrc(imageSrc);
    setIsLoaded(false);
    setHasError(false);
    setRetryStage(0);
  }, [imageSrc]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    const srcStr = String(currentSrc || '');

    // Retry stage 0: If an /uploads/ image failed, attempt cross-environment fallback
    if (retryStage === 0 && srcStr.includes('/uploads/')) {
      const uploadPath = srcStr.slice(srcStr.indexOf('/uploads/'));
      setRetryStage(1);

      if (srcStr.includes(LIVE_DOMAIN)) {
        // Failed on live domain -> try ngrok / local origin
        setCurrentSrc(`${NGROK_DOMAIN}${uploadPath}`);
        return;
      } else {
        // Failed on local or relative -> try live domain
        setCurrentSrc(`${LIVE_DOMAIN}${uploadPath}`);
        return;
      }
    }

    // Retry stage 1: If stage 1 failed, try relative /uploads/ path if not already tried
    if (retryStage === 1 && srcStr.includes('/uploads/')) {
      const uploadPath = srcStr.slice(srcStr.indexOf('/uploads/'));
      setRetryStage(2);
      if (srcStr !== uploadPath) {
        setCurrentSrc(uploadPath);
        return;
      }
    }

    // Final fallback: Use fallbackSrc or logo placeholder
    if (!hasError) {
      setHasError(true);
      const safeFallback = fallbackSrc || '/honeywell-products-logo.png';
      if (currentSrc !== safeFallback) {
        setCurrentSrc(safeFallback);
      }
    }
    if (onError) onError(e);
  };

  const combinedStyle = {
    ...style,
    ...(aspectRatio ? { aspectRatio } : {}),
    opacity: isLoaded ? 1 : 0.6,
    transition: 'opacity 0.25s ease-in-out',
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      fetchpriority={fetchPriority}
      decoding={decoding}
      className={`optimized-image ${isLoaded ? 'loaded' : 'loading'} ${className}`.trim()}
      style={combinedStyle}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
}
