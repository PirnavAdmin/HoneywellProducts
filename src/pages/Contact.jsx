import { useState } from 'react';
import { ArrowRight, Building2, Headphones, Handshake, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { siteConfig } from '../config/siteConfig';
import { contactService } from '../services/contactService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/capital-park2.jpg';

const contacts = [
  { icon: Building2, title: 'Corporate Office', text: siteConfig.address },
  { icon: ShoppingBag, title: 'Sales Enquiries', text: `${siteConfig.email} · ${siteConfig.phone}` },
  { icon: Headphones, title: 'Technical Support', text: `${siteConfig.email} · ${siteConfig.phone}` },
  { icon: Handshake, title: 'Business Partnerships', text: `${siteConfig.email} · ${siteConfig.phone}` },
];
const empty = { name: '', mobile: '', email: '', company: '', enquiryType: '', message: '' };

export default function Contact() {
  useDocumentTitle('Contact Us', 'Send a product, sales, dealer, distributor or support enquiry.');
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.enquiryType) next.enquiryType = 'Select an enquiry type.';
    if (!form.message.trim()) next.message = 'Please enter your message.';
    setErrors(next); return Object.keys(next).length === 0;
  };
  const submit = async (event) => { event.preventDefault(); if (!validate()) return; setStatus('loading'); await contactService.submit(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))); setStatus('success'); };
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  return <>
    <PageHero eyebrow="CONTACT US" title="Talk to Our Team" description="Send a product, sales, support or business enquiry through the prepared frontend workflow." image={heroImage} />
    <section className="section contact-section"><div className="container contact-layout"><div className="contact-copy"><p className="eyebrow dark">START A CONVERSATION</p><h2>Make Your Next Security Decision With Clarity.</h2><p>Reach our Hyderabad office for product, sales, technical support, and business partnership enquiries.</p><div className="contact-meta"><span><MapPin /><a href={siteConfig.mapLink} target="_blank" rel="noreferrer">{siteConfig.address}</a></span><span><Phone /><a href={siteConfig.phoneLink}>{siteConfig.phone}</a></span><span><Mail /><a href={siteConfig.emailLink}>{siteConfig.email}</a></span></div></div><div className="contact-form-wrap">{status === 'success' ? <div className="success-state"><span>✓</span><h2>Message received</h2><p>Thank you. Your frontend demo submission was successful.</p><button className="button outline" onClick={() => { setForm(empty); setStatus('idle'); }}>Send Another Message</button></div> : <form className="form-grid" onSubmit={submit} noValidate>
      <label className="field"><span>Name *</span><input name="name" value={form.name} onChange={change} />{errors.name && <small>{errors.name}</small>}</label>
      <label className="field"><span>Mobile *</span><input name="mobile" value={form.mobile} onChange={change} inputMode="numeric" maxLength="10" />{errors.mobile && <small>{errors.mobile}</small>}</label>
      <label className="field"><span>Email *</span><input name="email" value={form.email} onChange={change} type="email" />{errors.email && <small>{errors.email}</small>}</label>
      <label className="field"><span>Company</span><input name="company" value={form.company} onChange={change} /></label>
      <label className="field full"><span>Enquiry Type *</span><select name="enquiryType" value={form.enquiryType} onChange={change}><option value="">Select enquiry type</option>{['Product Enquiry', 'Sales Enquiry', 'Dealer Enquiry', 'Distributor Enquiry', 'Support Enquiry'].map((item) => <option key={item}>{item}</option>)}</select>{errors.enquiryType && <small>{errors.enquiryType}</small>}</label>
      <label className="field full"><span>Message *</span><textarea name="message" value={form.message} onChange={change} rows="5" />{errors.message && <small>{errors.message}</small>}</label>
      <button className="button full" disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : <>Submit Message <ArrowRight /></>}</button>
    </form>}</div></div></section>
    <section className="contact-paths"><div className="container">{contacts.map(({ icon: Icon, ...item }) => <article key={item.title}><Icon /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
  </>;
}
