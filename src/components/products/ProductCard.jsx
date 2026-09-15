import { ArrowUpRight, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { openEnquiry, notify } = useUI();
  const add = () => { addItem(product); notify(`${product.name} added to cart.`); };

  const rawImg = product.image || product.imageUrl || (Array.isArray(product.images) && product.images[0]);
  const displayImage = (!rawImg || String(rawImg).toLowerCase().includes('placeholder'))
    ? '/honeywell-products-logo.png'
    : rawImg;

  const productSlug = product.slug || product.id || '';
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

  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${productSlug}`}>
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/honeywell-products-logo.png';
          }}
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
          <Link to={`/products/${productSlug}`} title={product.name}>{product.name}</Link>
        </h3>

        <div className="product-sub-row">
          <div className="product-rating" aria-label={`${product.rating || '4.8'} out of 5 from ${product.reviewCount || 8} reviews`}>
            <span className="product-stars"><Star size={11} fill="currentColor" /></span>
            <strong>{product.rating || '4.8'}</strong>
            <span>({product.reviewCount || 8})</span>
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
        <Link to={`/products/${productSlug}`}>View <ArrowUpRight size={13} /></Link>
        <button onClick={() => openEnquiry(product)}>Enquire</button>
        <button className="cart-square" onClick={add} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={15} /></button>
      </div>
    </article>
  );
}
