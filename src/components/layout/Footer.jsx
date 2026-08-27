import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MessageCircle, Youtube } from 'lucide-react';
import Brand from '../common/Brand';
import { socialLinks } from '../../config/socialLinks';
import { siteConfig } from '../../config/siteConfig';

const socialIcons = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, whatsapp: MessageCircle };

export default function Footer() {
  return <footer className="footer">
    <div className="footer-top">
      <div className="footer-brand"><Brand light /><p>Professional security, surveillance and solar product discovery for homes, businesses and industrial environments.</p><span>{siteConfig.tagline}</span></div>
      <div><h3>Products</h3><Link to="/products?category=cctv-cameras">CCTV Cameras</Link><Link to="/products?category=ip-cameras">IP Cameras</Link><Link to="/products?category=ptz-cameras">PTZ Cameras</Link><Link to="/products?category=nvr">NVR</Link><Link to="/products?category=dvr">DVR</Link><Link to="/products?category=solar-cameras">Solar Security</Link><Link to="/products?category=cctv-accessories">Accessories</Link></div>
      <div><h3>Solutions</h3><Link to="/solutions?solution=home-security">Home Security</Link><Link to="/solutions?solution=office-security">Business Security</Link><Link to="/solutions?solution=retail-security">Retail</Link><Link to="/solutions?solution=warehouse-security">Warehouse</Link><Link to="/solutions?solution=factory-security">Factory</Link></div>
      <div><h3>Business</h3><Link to="/business#dealer">Dealer</Link><Link to="/business#distributor">Distributor</Link><Link to="/business#installer">Installer</Link><Link to="/business#partner-form">Partner</Link></div>
      <div><h3>Company</h3><Link to="/about-us">About Us</Link><Link to="/contact">Contact Us</Link><Link to="/business#careers">Careers</Link></div>
      <div className="footer-social"><h3>Contact &amp; Social</h3><div className="socials">{Object.entries(socialIcons).map(([name, Icon]) => socialLinks[name] ? <a key={name} href={socialLinks[name]} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}><Icon size={18} /></a> : <span key={name} className="disabled" aria-label={`${name} link not configured`} title="Link not configured"><Icon size={18} /></span>)}</div><address className="footer-contact"><a href={siteConfig.emailLink}>{siteConfig.email}</a><a href={siteConfig.phoneLink}>{siteConfig.phone}</a><a href={siteConfig.mapLink} target="_blank" rel="noreferrer">{siteConfig.address}</a></address></div>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} HONEYWELL PRODUCTS. Frontend demonstration.</p><div><span>Privacy Policy</span><span>Terms & Conditions</span></div></div>
  </footer>;
}
