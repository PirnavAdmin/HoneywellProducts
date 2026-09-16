import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy, Wrench, ShieldCheck, Download, PhoneCall, Mail, Clock,
  MessageSquare, Send, Loader2, AlertCircle, CheckCircle2, X,
  ChevronRight, Bot, User, Ticket, Search, HelpCircle, Filter
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { getSupportConfig } from '../services/settingsApi';
import { API_BASE_URL } from '../services/api';
import heroImage from '../assets/images/capital-park2.jpg';

// ── API helpers for Support Bot Chat, Ticket, and FAQs ──
const SUPPORT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function sendBotChat(message) {
  const res = await fetch(`${API_BASE_URL}/api/Support/bot/chat`, {
    method: 'POST',
    headers: SUPPORT_HEADERS,
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Bot chat failed (${res.status})`);
  return res.json();
}

async function submitSupportTicket(payload) {
  const body = {
    name: payload.name || '',
    email: payload.email || '',
    phone: payload.phone || payload.mobile || '',
    subject: payload.subject || 'Support Request',
    message: payload.message || ''
  };
  const res = await fetch(`${API_BASE_URL}/api/Support/ticket`, {
    method: 'POST',
    headers: SUPPORT_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ticket submit failed (${res.status})`);
  return res.json();
}

async function fetchFaqs(category) {
  const url = category && category !== 'All'
    ? `${API_BASE_URL}/api/Support/faqs?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/api/Support/faqs`;
  const res = await fetch(url, { headers: SUPPORT_HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch FAQs (${res.status})`);
  return res.json();
}

const FAQ_CATEGORIES = [
  'All',
  'Warranty',
  'Technical Service',
  'Downloads',
  'Returns',
  'Software & Drivers',
];

// Parses paths inside parentheses like "Warranty Page (/warranty)" into React Router Links
const renderFaqAnswer = (text) => {
  if (!text) return '';
  const regex = /([A-Za-z0-9\s&]+)\s*\(((\/[a-zA-Z0-9\?\=\&\-_]+)+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1].trim();
    const linkPath = match[2].trim();
    parts.push(
      <Link key={match.index} to={linkPath} style={{ color: '#1268a5', fontWeight: 700, textDecoration: 'underline' }}>
        {label}
      </Link>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export default function SupportCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const isFaqsTab = searchParams.get('tab') === 'faqs' || window.location.pathname.includes('/faqs');

  // ── Support Config State (GET /api/Support/config) ──
  const [supportConfig, setSupportConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // ── Chatbot State (POST /api/Support/bot/chat) ──
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m the Honeywell Support Assistant. Ask me about returns, warranty, orders, or any product policy.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── Support Ticket State (POST /api/Support/ticket) ──
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', subject: '', category: 'General', message: '' });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);

  // ── FAQs State (GET /api/Support/faqs & GET /api/Support/faqs?category={cat}) ──
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [errorFaqs, setErrorFaqs] = useState(null);
  const [faqCategory, setFaqCategory] = useState(initialCategory);
  const [faqSearch, setFaqSearch] = useState('');
  const faqsRef = useRef(null);

  // ── Load Support Config on mount ──
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoadingConfig(true);
        const data = await getSupportConfig();
        setSupportConfig(data);
      } catch (err) {
        console.error('Failed to load support config:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  // ── Load FAQs from API when category changes ──
  useEffect(() => {
    async function loadFaqs() {
      try {
        setLoadingFaqs(true);
        setErrorFaqs(null);
        const data = await fetchFaqs(faqCategory);
        setFaqs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
        setErrorFaqs('Unable to load FAQs from API.');
      } finally {
        setLoadingFaqs(false);
      }
    }
    loadFaqs();
  }, [faqCategory]);

  // Scroll to FAQs section if tab=faqs or /faqs route
  useEffect(() => {
    if (isFaqsTab && faqsRef.current) {
      setTimeout(() => {
        faqsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [isFaqsTab]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Chatbot handler ──
  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await sendBotChat(msg);
      const botReply = data.reply || 'I apologize, I could not find an answer. Please submit a support ticket.';
      const links = data.suggestedLinks || [];

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: botReply,
          links,
        },
      ]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, I encountered an error. Please try again or submit a support ticket below.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Ticket handler ──
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (ticketLoading) return;

    setTicketLoading(true);
    setTicketResult(null);

    try {
      const data = await submitSupportTicket(ticketForm);
      setTicketResult({ success: true, message: data.message || 'Ticket submitted!', ticketId: data.ticketId });
      setTicketForm({ name: '', email: '', subject: '', category: 'General', message: '' });
    } catch (err) {
      console.error('Ticket error:', err);
      setTicketResult({ success: false, message: 'Failed to submit ticket. Please try again.' });
    } finally {
      setTicketLoading(false);
    }
  };

  const handleTicketChange = (field, value) => {
    setTicketForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (cat) => {
    setFaqCategory(cat);
    if (isFaqsTab) {
      setSearchParams(cat === 'All' ? { tab: 'faqs' } : { tab: 'faqs', category: cat });
    }
  };

  // Filter FAQs by local search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      if (!faqSearch.trim()) return true;
      const q = faqSearch.trim().toLowerCase();
      return (
        (item.question || '').toLowerCase().includes(q) ||
        (item.answer || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.code || '').toLowerCase().includes(q)
      );
    });
  }, [faqs, faqSearch]);

  return (
    <>
      <PageHero
        eyebrow="SUPPORT CENTER"
        title="Honeywell Customer Support Hub"
        description="We are here to assist with product setup, technical service, warranty claims, and documentation."
        image={heroImage}
      />

      <section className="section">
        <div className="container">

          {/* ── Section 1: Support Contact Info (from GET /api/Support/config) ── */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
              Contact Support
            </h2>

            {loadingConfig ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading support info...
              </div>
            ) : supportConfig ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {supportConfig.supportPhoneNumber && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fef2f2', color: '#e53935', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <PhoneCall size={22} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Support</p>
                      <a href={`tel:${supportConfig.supportPhoneNumber.replace(/\s/g, '')}`} style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
                        {supportConfig.supportPhoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                {supportConfig.supportEmail && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', color: '#1268a5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Mail size={22} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Support</p>
                      <a href={`mailto:${supportConfig.supportEmail}`} style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
                        {supportConfig.supportEmail}
                      </a>
                    </div>
                  </div>
                )}

                {supportConfig.workTimings && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Working Hours</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        {supportConfig.workTimings}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
                <AlertCircle size={18} /> Unable to load support contact info.
              </div>
            )}
          </div>

          {/* ── Section 2: Quick Links Hub Cards ── */}
          <div className="support-hubs-grid" style={{ marginBottom: '48px' }}>
            <Link to="/service-request" className="support-hub-card">
              <div className="hub-card-icon"><Wrench size={28} /></div>
              <h3>Service &amp; Repair Request</h3>
              <p>Submit a technical support or hardware repair ticket for your product.</p>
              <span className="hub-card-action">Submit Ticket &rarr;</span>
            </Link>

            <Link to="/warranty" className="support-hub-card">
              <div className="hub-card-icon"><ShieldCheck size={28} /></div>
              <h3>Warranty &amp; Returns</h3>
              <p>Check product warranty coverage, eligibility, and request RMA replacements.</p>
              <span className="hub-card-action">Check Warranty &rarr;</span>
            </Link>

            <Link to="/downloads" className="support-hub-card">
              <div className="hub-card-icon"><Download size={28} /></div>
              <h3>Downloads &amp; Software</h3>
              <p>Get official datasheets, user manuals, firmware updates, and software.</p>
              <span className="hub-card-action">Browse Downloads &rarr;</span>
            </Link>

            <Link to="/contact" className="support-hub-card">
              <div className="hub-card-icon"><PhoneCall size={28} /></div>
              <h3>Direct Contact</h3>
              <p>Get in touch with our customer assistance &amp; technical sales hotline.</p>
              <span className="hub-card-action">Contact Us &rarr;</span>
            </Link>
          </div>

          {/* ── Section 3: AI Support Chatbot (POST /api/Support/bot/chat) ── */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={24} style={{ color: '#1268a5' }} /> AI Support Assistant
            </h2>

            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
              overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {/* Chat Messages */}
              <div style={{
                height: '340px', overflowY: 'auto', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '14px',
                background: '#f8fafc',
              }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%', padding: '12px 16px', borderRadius: '12px',
                      background: msg.role === 'user' ? '#1268a5' : '#ffffff',
                      color: msg.role === 'user' ? '#fff' : '#334155',
                      border: msg.role === 'bot' ? '1px solid #e2e8f0' : 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', fontWeight: 700, opacity: 0.7 }}>
                        {msg.role === 'bot' ? <><Bot size={12} /> Support Bot</> : <><User size={12} /> You</>}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{msg.text}</p>
                      {msg.links && msg.links.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {msg.links.map((link, j) => (
                            <Link
                              key={j}
                              to={link.path}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '12px', fontWeight: 700, color: '#1268a5',
                                background: '#eff6ff', padding: '4px 10px', borderRadius: '6px',
                                textDecoration: 'none',
                              }}
                            >
                              {link.title} <ChevronRight size={12} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{
                display: 'flex', gap: '10px', padding: '14px 20px',
                borderTop: '1px solid #e2e8f0', background: '#fff',
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
                  placeholder="Ask about returns, warranty, shipping, orders..."
                  style={{
                    flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1',
                    borderRadius: '8px', fontSize: '14px', outline: 'none',
                  }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: '#1268a5', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px 18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontWeight: 700, fontSize: '14px',
                    opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={16} /> Send
                </button>
              </div>
            </div>
          </div>

          {/* ── Section 4: Submit Support Ticket (POST /api/Support/ticket) ── */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ticket size={24} style={{ color: '#e53935' }} /> Submit a Support Ticket
            </h2>

            {ticketResult && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px',
                borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: 600,
                background: ticketResult.success ? '#f0fdf4' : '#fef2f2',
                color: ticketResult.success ? '#16a34a' : '#dc2626',
                border: `1px solid ${ticketResult.success ? '#bbf7d0' : '#fca5a5'}`,
              }}>
                {ticketResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span>
                  {ticketResult.message}
                  {ticketResult.ticketId && <strong> (Ticket #{ticketResult.ticketId})</strong>}
                </span>
                <button onClick={() => setTicketResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleTicketSubmit}
              style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Full Name *</label>
                  <input
                    type="text"
                    value={ticketForm.name}
                    onChange={(e) => handleTicketChange('name', e.target.value)}
                    required
                    placeholder="Enter your full name"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Email Address *</label>
                  <input
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) => handleTicketChange('email', e.target.value)}
                    required
                    placeholder="you@email.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Subject *</label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => handleTicketChange('subject', e.target.value)}
                    required
                    placeholder="Briefly describe your issue"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => handleTicketChange('category', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', appearance: 'none', background: '#fff', cursor: 'pointer' }}
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Billing">Billing / Payment</option>
                    <option value="Returns">Returns / Refund</option>
                    <option value="Warranty">Warranty Claim</option>
                    <option value="Installation">Installation Help</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Detailed Message *</label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => handleTicketChange('message', e.target.value)}
                  required
                  rows={5}
                  placeholder="Provide a detailed description of your issue, including product name, order ID, and any error messages..."
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={ticketLoading}
                className="button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  fontWeight: 700, fontSize: '15px', padding: '12px 28px',
                  opacity: ticketLoading ? 0.7 : 1,
                }}
              >
                {ticketLoading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Support Ticket</>
                )}
              </button>
            </form>
          </div>

          {/* ── Section 5: FAQs (GET /api/Support/faqs & GET /api/Support/faqs?category={category}) ── */}
          <div ref={faqsRef} className="support-faqs-section" style={{ scrollMarginTop: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={24} style={{ color: '#1268a5' }} /> Frequently Asked Questions
              </h2>

              {/* Local Search inside FAQs */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search FAQs..."
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
                {faqSearch && (
                  <button onClick={() => setFaqSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (calls GET /api/Support/faqs?category={cat}) */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                    border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease',
                    borderColor: faqCategory === cat ? '#1268a5' : '#cbd5e1',
                    background: faqCategory === cat ? '#1268a5' : '#ffffff',
                    color: faqCategory === cat ? '#ffffff' : '#475569',
                  }}
                >
                  {cat === 'All' ? 'All Questions' : cat}
                </button>
              ))}
            </div>

            {/* FAQs Content / Accordion */}
            {loadingFaqs ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '32px 0', color: '#64748b', justifyContent: 'center' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
                <span>Loading FAQs from API...</span>
              </div>
            ) : errorFaqs ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
                <AlertCircle size={20} />
                <span>{errorFaqs}</span>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <HelpCircle size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#475569' }}>No matching FAQs found</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Try selecting a different category or clearing your search phrase.</p>
              </div>
            ) : (
              <div className="faqs-accordion">
                {filteredFaqs.map((item) => (
                  <details key={item.id || item.code || item.question} className="faq-item" defaultOpen={filteredFaqs.length === 1}>
                    <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.question}</span>
                      {item.category && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#eff6ff', color: '#1268a5', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', marginLeft: '12px' }}>
                          {item.category}
                        </span>
                      )}
                    </summary>
                    <p style={{ margin: '12px 0 0', lineHeight: 1.7, color: '#334155', fontSize: '14px' }}>
                      {renderFaqAnswer(item.answer)}
                    </p>
                  </details>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
