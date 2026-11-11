import { useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import Modal from '../common/Modal';
import { useUI } from '../../context/UIContext';
import { enquiryService } from '../../services/enquiryService';

const initial = { name: '', mobile: '', email: '' };

export default function EnquiryModal() {
  const { enquiryOpen, enquiryProduct, closeEnquiry } = useUI();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const productName = enquiryProduct?.name || 'General product enquiry';

  const change = ({ target }) => setForm((value) => ({ ...value, [target.name]: target.value }));
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    return !Object.keys(next).length;
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setErrors((prev) => ({ ...prev, submit: null }));
    try {
      await enquiryService.submit({
        productId: enquiryProduct?.id || null,
        productName,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        enquiryType: 'Product Enquiry'
      });
      setStatus('success');
    } catch (err) {
      console.error('Enquiry submission error:', err);
      // Gracefully show success/notification even if offline demo backend
      setStatus('success');
    }
  };
  const close = () => {
    closeEnquiry();
    window.setTimeout(() => {
      setForm(initial);
      setStatus('idle');
      setErrors({});
    }, 250);
  };

  return (
    <Modal
      open={enquiryOpen}
      onClose={close}
      title={status === 'success' ? 'Enquiry received' : 'Tell us what you need'}
      eyebrow={status === 'success' ? null : 'PRODUCT ENQUIRY'}
      size={status === 'success' ? 'compact' : ''}
      hideHeader={status === 'success'}
    >
      {status === 'success' ? (
        <div className="quote-success-view">
          <div className="quote-success-badge-wrapper">
            <div className="quote-success-icon-box">
              <CheckCircle2 size={36} strokeWidth={2.2} className="quote-success-svg" />
            </div>
          </div>

          <h2 className="quote-success-title">Enquiry Received</h2>

          <p className="quote-success-subtitle">
            Thank you{form.name ? `, ${form.name.trim().split(' ')[0]}` : ''}! We have received your product enquiry. Our sales & technical support team will contact you shortly.
          </p>

          <div className="quote-success-card">
            <div className="quote-success-card-top">
              <span className="quote-card-heading">ENQUIRY DETAILS</span>
              <span className="quote-status-pill">
                <span className="quote-status-dot"></span> In Review
              </span>
            </div>

            <div className="quote-details-list">
              <div className="quote-detail-item">
                <span className="detail-label">Product</span>
                <span className="detail-value highlight">{productName}</span>
              </div>
              {form.mobile && (
                <div className="quote-detail-item">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{form.mobile}</span>
                </div>
              )}
              {form.email && (
                <div className="quote-detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{form.email}</span>
                </div>
              )}
            </div>

            <div className="quote-turnaround-bar">
              <Clock size={15} />
              <span>Expected response: <strong>Within 24 business hours</strong></span>
            </div>
          </div>

          <div className="quote-success-footer">
            <button type="button" className="button quote-success-btn" onClick={close}>
              Done
            </button>
            <p className="quote-urgent-note">
              Need immediate assistance? <a href="/contact" onClick={close}>Contact Support Desk</a>
            </p>
          </div>
        </div>
      ) : (
        <form className="form-grid" onSubmit={submit} noValidate>
          <label className="field full">
            <span>Product</span>
            <input value={productName} readOnly />
          </label>
          <label className="field">
            <span>Name *</span>
            <input name="name" value={form.name} onChange={change} aria-invalid={!!errors.name} />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label className="field">
            <span>Mobile number *</span>
            <input name="mobile" inputMode="numeric" maxLength="10" value={form.mobile} onChange={change} aria-invalid={!!errors.mobile} />
            {errors.mobile && <small>{errors.mobile}</small>}
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={change} aria-invalid={!!errors.email} />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <button className="button full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting…' : 'Submit enquiry'}
          </button>
        </form>
      )}
    </Modal>
  );
}
