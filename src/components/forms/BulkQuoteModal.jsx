import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useUI } from '../../context/UIContext';
import { quoteService } from '../../services/quoteService';
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
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (quoteOpen) setForm((value) => ({ ...value, product: quoteProduct?.name || 'General bulk requirement' }));
  }, [quoteOpen, quoteProduct]);

  const change = ({ target }) => {
    let value = target.value;
    if (target.name === 'gstin') {
      value = value.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.companyName.trim()) next.companyName = 'Please enter your company name.';
    const gstinErr = validateGstin(form.gstin);
    if (gstinErr) next.gstin = gstinErr;
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
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
    await quoteService.submit({
      ...form,
      gstin: form.gstin ? form.gstin.trim().toUpperCase() : '',
      productId: quoteProduct?.id || null,
      quantity: Number(form.quantity)
    });
    setStatus('success');
  };

  const close = () => {
    closeQuote();
    window.setTimeout(() => { setForm(emptyForm); setErrors({}); setStatus('idle'); }, 250);
  };

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
            <input name="name" value={form.name} onChange={change} aria-invalid={!!errors.name} />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label className="field">
            <span>Company Name *</span>
            <input name="companyName" value={form.companyName} onChange={change} aria-invalid={!!errors.companyName} />
            {errors.companyName && <small>{errors.companyName}</small>}
          </label>
          <label className="field">
            <span>GSTIN Number</span>
            <input
              name="gstin"
              maxLength="15"
              placeholder="Enter 15-character GSTIN"
              value={form.gstin}
              onChange={change}
              aria-invalid={!!errors.gstin}
            />
            {errors.gstin && <small>{errors.gstin}</small>}
          </label>
          <label className="field">
            <span>Mobile *</span>
            <input name="mobile" inputMode="numeric" maxLength="10" value={form.mobile} onChange={change} aria-invalid={!!errors.mobile} />
            {errors.mobile && <small>{errors.mobile}</small>}
          </label>
          <label className="field">
            <span>Email *</span>
            <input name="email" type="email" value={form.email} onChange={change} aria-invalid={!!errors.email} />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label className="field">
            <span>Location *</span>
            <input name="location" value={form.location} onChange={change} aria-invalid={!!errors.location} />
            {errors.location && <small>{errors.location}</small>}
          </label>
          <label className="field">
            <span>Product</span>
            <input name="product" value={form.product} readOnly />
          </label>
          <label className="field">
            <span>Quantity *</span>
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={change} aria-invalid={!!errors.quantity} />
            {errors.quantity && <small>{errors.quantity}</small>}
          </label>
          <label className="field full">
            <span>Requirement *</span>
            <textarea name="requirement" rows="4" value={form.requirement} onChange={change} aria-invalid={!!errors.requirement} />
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
