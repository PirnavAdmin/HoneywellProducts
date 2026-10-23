import React from 'react';
import { ArrowUpRight, ShoppingCart, Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { useSettings } from '../../context/SettingsContext';
import OptimizedImage from '../common/OptimizedImage';
import { categoryImages } from '../../data/imageLibrary';

/**
 * Resolves a tailored fallback image from categoryImages corresponding strictly to
 * the product's functional category and environment, ensuring broken or missing images
 * never degrade to a generic corporate logo.
 */
export function getProductCategoryFallback(product = {}) {
  const text = `${product.name || ''} ${product.productType || ''} ${product.subcategory || ''} ${product.subcategoryName || ''} ${product.category || ''} ${product.categoryName || ''}`.toLowerCase();

  if (text.includes('solar') && (text.includes('camera') || text.includes('4g') || text.includes('outdoor'))) {
    return categoryImages['solar-cameras'];
  }
  if (text.includes('solar') || text.includes('photovoltaic') || text.includes('waaree')) {
    return categoryImages['solar-panels'] || categoryImages['solar-cameras'];
  }
  if (text.includes('ptz') || text.includes('speed dome') || text.includes('pt ') || text.includes('pan-tilt') || text.includes('pan tilt')) {
    return categoryImages['ptz-cameras'];
  }
  if (text.includes('dome')) {
    return categoryImages['dome-cameras'];
  }
  if (text.includes('bullet')) {
    return categoryImages['bullet-cameras'];
  }
  if (text.includes('turret')) {
    return categoryImages['ip-cameras'];
  }
  if (text.includes('wifi') || text.includes('wi-fi') || text.includes('wireless')) {
    return categoryImages['wifi-cameras'];
  }
  if (text.includes('4g') || text.includes('cellular') || text.includes('sim')) {
    return categoryImages['4g-cameras'];
  }
  if (text.includes('nvr')) {
    return categoryImages['nvr'];
  }
  if (text.includes('dvr')) {
    return categoryImages['dvr'];
  }
  if (text.includes('storage') || text.includes('hard drive') || text.includes('hdd') || text.includes('ssd')) {
    return categoryImages['surveillance-storage'];
  }
  if (text.includes('network') || text.includes('switch') || text.includes('poe') || text.includes('router')) {
    return categoryImages['networking'];
  }
  if (text.includes('turbo') || text.includes('analog')) {
    return categoryImages['cctv-cameras'];
  }
  return categoryImages['ip-cameras'] || '/honeywell-products-logo.png';
}

export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart();
  const { openEnquiry, notify } = useUI();
  const { canShowPrice, canPurchase } = useSettings();
  const showPrice = canShowPrice(product);
  const showPurchase = canPurchase(product);

  const add = () => { addItem(product); notify(`${product.name} added to cart.`); };

  const categoryFallback = getProductCategoryFallback(product);
  const rawImg = product.image || product.imageUrl || (Array.isArray(product.images) && product.images[0]);
  const isBrokenOrMissing = !rawImg || 
    String(rawImg).toLowerCase().includes('placeholder') ||
    String(rawImg).includes('0b739155') ||
    String(rawImg).includes('2ff42c5c');

  const displayImage = isBrokenOrMissing ? categoryFallback : rawImg;

  const productSlug = product.slug || product.id || '';
  const cardLink = product.customUrl || `/products/${productSlug}`;
  const ctaLabel = product.ctaLabel || 'View';

  const numPrice = Number(product.price || 0);
  const numMrp = Number(product.mrp || 0);
  const discountPercent = (numMrp > numPrice && numPrice > 0)
    ? Math.round(((numMrp - numPrice) / numMrp) * 100)
    : 0;

  const priceFormatted =
    product.priceLabel ||
    (numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : '₹0');

  const rawNote = product.priceNote || '';
  const priceNoteFormatted = /incl|tax/i.test(rawNote) ? '' : rawNote;

  const highlightsList =
    Array.isArray(product.highlights) && product.highlights.length > 0
      ? product.highlights
      : Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0
      ? product.keyFeatures
      : [product.shortDescription || product.description || 'High performance professional surveillance product'];

  const isOutOfStock = product.availability === 'Out of Stock' || product.stock === 0;

  // Resolve effective reviews from already-fetched product information (no separate per-card API calls)
  const effectiveReviews = Array.isArray(product.reviews) ? product.reviews : [];
  const hasReviews = effectiveReviews.length > 0;
  const numRating = Number(product.rating ?? product.averageRating);

  const displayReviewCount = hasReviews
    ? effectiveReviews.length
    : (Number(product.reviewCount) > 0
        ? Number(product.reviewCount)
        : (Number(product.totalReviews) > 0
            ? Number(product.totalReviews)
            : 0));

  const displayRating = hasReviews
    ? (effectiveReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / effectiveReviews.length).toFixed(1)
    : (displayReviewCount > 0 && !isNaN(numRating) && numRating > 0 ? numRating.toFixed(1) : '0');

  return (
    <article className="product-card">
      <Link className="product-image" to={cardLink}>
        <OptimizedImage
          src={displayImage}
          alt={product.name}
          fallbackSrc={categoryFallback}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
        <span className="product-cat-tag">{product.category || 'General'}</span>
        {showPrice && discountPercent > 0 && <span className="product-discount-tag">{discountPercent}% OFF</span>}
      </Link>

      <div className="product-body">
        <div className="product-meta-row">
          <small className="product-type">{product.productType || 'Security Equipment'}</small>
          <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {product.availability || (isOutOfStock ? 'Out of Stock' : 'In Stock')}
          </span>
        </div>

        <h3 className="product-card-title">
          <Link to={cardLink} title={product.name}>{product.name}</Link>
        </h3>

        <div className="product-sub-row">
          <div className="product-rating" aria-label={`${displayRating} out of 5 from ${displayReviewCount} reviews`}>
            <span className="product-stars"><Star size={11} fill="currentColor" /></span>
            <strong>{displayRating}</strong>
            <span>({displayReviewCount})</span>
          </div>
          {(product.model || product.sku) && (
            <span className="product-card-model" title={product.model || product.sku}>
              {product.model || product.sku}
            </span>
          )}
        </div>

        <ul className="product-spec-list">
          {highlightsList.slice(0, 2).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        {showPrice && (
          <div className="product-price">
            <div className="price-stack">
              <strong>{priceFormatted}</strong>
              {numMrp > numPrice && <span className="mrp-strike">₹{numMrp.toLocaleString('en-IN')}</span>}
            </div>
            {priceNoteFormatted && <small className="price-note">{priceNoteFormatted}</small>}
          </div>
        )}
      </div>

      <div className="product-actions">
        <Link to={cardLink} className="product-action-btn view-btn">{ctaLabel} <ArrowUpRight size={12} /></Link>
        <button type="button" className="product-action-btn enquire-btn" onClick={() => openEnquiry(product)}>
          <MessageSquare size={12} /> Enquire
        </button>
        {showPurchase && (
          <button type="button" className="cart-square" onClick={add} aria-label={`Add ${product.name} to cart`}>
            <ShoppingCart size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
