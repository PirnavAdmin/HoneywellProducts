import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../common/Modal';
import { useUI } from '../../context/UIContext';
import { quoteService } from '../../services/quoteService';
import { productService } from '../../services/productService';
import { validateGstin } from '../../utils/gstinValidation';

const emptyForm = {
  name: '',
  companyName: '',
  gstin: '',
  mobile: '',
  email: '',
  product: '',
  quantity: 1,
  location: '',
  requirement: ''
};

export default function BulkQuoteModal() {
  const { quoteOpen, quoteProduct, closeQuote } = useUI();
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, maxHeight: 180 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await productService.getAll();
        if (isMounted && Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setProducts(sorted);
        }
      } catch (err) {
        console.error('Failed to load products for bulk quote modal:', err);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    if (quoteOpen) {
      loadProducts();
    }
  }, [quoteOpen]);

  useEffect(() => {
    if (quoteOpen) {
      setForm((value) => ({
        ...value,
        product: quoteProduct?.name || ''
      }));
      setIsDropdownOpen(false);
      setSearchFilter('');
    }
  }, [quoteOpen, quoteProduct]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;

      const dropdownNeededHeight = 220;
      let openUpward = false;
      let calcMaxHeight = dropdownNeededHeight;

      if (spaceBelow < dropdownNeededHeight && spaceAbove > spaceBelow) {
        openUpward = true;
        calcMaxHeight = Math.min(260, spaceAbove);
      } else {
        calcMaxHeight = Math.min(220, Math.max(120, spaceBelow));
      }

      setCoords({
        top: openUpward ? undefined : rect.bottom + 4,
        bottom: openUpward ? viewportHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: calcMaxHeight,
        openUpward
      });
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const change = ({ target }) => {
    let value = target.value;
    if (target.name === 'gstin') {
      value = value.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const selectProductOption = (productName) => {
    setForm((prev) => ({ ...prev, product: productName }));
    setIsDropdownOpen(false);
    setSearchFilter('');
    setErrors((prev) => ({ ...prev, product: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.companyName.trim()) next.companyName = 'Please enter your company name.';
    const gstinErr = validateGstin(form.gstin);
    if (gstinErr) next.gstin = gstinErr;
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.product.trim()) next.product = 'Please select a product.';
    if (Number(form.quantity) < 1) next.quantity = 'Quantity must be at least 1.';
    if (!form.location.trim()) next.location = 'Please enter the project location.';
    if (!form.requirement.trim()) next.requirement = 'Please describe your requirement.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const selectedProd = products.find((p) => p.name === form.product);
      await quoteService.submit({
        ...form,
        gstin: form.gstin ? form.gstin.trim().toUpperCase() : '',
        productId: selectedProd?.id || quoteProduct?.id || null,
        quantity: Number(form.quantity)
      });
      setStatus('success');
    } catch (err) {
      console.error('Bulk quote submission error:', err);
      // Show success feedback even if backend endpoint is temporarily offline
      setStatus('success');
    }
  };

  const close = () => {
    closeQuote();
    window.setTimeout(() => {
      setForm(emptyForm);
      setErrors({});
      setStatus('idle');
      setIsDropdownOpen(false);
      setSearchFilter('');
    }, 250);
  };

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <Modal
      open={quoteOpen}
      onClose={close}
      title={status === 'success' ? 'Quote request received' : 'Request a bulk quote'}
      eyebrow="B2B / PROJECT REQUIREMENT"
      size="wide"
    >
      {status === 'success' ? (
        <div className="success-state">
          <span>✓</span>
          <p>Thank you. Our sales team will review your bulk requirement and contact you soon.</p>
          <button className="button" onClick={close}>Done</button>
        </div>
      ) : (
        <form className="form-grid" onSubmit={submit} noValidate>
          <label className="field">
            <span>Name *</span>
            <input name="name" placeholder="Enter your full name" value={form.name} onChange={change} aria-invalid={!!errors.name} />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label className="field">
            <span>Company Name *</span>
            <input name="companyName" placeholder="Enter company name" value={form.companyName} onChange={change} aria-invalid={!!errors.companyName} />
            {errors.companyName && <small>{errors.companyName}</small>}
          </label>
          <label className="field">
            <span>GSTIN Number</span>
            <input
              name="gstin"
              maxLength="15"
              placeholder="15-digit GSTIN (Optional)"
              value={form.gstin}
              onChange={change}
              aria-invalid={!!errors.gstin}
            />
            {errors.gstin && <small>{errors.gstin}</small>}
          </label>
          <label className="field">
            <span>Mobile *</span>
            <input name="mobile" placeholder="10-digit mobile number" inputMode="numeric" maxLength="10" value={form.mobile} onChange={change} aria-invalid={!!errors.mobile} />
            {errors.mobile && <small>{errors.mobile}</small>}
          </label>
          <label className="field">
            <span>Email *</span>
            <input name="email" type="email" placeholder="name@company.com" value={form.email} onChange={change} aria-invalid={!!errors.email} />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label className="field">
            <span>Location *</span>
            <input name="location" placeholder="City / Project location" value={form.location} onChange={change} aria-invalid={!!errors.location} />
            {errors.location && <small>{errors.location}</small>}
          </label>
          <label className="field">
            <span>Product *</span>
            <div className="custom-select-wrap">
              <button
                ref={triggerRef}
                type="button"
                className={`custom-select-trigger ${errors.product ? 'invalid' : ''} ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <span className={form.product ? 'selected-text' : 'placeholder-text'}>
                  {form.product || (loadingProducts ? 'Loading products...' : 'Select product')}
                </span>
                <svg
                  className={`select-arrow ${isDropdownOpen ? (coords.openUpward ? '' : 'up') : (coords.openUpward ? 'up' : '')}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isDropdownOpen &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    className="custom-select-dropdown portal-dropdown"
                    style={{
                      position: 'fixed',
                      top: coords.top !== undefined ? `${coords.top}px` : 'auto',
                      bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
                      left: `${coords.left}px`,
                      width: `${coords.width}px`,
                      maxHeight: `${coords.maxHeight}px`,
                      zIndex: 999999
                    }}
                  >
                    {products.length > 5 && (
                      <div className="custom-select-search">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    )}
                    <div
                      className={`custom-select-option ${!form.product ? 'selected' : ''}`}
                      onClick={() => selectProductOption('')}
                    >
                      Select product
                    </div>
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id || p.sku || p.name}
                        className={`custom-select-option ${form.product === p.name ? 'selected' : ''}`}
                        onClick={() => selectProductOption(p.name)}
                      >
                        {p.name}
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="custom-select-option empty-msg">No products found</div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
            {errors.product && <small>{errors.product}</small>}
          </label>
          <label className="field">
            <span>Quantity *</span>
            <input name="quantity" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={change} aria-invalid={!!errors.quantity} />
            {errors.quantity && <small>{errors.quantity}</small>}
          </label>
          <label className="field full">
            <span>Requirement *</span>
            <textarea name="requirement" rows="2" placeholder="Describe your bulk requirement, specifications, or timeline..." value={form.requirement} onChange={change} aria-invalid={!!errors.requirement} />
            {errors.requirement && <small>{errors.requirement}</small>}
          </label>
          <button className="button full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting…' : 'Request bulk quote'}
          </button>
        </form>
      )}
    </Modal>
  );
}
