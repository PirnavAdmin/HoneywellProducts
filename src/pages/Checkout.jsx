import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function Checkout() {
  useDocumentTitle('Checkout', 'Submit contact and delivery details for products selected in the cart.');
  const { items, count, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  if (!items.length) return <Navigate to="/cart" replace />;

  const submit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      navigate('/order-success', { state: { reference: `HW-CART-${String(Date.now()).slice(-6)}` } });
      window.setTimeout(clearCart, 250);
    }, 700);
  };

  return <section className="checkout-page"><div className="container"><div className="checkout-head"><Link to="/cart"><ArrowLeft /> Back to cart</Link><span><LockKeyhole /> Frontend cart request</span></div><div className="checkout-layout">
    <div><p className="eyebrow dark">CHECKOUT</p><h1>Contact & delivery details</h1><p>No payment or order data is transmitted. Backend submission will be connected later.</p><form id="checkout-form" className="form-grid checkout-form" onSubmit={submit}><label className="field full"><span>Customer name *</span><input required /></label><label className="field"><span>Mobile *</span><input required inputMode="numeric" maxLength="10" pattern="[6-9][0-9]{9}" /></label><label className="field"><span>Email</span><input type="email" /></label><label className="field full"><span>Delivery / project address *</span><textarea required rows="3" /></label><label className="field"><span>City *</span><input required /></label><label className="field"><span>State *</span><input required /></label><label className="field"><span>PIN code *</span><input required inputMode="numeric" pattern="[0-9]{6}" /></label></form></div>
    <aside className="order-summary"><p className="eyebrow dark">YOUR SELECTION</p><div className="checkout-products">{items.map((item) => <div key={item.id}><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>Qty {item.quantity} × {item.priceLabel}</small></span><b>{formatPrice((item.price || 0) * item.quantity)}</b></div>)}</div><hr /><div><span>Total units</span><strong>{count}</strong></div><div className="summary-total"><span>Estimated subtotal</span><strong>{formatPrice(total)}</strong></div><button className="button" form="checkout-form" disabled={submitting}>{submitting ? 'Submitting cart request…' : <>Submit cart request <ArrowRight /></>}</button><p>No payment is collected. Displayed prices are representative demo values and require sales confirmation.</p></aside>
  </div></div></section>;
}
