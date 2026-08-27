import { useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { chatService } from '../../services/chatService';

const suggestions = ['Find CCTV Cameras', 'Find IP Cameras', 'Solar Security Products', 'Product Enquiry', 'Get Bulk Quote', 'Become a Distributor', 'Contact Sales'];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello! How can I help you today?' }]);
  const send = async (value = input) => {
    if (!value.trim() || loading) return;
    setMessages((current) => [...current, { role: 'user', text: value }]); setInput(''); setLoading(true);
    const result = await chatService.send(value);
    setMessages((current) => [...current, { role: 'assistant', text: result.message }]); setLoading(false);
  };
  return (
    <>
      {open && <section className="chat-panel" aria-label="Honeywell Products Assistant">
        <header><span><Sparkles size={18} /> Honeywell Products Assistant<small>Demo responses</small></span><button onClick={() => setOpen(false)} aria-label="Close assistant"><X size={19} /></button></header>
        <div className="chat-messages">{messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}>{message.text}</div>)}{loading && <div className="chat-message assistant typing">•••</div>}</div>
        {messages.length < 3 && <div className="chat-suggestions">{suggestions.map((item) => <button key={item} onClick={() => send(item)}>{item}</button>)}</div>}
        <form onSubmit={(event) => { event.preventDefault(); send(); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" aria-label="Chat message" /><button aria-label="Send message"><Send size={18} /></button></form>
      </section>}
      <button className="floating-chat" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close Honeywell Products Assistant' : 'Open Honeywell Products Assistant'}>{open ? <X /> : <Bot />}</button>
    </>
  );
}
