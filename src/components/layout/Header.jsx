import { useEffect, useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, X, Youtube } from 'lucide-react';
import Brand from '../common/Brand';
import SearchPanel from '../common/SearchPanel';
import ProductsMegaMenu from '../navigation/ProductsMegaMenu';
import SolutionsMegaMenu from '../navigation/SolutionsMegaMenu';
import BusinessMegaMenu from '../navigation/BusinessMegaMenu';
import ResourcesMegaMenu from '../navigation/ResourcesMegaMenu';
import AccountMenu from '../navigation/AccountMenu';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { socialLinks } from '../../config/socialLinks';
import { siteConfig } from '../../config/siteConfig';

<<<<<<< HEAD
const links = [['/', 'Home'], ['/products', 'Products'], ['/solutions', 'Solutions'], ['/business', 'Business'], ['/about-us', 'About Us'], ['/contact', 'Contact Us']];
=======
>>>>>>> 3c16d128d18ee589eb719f1cff04b855bcf40e98
const topSocialIcons = { facebook: Facebook, whatsapp: MessageCircle, linkedin: Linkedin, instagram: Instagram, youtube: Youtube };

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState({});

  const { count } = useCart();
  const { openQuote } = useUI();
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeMenus = () => {
    setActiveDropdown(null);
    setMenuOpen(false);
  };

  const toggleMobileAccordion = (key) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

        <nav aria-label="Main navigation" ref={navRef}>
          <NavLink to="/" end onClick={closeMenus}>Home</NavLink>

          {/* Products Mega Menu Item */}
          <div 
            className={`nav-dropdown-wrapper ${activeDropdown === 'products' ? 'open' : ''}`}
            onMouseEnter={() => setActiveDropdown('products')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <NavLink 
              to="/products" 
              className={({ isActive }) => `nav-dropdown-trigger ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (window.innerWidth <= 1024) {
                  e.preventDefault();
                  toggleDropdown('products');
                }
              }}
            >
              Products <ChevronDown size={14} className="dropdown-arrow" />
            </NavLink>
            {activeDropdown === 'products' && <ProductsMegaMenu onClose={closeMenus} />}
          </div>

          {/* Solutions Mega Menu Item */}
          <div 
            className={`nav-dropdown-wrapper ${activeDropdown === 'solutions' ? 'open' : ''}`}
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <NavLink 
              to="/solutions" 
              className={({ isActive }) => `nav-dropdown-trigger ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (window.innerWidth <= 1024) {
                  e.preventDefault();
                  toggleDropdown('solutions');
                }
              }}
            >
              Solutions <ChevronDown size={14} className="dropdown-arrow" />
            </NavLink>
            {activeDropdown === 'solutions' && <SolutionsMegaMenu onClose={closeMenus} />}
          </div>

          {/* Business Mega Menu Item */}
          <div 
            className={`nav-dropdown-wrapper ${activeDropdown === 'business' ? 'open' : ''}`}
            onMouseEnter={() => setActiveDropdown('business')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <NavLink 
              to="/business" 
              className={({ isActive }) => `nav-dropdown-trigger ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (window.innerWidth <= 1024) {
                  e.preventDefault();
                  toggleDropdown('business');
                }
              }}
            >
              Business <ChevronDown size={14} className="dropdown-arrow" />
            </NavLink>
            {activeDropdown === 'business' && <BusinessMegaMenu onClose={closeMenus} />}
          </div>

          <NavLink to="/about-us" onClick={closeMenus}>About Us</NavLink>

          {/* Resources Mega Menu Item */}
          <div 
            className={`nav-dropdown-wrapper ${activeDropdown === 'resources' ? 'open' : ''}`}
            onMouseEnter={() => setActiveDropdown('resources')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <NavLink 
              to="/resources" 
              className={({ isActive }) => `nav-dropdown-trigger ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (window.innerWidth <= 1024) {
                  e.preventDefault();
                  toggleDropdown('resources');
                }
              }}
            >
              Resources <ChevronDown size={14} className="dropdown-arrow" />
            </NavLink>
            {activeDropdown === 'resources' && <ResourcesMegaMenu onClose={closeMenus} />}
          </div>

          <NavLink to="/contact" onClick={closeMenus}>Contact Us</NavLink>
        </nav>

        <div className="header-actions">
          <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search products"><Search size={20} /></button>
          <AccountMenu />
          <Link className="icon-button cart-link" to="/cart" aria-label={`Shopping cart with ${count} items`}><ShoppingBag size={20} />{count > 0 && <span>{count}</span>}</Link>
          <button className="button button-small" onClick={() => openQuote()}>Get a Quote</button>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={23} /></button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <button className="icon-button drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        <Brand />
        <nav aria-label="Mobile navigation" className="mobile-nav-accordion">
          <NavLink to="/" onClick={closeMenus}>Home</NavLink>

          {/* Mobile Accordion: Products */}
          <div className="mobile-acc-item">
            <button className="mobile-acc-header" onClick={() => toggleMobileAccordion('products')}>
              <span>Products</span>
              <ChevronDown size={16} className={mobileExpanded['products'] ? 'rotated' : ''} />
            </button>
            {mobileExpanded['products'] && (
              <div className="mobile-acc-body">
                <Link to="/products" onClick={closeMenus}>View All Products</Link>
                <Link to="/products?category=cctv-cameras" onClick={closeMenus}>CCTV Cameras</Link>
                <Link to="/products?category=solar-panels" onClick={closeMenus}>Solar Panels</Link>
                <Link to="/product-finder" onClick={closeMenus}>Product Finder</Link>
                <Link to="/compare" onClick={closeMenus}>Compare Products</Link>
                <Link to="/offers" onClick={closeMenus}>Offers &amp; Deals</Link>
                <Link to="/downloads" onClick={closeMenus}>Downloads</Link>
              </div>
            )}
          </div>

          {/* Mobile Accordion: Solutions */}
          <div className="mobile-acc-item">
            <button className="mobile-acc-header" onClick={() => toggleMobileAccordion('solutions')}>
              <span>Solutions</span>
              <ChevronDown size={16} className={mobileExpanded['solutions'] ? 'rotated' : ''} />
            </button>
            {mobileExpanded['solutions'] && (
              <div className="mobile-acc-body">
                <Link to="/solutions" onClick={closeMenus}>Overview</Link>
                <Link to="/industries" onClick={closeMenus}>Industries</Link>
                <Link to="/solutions?solution=security-surveillance" onClick={closeMenus}>Security &amp; Surveillance</Link>
                <Link to="/solutions?solution=solar-solutions" onClick={closeMenus}>Solar Solutions</Link>
              </div>
            )}
          </div>

          {/* Mobile Accordion: Business */}
          <div className="mobile-acc-item">
            <button className="mobile-acc-header" onClick={() => toggleMobileAccordion('business')}>
              <span>Business</span>
              <ChevronDown size={16} className={mobileExpanded['business'] ? 'rotated' : ''} />
            </button>
            {mobileExpanded['business'] && (
              <div className="mobile-acc-body">
                <Link to="/business" onClick={closeMenus}>Business Opportunities</Link>
                <Link to="/partner-benefits" onClick={closeMenus}>Partner Benefits</Link>
                <Link to="/partner/login" onClick={closeMenus}>Partner Login</Link>
                <Link to="/partner/dashboard" onClick={closeMenus}>Partner Dashboard</Link>
              </div>
            )}
          </div>

          <NavLink to="/about-us" onClick={closeMenus}>About Us</NavLink>

          {/* Mobile Accordion: Resources */}
          <div className="mobile-acc-item">
            <button className="mobile-acc-header" onClick={() => toggleMobileAccordion('resources')}>
              <span>Resources</span>
              <ChevronDown size={16} className={mobileExpanded['resources'] ? 'rotated' : ''} />
            </button>
            {mobileExpanded['resources'] && (
              <div className="mobile-acc-body">
                <Link to="/resources" onClick={closeMenus}>Resource Hub</Link>
                <Link to="/blogs" onClick={closeMenus}>Blog &amp; News</Link>
                <Link to="/case-studies" onClick={closeMenus}>Case Studies</Link>
                <Link to="/videos" onClick={closeMenus}>Videos</Link>
                <Link to="/downloads" onClick={closeMenus}>Downloads</Link>
                <Link to="/support" onClick={closeMenus}>Support Center</Link>
                <Link to="/service-request" onClick={closeMenus}>Service Request</Link>
                <Link to="/warranty" onClick={closeMenus}>Warranty</Link>
              </div>
            )}
          </div>

          <NavLink to="/contact" onClick={closeMenus}>Contact Us</NavLink>
        </nav>
        <button className="button" onClick={() => { setMenuOpen(false); openQuote(); }}>Get a Quote</button>
      </div>
      {menuOpen && <div className="drawer-scrim" onClick={() => setMenuOpen(false)} />}
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
