import { ArrowRight, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function OrderSuccess() {
  useDocumentTitle('Cart Request Complete', 'Frontend cart request confirmation screen.');
  const { state } = useLocation();
  return <section className="order-success"><div><span className="success-icon"><Check /></span><p className="eyebrow dark">CART REQUEST COMPLETE</p><h1>Your product selection is ready.</h1><p>This frontend confirmation demonstrates the cart workflow. No order, payment or personal data was transmitted.</p><dl><div><dt>Local reference</dt><dd>{state?.reference || 'HW-CART-PREVIEW'}</dd></div><div><dt>Status</dt><dd>Backend integration pending</dd></div></dl><Link className="button" to="/products">Continue exploring <ArrowRight /></Link></div></section>;
}
