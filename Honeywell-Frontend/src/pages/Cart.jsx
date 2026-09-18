import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Info, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
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
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const popoverRef = useRef(null);

  // Close tax breakdown popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowTaxBreakdown(false);
      }
    };
    if (showTaxBreakdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTaxBreakdown]);

  const taxAmount = Math.round(total * 0.18);
  const cgst = total * 0.09;
  const sgst = total * 0.09;
  const totalAmount = total + taxAmount;

  const cgstDisplay = Number.isInteger(cgst)
    ? `₹${cgst.toLocaleString('en-IN')}`
    : `₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
  const sgstDisplay = Number.isInteger(sgst)
    ? `₹${sgst.toLocaleString('en-IN')}`
    : `₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;

  return (
    <>
      <PageHero
        eyebrow="PRODUCT CART"
        title="Your Cart"
        description="Review selected product types before continuing to the frontend checkout request."
      />
      <section className="section cart-page">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty-state large">
              <ShoppingBag size={44} />
              <h2>Your cart is empty</h2>
              <p>Explore the catalogue and add products to continue.</p>
              <Link className="button" to="/products">
                Browse Products <ArrowRight />
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                <div className="cart-items-header">
                  <strong>Selected Products ({items.length})</strong>
                  <button className="clear-cart" onClick={clearCart}>
                    <Trash2 size={15} /> Clear Cart
                  </button>
                </div>
                {items.map((item) => (
                  <article key={item.id}>
                    <img
                      src={
                        !item.image || String(item.image).toLowerCase().includes('placeholder')
                          ? '/honeywell-products-logo.png'
                          : item.image
                      }
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/honeywell-products-logo.png';
                      }}
                    />
                    <div className="cart-item-copy">
                      <small>
                        {item.category} • {item.productType}
                      </small>
                      <h2>
                        <Link to={`/products/${item.id}`}>{item.name}</Link>
                      </h2>
                      <p>{item.description}</p>
                      <span>{item.model}</span>
                      <button className="remove-item" onClick={() => removeItem(item.id)}>
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                    <div className="cart-item-end">
                      <strong>{formatPrice((item.price || 0) * item.quantity)}</strong>
                      <small>{item.priceLabel} each</small>
                      <div className="quantity small">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="order-summary">
                <div className="order-summary-header">
                  <span className="eyebrow dark" style={{ margin: 0 }}>
                    ORDER SUMMARY
                  </span>
                  <ShoppingBag size={20} color="#1268a5" />
                </div>
                <hr style={{ margin: '12px 0 16px' }} />

                <div className="summary-row">
                  <span className="row-label">ITEM SUBTOTAL</span>
                  <strong className="row-value">{formatPrice(total)}</strong>
                </div>

                <div className="summary-row" style={{ position: 'relative' }} ref={popoverRef}>
                  <span className="row-label">
                    ESTIMATED TAX (18%)
                    <button
                      type="button"
                      className="info-tax-btn"
                      onClick={() => setShowTaxBreakdown((prev) => !prev)}
                      title="Click to view tax breakdown"
                      aria-label="Tax breakdown info"
                    >
                      <Info size={11} />
                    </button>
                  </span>
                  <strong className="row-value">{formatPrice(taxAmount)}</strong>

                  {showTaxBreakdown && (
                    <div className="tax-popover-card">
                      <div className="tax-popover-title">TAX BREAKDOWN</div>
                      <div className="tax-popover-row">
                        <span>TAXABLE AMOUNT</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="tax-popover-row">
                        <span>CGST (9%)</span>
                        <span>{cgstDisplay}</span>
                      </div>
                      <div className="tax-popover-row">
                        <span>SGST (9%)</span>
                        <span>{sgstDisplay}</span>
                      </div>
                      <div className="tax-popover-divider" />
                      <div className="tax-popover-total">
                        <span>TOTAL GST</span>
                        <span>{formatPrice(taxAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="summary-row">
                  <span className="row-label">DELIVERY CHARGES</span>
                  <strong className="row-value delivery-free-badge">Free</strong>
                </div>

                <hr />

                <div className="summary-total">
                  <span>TOTAL AMOUNT</span>
                  <strong>{formatPrice(totalAmount)}</strong>
                </div>

                <Link className="button" to="/checkout">
                  PROCEED TO CHECKOUT <ArrowRight />
                </Link>
                <button className="button outline" onClick={() => openQuote()}>
                  Request Bulk Quote
                </button>
                <Link className="continue-link" to="/products">
                  <ArrowLeft /> Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
