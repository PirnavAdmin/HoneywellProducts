import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube, Phone, MapPin } from 'lucide-react';
import Brand from '../common/Brand';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { socialLinks } from '../../config/socialLinks';
import { siteConfig } from '../../config/siteConfig';
import { getFooterConfig } from '../../services/settingsApi';
import { useSettings } from '../../context/SettingsContext';

const socialIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: WhatsAppIcon,
  email: Mail
};

const DEFAULT_FOOTER = {
  copyrightText: `© ${new Date().getFullYear()} Honeywell International Inc. All rights reserved.`,
  aboutSummary: '',
  privacyPolicyUrl: '/privacy-policy',
  termsUrl: '/terms-and-conditions',
  returnRefundPolicyUrl: '/return-refund-policy',
  shippingPolicyUrl: '/shipping-delivery-policy',
  cancellationPolicyUrl: '/cancellation-policy',
  warrantyPolicyUrl: '/warranty-policy',
  cookiePolicyUrl: '/cookie-policy',
  grievancePolicyUrl: '/grievance-redressal',
  facebookUrl: 'https://facebook.com/honeywell',
  twitterUrl: 'https://twitter.com/honeywell',
  linkedinUrl: 'https://linkedin.com/company/honeywell'
};

export default function Footer() {
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER);
  const { priceVisibility } = useSettings();

  useEffect(() => {
    let isMounted = true;

    const loadFooterData = async () => {
      try {
        const data = await getFooterConfig();
        if (data && isMounted) {
          setFooterData(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('Failed to load dynamic footer configuration:', err);
      }
    };

    loadFooterData();

    const handleUpdate = () => {
      loadFooterData();
    };

    window.addEventListener('footer-config-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('footer-config-updated', handleUpdate);
    };
  }, []);

  const getSocialUrl = (name) => {
    if (name === 'facebook' && footerData.facebookUrl) return footerData.facebookUrl;
    if (name === 'twitter' && footerData.twitterUrl) return footerData.twitterUrl;
    if (name === 'linkedin' && footerData.linkedinUrl) return footerData.linkedinUrl;
    return socialLinks[name] || '';
  };

  const renderPolicyLink = (label, url, defaultUrl) => {
    const target = url || defaultUrl;
    if (!target) return null;
    const isExternal = target.startsWith('http://') || target.startsWith('https://') || target.startsWith('//');
    if (isExternal) {
      return (
        <a key={label} href={target} target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    }
    return (
      <Link key={label} to={target}>
        {label}
      </Link>
    );
  };

  return (
    <footer className="footer" id="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Brand light />
          {Boolean(footerData.aboutSummary && footerData.aboutSummary.trim()) && (
            <p>{footerData.aboutSummary}</p>
          )}
          <span>{siteConfig.tagline}</span>
        </div>
        <div>
          <h3>Products</h3>
          <Link to="/products">All Products</Link>
          <Link to="/product-finder">Product Finder</Link>
          <Link to="/compare">Compare Products</Link>
          {priceVisibility && (
            <Link
              to="/offers#offers-deals"
              onClick={() => {
                setTimeout(() => {
                  const el = document.getElementById('offers-deals');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 50);
              }}
            >
              Offers &amp; Deals
            </Link>
          )}
          <Link to="/downloads">Downloads Center</Link>
        </div>
        <div>
          <h3>Solutions</h3>
          <Link to="/solutions">Solutions Overview</Link>
          <Link to="/industries">Industries</Link>
          <Link to="/solutions?solution=security-surveillance">Surveillance</Link>
          <Link to="/solutions?solution=solar-solutions">Solar Solutions</Link>
        </div>
        <div>
          <h3>Business</h3>
          <Link to="/business#distributor">Distributor</Link>
          <Link to="/business#partner">Partner</Link>
          <Link to="/partner-benefits">Partner Benefits</Link>
          {/* <Link to="/partner/login">Partner Login</Link> */}
        </div>
        <div>
          <h3>Resources &amp; Support</h3>
          <Link to="/resources">Resources Hub</Link>
          <Link to="/blogs">Blog &amp; News</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/service-request">Service Request</Link>
          {priceVisibility && <Link to="/warranty">Warranty</Link>}
          {priceVisibility && <Link to="/order-tracking">Order Tracking</Link>}
        </div>
        <div className="footer-social">
          <h3>Contact &amp; Social</h3>
          <div className="socials">
            {Object.entries(socialIcons).map(([name, Icon]) => {
              const url = getSocialUrl(name);
              return url ? (
                <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}>
                  <Icon size={18} />
                </a>
              ) : (
                <span key={name} className="disabled" aria-label={`${name} link not configured`} title="Link not configured">
                  <Icon size={18} />
                </span>
              );
            })}
          </div>
          <address className="footer-contact">
            <a href={siteConfig.emailLink} className="footer-contact-link email" title="Email Us">
              <Mail size={13} className="footer-contact-icon" />
              <span>{siteConfig.email}</span>
            </a>
            <a href={siteConfig.phoneLink} className="footer-contact-link phone" title="Call Us">
              <Phone size={13} className="footer-contact-icon" />
              <span>{siteConfig.phone}</span>
            </a>
            <a href={siteConfig.mapLink} target="_blank" rel="noreferrer" className="footer-contact-link address" title="View Address on Google Maps">
              <MapPin size={13} className="footer-contact-icon" />
              <span>{siteConfig.address}</span>
            </a>
          </address>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>{footerData.copyrightText || `© ${new Date().getFullYear()} Honeywell International Inc. All rights reserved.`}</p>
        </div>
        <nav className="footer-policy-links" aria-label="Legal & Policies">
          {renderPolicyLink('Privacy Policy', footerData.privacyPolicyUrl, '/privacy-policy')}
          <span className="footer-policy-sep" aria-hidden="true">•</span>
          {renderPolicyLink('Terms & Conditions', footerData.termsUrl, '/terms-and-conditions')}
          <span className="footer-policy-sep" aria-hidden="true">•</span>
          {renderPolicyLink('Return & Refund', footerData.returnRefundPolicyUrl, '/return-refund-policy')}
          <span className="footer-policy-sep" aria-hidden="true">•</span>
          {renderPolicyLink('Warranty Policy', footerData.warrantyPolicyUrl, '/warranty-policy')}
          <span className="footer-policy-sep" aria-hidden="true">•</span>
          {renderPolicyLink('Cookie Policy', footerData.cookiePolicyUrl, '/cookie-policy')}
        </nav>
      </div>
    </footer>
  );
}
