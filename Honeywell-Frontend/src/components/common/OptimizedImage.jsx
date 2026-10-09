import React, { useState, useEffect } from 'react';

const DEFAULT_FALLBACK = '/honeywell-products-logo.png';

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  style = {},
  loading = 'lazy',
  fetchPriority = undefined,
  decoding = 'async',
  fallbackSrc = DEFAULT_FALLBACK,
  aspectRatio,
  onLoad,
  onError,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Normalize image source
  const imageSrc = (!src || String(src).toLowerCase().includes('placeholder'))
    ? fallbackSrc
    : src;

  const [currentSrc, setCurrentSrc] = useState(imageSrc);

  useEffect(() => {
    setCurrentSrc(imageSrc);
    setIsLoaded(false);
    setHasError(false);
  }, [imageSrc]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
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
