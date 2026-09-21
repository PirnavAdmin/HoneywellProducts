import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import EnquiryModal from '../forms/EnquiryModal';
import BulkQuoteModal from '../forms/BulkQuoteModal';
import Chatbot from '../chatbot/Chatbot';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { socialLinks } from '../../config/socialLinks';
import { useUI } from '../../context/UIContext';

export default function Layout() {
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);
  const { toast } = useUI();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  useEffect(() => { const listener = () => setShowTop(window.scrollY > 700); window.addEventListener('scroll', listener); return () => window.removeEventListener('scroll', listener); }, []);
  return (
    <div className="site-shell">
      <Header />
      <main><Outlet /></main>
      <Footer />
      <EnquiryModal />
      <BulkQuoteModal />
      <Chatbot />
      <button className={`whatsapp-button ${!socialLinks.whatsapp ? 'disabled' : ''}`} onClick={() => socialLinks.whatsapp && window.open(socialLinks.whatsapp, '_blank', 'noopener')} aria-label={socialLinks.whatsapp ? 'Contact on WhatsApp' : 'WhatsApp link not configured'} title={socialLinks.whatsapp ? 'WhatsApp' : 'WhatsApp link will be added by the client'}><WhatsAppIcon size={24} /></button>
      {showTop && <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><ArrowUp /></button>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
