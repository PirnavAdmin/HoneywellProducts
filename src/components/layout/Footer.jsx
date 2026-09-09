import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Youtube } from 'lucide-react';
import Brand from '../common/Brand';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { socialLinks } from '../../config/socialLinks';
import { siteConfig } from '../../config/siteConfig';

const socialIcons = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, whatsapp: WhatsAppIcon, email: Mail };

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Brand light />
          <p>Professional security, surveillance and solar product discovery for homes, businesses and industrial environments.</p>
          <span>{siteConfig.tagline}</span>
        </div>
        <div>
          <h3>Products</h3>
          <Link to="/products">All Products</Link>
          <Link to="/product-finder">Product Finder</Link>
          <Link to="/compare">Compare Products</Link>
          <Link to="/offers">Offers &amp; Deals</Link>
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
          <Link to="/partner/login">Partner Login</Link>
        </div>
        <div>
          <h3>Resources &amp; Support</h3>
          <Link to="/resources">Resources Hub</Link>
          <Link to="/blogs">Blog &amp; News</Link>
          <Link to="/case-studies">Case Studies</Link>
          <Link to="/videos">Video Center</Link>
          <Link to="/support">Support Center</Link>
          <Link to="/service-request">Service Request</Link>
          <Link to="/warranty">Warranty</Link>
          <Link to="/order-tracking">Order Tracking</Link>
        </div>
        <div className="footer-social">
          <h3>Contact &amp; Social</h3>
          <div className="socials">
            {Object.entries(socialIcons).map(([name, Icon]) => socialLinks[name] ? (
              <a key={name} href={socialLinks[name]} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}>
                <Icon size={18} />
              </a>
            ) : (
              <span key={name} className="disabled" aria-label={`${name} link not configured`} title="Link not configured">
                <Icon size={18} />
              </span>
            ))}
          </div>
          <address className="footer-contact">
            <a href={siteConfig.emailLink}>{siteConfig.email}</a>
            <a href={siteConfig.phoneLink}>{siteConfig.phone}</a>
            <a href={siteConfig.mapLink} target="_blank" rel="noreferrer">{siteConfig.address}</a>
          </address>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} HONEYWELL PRODUCTS. All Rights Reserved.</p>
        <div>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
          <Link to="/warranty-policy">Warranty Policy</Link>
        </div>
      </div>
    </footer>
  );
}
