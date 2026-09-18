import React from 'react';
import { ArrowUpRight, ShoppingCart, Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import OptimizedImage from '../common/OptimizedImage';

export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart();
  const { openEnquiry, notify } = useUI();
  const add = () => { addItem(product); notify(`${product.name} added to cart.`); };

  const rawImg = product.image || product.imageUrl || (Array.isArray(product.images) && product.images[0]);
  const displayImage = (!rawImg || String(rawImg).toLowerCase().includes('placeholder'))
    ? '/honeywell-products-logo.png'
    : rawImg;

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
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
        <span className="product-cat-tag">{product.category || 'General'}</span>
        {discountPercent > 0 && <span className="product-discount-tag">{discountPercent}% OFF</span>}
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

        <div className="product-price">
          <div className="price-stack">
            <strong>{priceFormatted}</strong>
            {numMrp > numPrice && <span className="mrp-strike">₹{numMrp.toLocaleString('en-IN')}</span>}
          </div>
          {priceNoteFormatted && <small className="price-note">{priceNoteFormatted}</small>}
        </div>
      </div>

      <div className="product-actions">
        <Link to={cardLink} className="product-action-btn view-btn">{ctaLabel} <ArrowUpRight size={12} /></Link>
        <button type="button" className="product-action-btn enquire-btn" onClick={() => openEnquiry(product)}>
          <MessageSquare size={12} /> Enquire
        </button>
        <button type="button" className="cart-square" onClick={add} aria-label={`Add ${product.name} to cart`}>
          <ShoppingCart size={14} />
        </button>
      </div>
    </article>
  );
}
