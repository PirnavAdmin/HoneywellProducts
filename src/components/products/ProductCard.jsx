import { ArrowUpRight, GitCompareArrows, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { openEnquiry, notify } = useUI();
  const add = () => { addItem(product); notify(`${product.name} added to cart.`); };
  const compare = () => notify(`${product.name} added to your demo comparison list.`);

  const rawImg = product.image || product.imageUrl || (Array.isArray(product.images) && product.images[0]);
  const displayImage = (!rawImg || String(rawImg).toLowerCase().includes('placeholder'))
    ? '/honeywell-products-logo.png'
    : rawImg;

  const productSlug = product.slug || product.id || '';
  const priceFormatted =
    product.priceLabel ||
    (product.price !== undefined && product.price !== null
      ? `₹${Number(product.price).toLocaleString('en-IN')}`
      : '₹0');
  const priceNoteFormatted =
    product.priceNote ||
    (product.mrp && Number(product.mrp) > Number(product.price || 0)
      ? `MRP ₹${Number(product.mrp).toLocaleString('en-IN')}`
      : 'Incl. taxes');

  const highlightsList =
    Array.isArray(product.highlights) && product.highlights.length > 0
      ? product.highlights
      : Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0
      ? product.keyFeatures
      : [product.shortDescription || product.description || 'High performance professional surveillance product'];

  return <article className="product-card">
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
      <span>{product.category || 'General'}</span>
    </Link>

    <div className="product-body">
      <small>{product.productType || 'Security Equipment'}</small>
      <h3 className="product-card-title">
        <Link to={`/products/${productSlug}`} title={product.name}>{product.name}</Link>
      </h3>
      <div className="product-rating" aria-label={`${product.rating || '4.8'} out of 5 from ${product.reviewCount || 8} reviews`}>
        <span className="product-stars"><Star size={13} fill="currentColor" /></span>
        <strong>{product.rating || '4.8'}</strong>
        <span>({product.reviewCount || 8} reviews)</span>
      </div>
      <p className="product-card-model">{product.model || product.sku || ''}</p>
      <ul className="product-spec-list">
        {highlightsList.slice(0, 3).map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
      <div className="product-price">
        <strong>{priceFormatted}</strong>
        <small>{priceNoteFormatted}</small>
      </div>
    </div>

    <div className="product-actions">
      <Link to={`/products/${productSlug}`}>View Product <ArrowUpRight size={16} /></Link>
      <button onClick={() => openEnquiry(product)}>Enquire Now</button>
      <button className="compare-square" onClick={compare} aria-label={`Compare ${product.name}`}><GitCompareArrows size={17} /></button>
      <button className="cart-square" onClick={add} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={17} /></button>
    </div>
  </article>;
}
