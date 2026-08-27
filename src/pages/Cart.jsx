import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function Cart() {
  useDocumentTitle('Shopping Cart', 'Review and update products selected for a frontend cart request.');
  const { items, updateQuantity, removeItem, clearCart, count, total } = useCart();
  const { openQuote } = useUI();

  return <>
    <PageHero eyebrow="PRODUCT CART" title="Your Cart" description="Review selected product types before continuing to the frontend checkout request." />
    <section className="section cart-page"><div className="container">{items.length === 0 ?
      <div className="empty-state large"><ShoppingBag size={44} /><h2>Your cart is empty</h2><p>Explore the catalogue and add products to continue.</p><Link className="button" to="/products">Browse Products <ArrowRight /></Link></div> :
      <div className="cart-layout">
        <div className="cart-items"><div className="cart-items-header"><strong>Selected Products</strong><button className="clear-cart" onClick={clearCart}><Trash2 size={15} /> Clear Cart</button></div>{items.map((item) =>
          <article key={item.id}><img src={item.image} alt={item.name} /><div className="cart-item-copy"><small>{item.category} • {item.productType}</small><h2><Link to={`/products/${item.id}`}>{item.name}</Link></h2><p>{item.description}</p><span>{item.model}</span><button className="remove-item" onClick={() => removeItem(item.id)}><Trash2 size={16} /> Remove</button></div><div className="cart-item-end"><strong>{formatPrice((item.price || 0) * item.quantity)}</strong><small>{item.priceLabel} each</small><div className="quantity small"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus /></button></div></div></article>
        )}</div>
        <aside className="order-summary"><p className="eyebrow dark">CART SUMMARY</p><div><span>Products selected</span><strong>{items.length}</strong></div><div><span>Total units</span><strong>{count}</strong></div><hr /><div className="summary-total"><span>Estimated subtotal</span><strong>{formatPrice(total)}</strong></div><p>Prices are representative demo values. Taxes, delivery, installation, availability and final commercial terms will be confirmed by the sales team.</p><Link className="button" to="/checkout">Continue to Checkout <ArrowRight /></Link><button className="button outline" onClick={() => openQuote()}>Request Bulk Quote</button><Link className="continue-link" to="/products"><ArrowLeft /> Continue Shopping</Link></aside>
      </div>
    }</div></section>
  </>;
}
