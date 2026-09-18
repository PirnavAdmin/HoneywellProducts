import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() { useDocumentTitle('Page Not Found'); return <section className="not-found"><span>404</span><h1>This route needs a new connection.</h1><p>The page you requested is not part of this prototype.</p><Link className="button" to="/"><ArrowLeft /> Return home</Link></section>; }
