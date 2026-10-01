import { useState, useEffect } from 'react';
import { ArrowRight, Building2, Headphones, Handshake, Mail, MapPin, Phone, ShoppingBag, AlertCircle } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { siteConfig } from '../config/siteConfig';
import { contactService } from '../services/contactService';
import { getSupportConfig, getContactCard } from '../services/settingsApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/capital-park2.jpg';

const empty = { name: '', mobile: '', email: '', company: '', enquiryType: '', message: '' };

export default function Contact() {
  useDocumentTitle('Contact Us', 'Send a product, sales, dealer, distributor or support enquiry.');
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedId, setSubmittedId] = useState(null);
  const [supportInfo, setSupportInfo] = useState({
    phone: '',
    email: '',
    workTimings: '',
    address: '',
    googleMapsUrl: ''
  });

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const [suppConfig, cardConfig] = await Promise.allSettled([
          getSupportConfig(),
          getContactCard()
        ]);
        if (!isMounted) return;

        const supp = suppConfig.status === 'fulfilled' ? suppConfig.value : {};
        const card = cardConfig.status === 'fulfilled' ? cardConfig.value : {};

        setSupportInfo({
          phone: supp.supportPhoneNumber || card.phone || card.supportHotline || siteConfig.phone,
          email: supp.supportEmail || card.email || card.supportEmail || siteConfig.email,
          workTimings: supp.workTimings || card.businessHours || card.workingHours || '',
          address: card.address || siteConfig.address,
          googleMapsUrl: card.googleMapsUrl || siteConfig.mapLink
        });
      } catch (err) {
        console.error('Failed to load contact configuration:', err);
      }
    }
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const phoneDisplay = supportInfo.phone || siteConfig.phone;
  const emailDisplay = supportInfo.email || siteConfig.email;
  const addressDisplay = supportInfo.address || siteConfig.address;
  const mapLinkDisplay = supportInfo.googleMapsUrl || siteConfig.mapLink;

  const contacts = [
    { icon: Building2, title: 'Corporate Office', text: addressDisplay },
    { icon: ShoppingBag, title: 'Sales Enquiries', text: `${emailDisplay} · ${phoneDisplay}` },
    { icon: Headphones, title: 'Technical Support', text: `${emailDisplay} · ${phoneDisplay}` },
    { icon: Handshake, title: 'Business Partnerships', text: `${emailDisplay} · ${phoneDisplay}` },
  ];

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.enquiryType) next.enquiryType = 'Select an enquiry type.';
    if (!form.message.trim()) next.message = 'Please enter your message.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await contactService.submit(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])));
      if (res && res.id) {
        setSubmittedId(res.id);
      }
      setStatus('success');
    } catch (err) {
      console.error('Contact submission error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to submit enquiry. Please check your submission and try again.');
    }
  };

  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  return (
    <>
      <PageHero pageType="Contact" eyebrow="CONTACT US" title="Talk to Our Team" description="Send a product, sales, support or business enquiry to Honeywell." image={heroImage} />
      <section className="section contact-section">
        <div className="container contact-layout">
          <div className="contact-copy">
            <p className="eyebrow dark">START A CONVERSATION</p>
            <h2>Make Your Next Security Decision With Clarity.</h2>
            <p>Reach our office for product, sales, technical support, and business partnership enquiries.</p>
            <div className="contact-meta">
              <span><MapPin /><a href={mapLinkDisplay} target="_blank" rel="noreferrer">{addressDisplay}</a></span>
              <span><Phone /><a href={`tel:${phoneDisplay.replace(/\s/g, '')}`}>{phoneDisplay}</a></span>
              <span><Mail /><a href={`mailto:${emailDisplay}`}>{emailDisplay}</a></span>
            </div>
          </div>
          <div className="contact-form-wrap">
            {status === 'success' ? (
              <div className="success-state">
                <span>✓</span>
                <h2>Message received</h2>
                <p>
                  Thank you. Your message has been submitted successfully
                  {submittedId ? <strong> (Ref ID: #{submittedId})</strong> : ''}. Our team will contact you shortly.
                </p>
                <button className="button outline" onClick={() => { setForm(empty); setStatus('idle'); setSubmittedId(null); }}>Send Another Message</button>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit} noValidate>
                {status === 'error' && (
                  <div className="field full" style={{ color: '#ef4444', background: '#fef2f2', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <label className="field"><span>Name *</span><input name="name" value={form.name} onChange={change} />{errors.name && <small>{errors.name}</small>}</label>
                <label className="field"><span>Mobile *</span><input name="mobile" value={form.mobile} onChange={change} inputMode="numeric" maxLength="10" />{errors.mobile && <small>{errors.mobile}</small>}</label>
                <label className="field"><span>Email *</span><input name="email" value={form.email} onChange={change} type="email" />{errors.email && <small>{errors.email}</small>}</label>
                <label className="field"><span>Company</span><input name="company" value={form.company} onChange={change} /></label>
                <label className="field full"><span>Enquiry Type *</span><select name="enquiryType" value={form.enquiryType} onChange={change}><option value="">Select enquiry type</option>{['Product Enquiry', 'Sales Enquiry', 'Dealer Enquiry', 'Distributor Enquiry', 'Support Enquiry'].map((item) => <option key={item}>{item}</option>)}</select>{errors.enquiryType && <small>{errors.enquiryType}</small>}</label>
                <label className="field full"><span>Message *</span><textarea name="message" value={form.message} onChange={change} rows="5" /></label>
                {errors.message && <small>{errors.message}</small>}
                <button className="button full" disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : <>Submit Message <ArrowRight /></>}</button>
              </form>
            )}
          </div>
        </div>
      </section>
      <section className="contact-paths"><div className="container">{contacts.map(({ icon: Icon, ...item }) => <article key={item.title}><Icon /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    </>
  );
}
