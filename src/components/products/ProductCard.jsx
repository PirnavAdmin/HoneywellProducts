import { ArrowUpRight, GitCompareArrows, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { openEnquiry, notify } = useUI();
  const add = () => { addItem(product); notify(`${product.name} added to cart.`); };
  const compare = () => notify(`${product.name} added to your demo comparison list.`);
  return <article className="product-card">
    <Link className="product-image" to={`/products/${product.slug}`}>
      <img src={product.image} alt={product.name} loading="lazy" />
      <span>{product.category}</span>
    </Link>

    <div className="product-body">
      <small>{product.productType}</small>
      <h3 className="product-card-title">
        <Link to={`/products/${product.slug}`} title={product.name}>{product.name}</Link>
      </h3>
      <div className="product-rating" aria-label={`${product.rating} out of 5 from ${product.reviewCount} reviews`}>
        <span className="product-stars"><Star size={13} fill="currentColor" /></span>
        <strong>{product.rating}</strong>
        <span>({product.reviewCount} reviews)</span>
      </div>
      <p className="product-card-model">{product.model}</p>
      <ul className="product-spec-list">
        {product.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="product-price">
        <strong>{product.priceLabel}</strong>
        <small>{product.priceNote}</small>
      </div>
    </div>

    <div className="product-actions">
      <Link to={`/products/${product.slug}`}>View Product <ArrowUpRight size={16} /></Link>
      <button onClick={() => openEnquiry(product)}>Enquire Now</button>
      <button className="compare-square" onClick={compare} aria-label={`Compare ${product.name}`}><GitCompareArrows size={17} /></button>
      <button className="cart-square" onClick={add} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={17} /></button>
    </div>
  </article>;
}
