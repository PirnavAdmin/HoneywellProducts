import { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [toast, setToast] = useState('');

  const openEnquiry = (product = null) => { setEnquiryProduct(product); setEnquiryOpen(true); };
  const closeEnquiry = () => setEnquiryOpen(false);
  const openQuote = (product = null) => { setQuoteProduct(product); setQuoteOpen(true); };
  const closeQuote = () => setQuoteOpen(false);
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  return <UIContext.Provider value={{ enquiryProduct, enquiryOpen, openEnquiry, closeEnquiry, quoteProduct, quoteOpen, openQuote, closeQuote, toast, notify }}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
