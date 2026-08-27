import { useState } from 'react';
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
    await enquiryService.submit({
      productId: enquiryProduct?.id || null,
      productName,
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
    });
    setStatus('success');
  };
  const close = () => { closeEnquiry(); window.setTimeout(() => { setForm(initial); setStatus('idle'); setErrors({}); }, 250); };

  return (
    <Modal open={enquiryOpen} onClose={close} title={status === 'success' ? 'Enquiry received' : 'Tell us what you need'} eyebrow="PRODUCT ENQUIRY">
      {status === 'success' ? (
        <div className="success-state"><span>✓</span><p>Thank you for your enquiry. Our team will contact you soon.</p><button className="button" onClick={close}>Done</button></div>
      ) : (
        <form className="form-grid" onSubmit={submit} noValidate>
          <label className="field full"><span>Product</span><input value={productName} readOnly /></label>
          <label className="field"><span>Name *</span><input name="name" value={form.name} onChange={change} aria-invalid={!!errors.name} />{errors.name && <small>{errors.name}</small>}</label>
          <label className="field"><span>Mobile number *</span><input name="mobile" inputMode="numeric" maxLength="10" value={form.mobile} onChange={change} aria-invalid={!!errors.mobile} />{errors.mobile && <small>{errors.mobile}</small>}</label>
          <label className="field"><span>Email</span><input name="email" type="email" value={form.email} onChange={change} aria-invalid={!!errors.email} />{errors.email && <small>{errors.email}</small>}</label>
          <button className="button full" disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : 'Submit enquiry'}</button>
        </form>
      )}
    </Modal>
  );
}
