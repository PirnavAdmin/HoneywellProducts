import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, X, Youtube } from 'lucide-react';
import Brand from '../common/Brand';
import SearchPanel from '../common/SearchPanel';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { socialLinks } from '../../config/socialLinks';
import { siteConfig } from '../../config/siteConfig';

const links = [['/', 'Home'], ['/products', 'Products'], ['/solutions', 'Solutions'], ['/business', 'Business'], ['/about-us', 'About Us'], ['/contact', 'Contact Us']];
const topSocialIcons = { facebook: Facebook, whatsapp: MessageCircle, linkedin: Linkedin, instagram: Instagram, youtube: Youtube };

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const { count } = useCart();
  const { openQuote } = useUI();
  useEffect(() => { const onScroll = () => setCompact(window.scrollY > 36); onScroll(); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);
  return (
    <>
      <div className="demo-strip">
        <div className="topbar-content">
          <div className="topbar-contact">
            <span><Phone size={13} /><a href={siteConfig.phoneLink}>{siteConfig.phone}</a></span>
            <span><Mail size={13} /><a href={siteConfig.emailLink}>{siteConfig.email}</a></span>
            <span className="topbar-address" title={siteConfig.address}><MapPin size={13} /><a href={siteConfig.mapLink} target="_blank" rel="noreferrer">{siteConfig.address}</a></span>
          </div>
          <div className="topbar-social">
            <span className="topbar-follow">Follow us:</span>
            {Object.entries(topSocialIcons).map(([name, Icon]) => socialLinks[name]
              ? <a key={name} href={socialLinks[name]} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}><Icon size={15} /></a>
              : <span key={name} className="disabled" aria-label={`${name} link not configured`} title="Link not configured"><Icon size={15} /></span>)}
          </div>
        </div>
      </div>
      <header className={`header ${compact ? 'compact' : ''}`}>
        <Brand />
        <nav aria-label="Main navigation">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search products"><Search size={20} /></button>
          <Link className="icon-button cart-link" to="/cart" aria-label={`Shopping cart with ${count} items`}><ShoppingBag size={20} />{count > 0 && <span>{count}</span>}</Link>
          <button className="button button-small" onClick={() => openQuote()}>Get a Quote</button>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={23} /></button>
        </div>
      </header>
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <button className="icon-button drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        <Brand />
        <nav aria-label="Mobile navigation">{links.map(([to, label], index) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><small>0{index + 1}</small>{label}</NavLink>)}</nav>
        <button className="button" onClick={() => { setMenuOpen(false); openQuote(); }}>Get a Quote</button>
      </div>
      {menuOpen && <div className="drawer-scrim" onClick={() => setMenuOpen(false)} />}
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
