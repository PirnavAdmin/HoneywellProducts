import { useState } from 'react';
import { Check, ChevronRight, Download, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { getProductById, products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const tabs = ['Overview', 'Features', 'Specifications', 'Downloads', 'FAQ'];

export default function ProductDetails() {
  const { id } = useParams();
  const product = getProductById(id);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('Overview');
  const [image, setImage] = useState(0);
  const { addItem } = useCart();
  const { openEnquiry, openQuote, notify } = useUI();
  useDocumentTitle(product?.name || 'Product', product?.description);
  if (!product) return <Navigate to="/products" replace />;
  const add = () => { addItem(product, quantity); notify(`${quantity} × ${product.name} added to cart.`); };
  const related = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 3);

  return <>
    <div className="product-breadcrumbs container"><Link to="/">Home</Link><ChevronRight /><Link to="/products">Products</Link><ChevronRight /><span>{product.name}</span></div>
    <section className="product-detail container"><div className="product-gallery"><div className="gallery-main"><img src={product.gallery[image]} alt={product.name} /></div><div className="gallery-thumbs">{product.gallery.map((src, index) => <button key={`${src}-${index}`} className={index === image ? 'active' : ''} onClick={() => setImage(index)} aria-label={`View image ${index + 1}`}><img src={src} alt="" /></button>)}</div><small>Representative imagery. Replace with authorized product assets.</small></div>
      <div className="product-info"><p className="eyebrow dark">{product.category}</p><h1>{product.name}</h1><p className="product-model"><strong>{product.model}</strong></p><div className="product-rating" aria-label={`${product.rating} out of 5 from ${product.reviewCount} reviews`}><span className="product-stars"><Star size={15} fill="currentColor" /></span><strong>{product.rating}</strong><span>({product.reviewCount} demo reviews)</span></div><span className="availability"><i /> {product.availability}</span><p className="product-description">{product.description}</p><h2 className="detail-subtitle">Highlights</h2><ul className="feature-list">{product.highlights.map((item) => <li key={item}><Check size={17} />{item}</li>)}</ul><div className="detail-price">{product.priceLabel}<span>Representative demo price. Taxes, delivery, installation and final commercial terms require sales confirmation.</span></div><div className="purchase-row"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus /></button></div><button className="button" onClick={add}><ShoppingCart size={18} /> Add to cart</button></div><div className="detail-enquiry-actions"><button className="button outline" onClick={() => openEnquiry(product)}>Enquire Now</button><button className="button secondary" onClick={() => openQuote(product)}>Request Bulk Quote</button></div><p className="warranty-note">Model, specifications, availability, pricing and warranty information must be confirmed by the client.</p></div></section>
    <section className="product-tabs"><div className="container"><div className="tab-list" role="tablist" aria-label="Product information">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><div className="tab-content">
      {tab === 'Overview' && <div><h2>Product Overview</h2><p>{product.description} This is a generic product-type record prepared for client-verified catalogue content.</p></div>}
      {tab === 'Features' && <div><h2>Features</h2><ul className="feature-list large">{product.highlights.map((item) => <li key={item}><Check /> {item}</li>)}</ul></div>}
      {tab === 'Specifications' && <div><h2>Demo Specifications</h2><dl>{product.specifications.map((item) => { const [key, ...value] = item.split(':'); return <div key={item}><dt>{key}</dt><dd>{value.join(':').trim()}</dd></div>; })}</dl><p className="demo-disclaimer">All specification values are placeholders pending client verification.</p></div>}
      {tab === 'Downloads' && <div><h2>Downloads</h2>{product.downloads.map((document) => <div className="document-row" key={document}><span><strong>{document}</strong><small>Client-supplied file required</small></span><button disabled title="Download file not supplied"><Download /> Not available</button></div>)}</div>}
      {tab === 'FAQ' && <div><h2>Frequently Asked Questions</h2><div className="faq-list">{product.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div>}
    </div></div></section>
    {related.length > 0 && <section className="section related-products"><div className="container"><h2>Related Products</h2><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></div></section>}
  </>;
}
