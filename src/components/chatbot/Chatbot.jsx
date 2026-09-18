import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, Copy, Check, User } from 'lucide-react';
import { chatService } from '../../services/chatService';

const DEFAULT_SUGGESTIONS = [
  'Find CCTV Cameras',
  'Find IP Cameras',
  'Solar Security Products',
  'Product Enquiry',
  'Get Bulk Quote',
  'Become a Distributor',
  'Contact Sales'
];

/**
 * Custom Markdown & Rich Text Formatter for ChatGPT / Antigravity Style Messages
 */
function FormatMessage({ text }) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');

  return (
    <div className="chat-markdown-content">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Bullet list item
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="chat-bullet-item" style={{ display: 'flex', gap: '6px', margin: '4px 0 4px 8px' }}>
              <span style={{ color: 'var(--red, #e31837)', fontWeight: 'bold' }}>•</span>
              <span>{parseInlineMarkdown(content)}</span>
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        // Normal paragraph line
        return (
          <p key={idx} style={{ margin: '4px 0', lineHeight: '1.5' }}>
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(str) {
  // Regex to match **bold** and URLs
  const parts = [];
  let lastIdx = 0;
  const regex = /(\*\*.*?\*\*|https?:\/\/[^\s]+)/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('http')) {
      parts.push(
        <a 
          key={match.index} 
          href={token} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#0066cc', textDecoration: 'underline' }}
        >
          {token}
        </a>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length ? parts : str;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'Hello! I am your **Honeywell AI Assistant**.\nHow can I help you today? Select a topic below or ask any question about our products, pricing, or specifications.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatService.getChatConfig().then((config) => {
      if (config?.suggestions?.length) {
        setSuggestions(config.suggestions);
      }
      if (config?.welcomeMessage) {
        setMessages([{ 
          role: 'assistant', 
          text: config.welcomeMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }).catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open, loading]);

  const send = async (value = input) => {
    const textToSend = typeof value === 'string' ? value : input;
    if (!textToSend.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => [...current, { role: 'user', text: textToSend, time: userTime }]);
    setInput('');
    setLoading(true);

    const result = await chatService.send(textToSend);
    const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((current) => [...current, { role: 'assistant', text: result.message, time: assistantTime }]);
    setLoading(false);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const resetChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        text: 'Hello! I am your **Honeywell AI Assistant**.\nHow can I help you today? Select a topic below or type your question.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {open && (
        <section className="chat-panel antigravity-ai-theme" aria-label="Honeywell Products AI Assistant">
          <header className="chat-header">
            <div className="chat-header-title">
              <Sparkles size={18} className="ai-sparkles-icon" />
              <div>
                <strong>Honeywell AI Assistant</strong>
                <small className="ai-badge">Live ChatGPT Mode</small>
              </div>
            </div>
            <div className="chat-header-actions">
              <button onClick={resetChat} title="Reset Chat" aria-label="New Conversation" className="header-action-btn">
                <RefreshCw size={16} />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="header-action-btn">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message-row ${message.role}`}>
                <div className="chat-avatar">
                  {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="chat-bubble-container">
                  <div className={`chat-message ${message.role}`}>
                    <FormatMessage text={message.text} />
                  </div>
                  <div className="chat-message-footer">
                    <span className="chat-timestamp">{message.time}</span>
                    {message.role === 'assistant' && (
                      <button 
                        onClick={() => handleCopy(message.text, index)} 
                        className="chat-copy-btn"
                        title="Copy response"
                      >
                        {copiedIdx === index ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-message-row assistant">
                <div className="chat-avatar"><Bot size={16} /></div>
                <div className="chat-bubble-container">
                  <div className="chat-message assistant typing-indicator">
                    <span>•</span><span>•</span><span>•</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-suggestions">
            {suggestions.map((item) => (
              <button key={item} onClick={() => send(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="chat-input-form">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask Honeywell AI anything…" 
              aria-label="Chat message" 
              disabled={loading}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button 
        className="floating-chat" 
        onClick={() => setOpen((value) => !value)} 
        aria-label={open ? 'Close Honeywell Products Assistant' : 'Open Honeywell Products Assistant'}
      >
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>
    </>
  );
}
