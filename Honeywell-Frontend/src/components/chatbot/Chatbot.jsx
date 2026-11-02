import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, Sparkles, ChevronRight } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useUI } from '../../context/UIContext';

const suggestions = [
  'Find CCTV Cameras',
  'Find IP Cameras',
  'Solar Security Products',
  'Product Enquiry',
  'Get Bulk Quote',
  'Become a Distributor',
  'Contact Sales'
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! How can I help you today? You can ask me about CCTV cameras, solar security, bulk quotes, order tracking, or partner opportunities.' }
  ]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { openQuote, openEnquiry } = useUI();

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  const send = async (value = input) => {
    const textToSend = typeof value === 'string' ? value : input;
    if (!textToSend.trim() || loading) return;

    setMessages((current) => [...current, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    const result = await chatService.send(textToSend);
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: result.message,
        products: result.products || [],
        actions: result.suggestedActions || []
      }
    ]);
    setLoading(false);
  };

  const handleActionClick = (act) => {
    if (!act) return;
    const url = typeof act === 'string' ? act : (act.url || act.path || '');
    const title = typeof act === 'string' ? '' : (act.title || '');

    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // 1. Bulk Quote action -> Open the Bulk Quote Modal
    if (lowerUrl.includes('quote') || lowerTitle.includes('quote')) {
      openQuote();
      return;
    }

    // 2. Enquiry action -> Open the Enquiry Modal
    if (lowerUrl.includes('enquir') || lowerTitle.includes('enquir')) {
      openEnquiry();
      return;
    }

    // 3. External link
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // 4. Products / Catalog navigation -> always navigate to /products
    if (
      lowerUrl === '/catalog' ||
      lowerUrl === 'catalog' ||
      lowerUrl === '/products' ||
      lowerUrl === 'products' ||
      lowerTitle.includes('catalog') ||
      lowerTitle.includes('product') ||
      lowerTitle.includes('camera')
    ) {
      navigate('/products');
      return;
    }

    navigate(url);
  };

  return (
    <>
      {open && (
        <section className="chat-panel" aria-label="Honeywell Products Assistant">
          <header>
            <span>
              <Sparkles size={18} /> Honeywell Products Assistant
              <small>Live AI Assistant</small>
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">
              <X size={19} />
            </button>
          </header>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`} style={{ whiteSpace: 'pre-wrap' }}>
                <div>{message.text}</div>

                {/* Rich Product Cards */}
                {message.products && message.products.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {message.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => navigate(`/products/${prod.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1268a5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
                        title={`View ${prod.name}`}
                      >
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', background: '#f8fafc', flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {prod.model} • <strong style={{ color: '#059669' }}>₹{Number(prod.price).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {message.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleActionClick(act)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: act.title?.toLowerCase().includes('quote') ? '1px solid #1268a5' : '1px solid #d1d5db',
                          background: act.title?.toLowerCase().includes('quote') ? '#eff6ff' : '#ffffff',
                          color: act.title?.toLowerCase().includes('quote') ? '#1268a5' : '#1e293b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {act.title} <ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="chat-message assistant typing">•••</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length < 3 && (
            <div className="chat-suggestions">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item.toLowerCase().includes('quote')) {
                      openQuote();
                    } else if (item.toLowerCase().includes('enquiry')) {
                      openEnquiry();
                    } else {
                      send(item);
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              aria-label="Chat message"
            />
            <button type="submit" aria-label="Send message">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <button
        className="floating-chat"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close Honeywell Products Assistant' : 'Open Honeywell Products Assistant'}
      >
        {open ? <X /> : <Bot />}
      </button>
    </>
  );
}
