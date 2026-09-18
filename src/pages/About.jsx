import { ArrowRight, Camera, Eye, Handshake, Network, ShieldCheck, Sun, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/capital-park2.jpg';
import portfolioImage from '../assets/images/smart-security-sustainable-future.png';

// Replace with client-provided CEO information and photograph.
const ceo = {
  name: 'CEO Name',
  designation: 'Chief Executive Officer',
  message: 'CEO message will be provided by the client.',
  image: '/images/ceo-placeholder.jpg',
};
const portfolio = [
  { icon: Camera, title: 'CCTV & Surveillance', text: 'Analog, Dome, Bullet, PTZ, and IP security cameras for indoor and perimeter monitoring.' },
  { icon: Sun, title: 'Solar Panels & Energy', text: 'High-efficiency Monocrystalline, Polycrystalline, and Bifacial solar panel modules.' },
  { icon: Zap, title: 'Solar Inverters & Storage', text: 'Off-grid and hybrid solar inverters, lithium & gel storage batteries, and MPPT controllers.' },
  { icon: Network, title: 'Recording & Networking', text: 'Network video recorders (NVR), DVRs, surveillance storage drives, and PoE network switches.' },
];
const reasons = [
  { icon: ShieldCheck, title: 'Practical Security Focus', text: 'Product discovery organized around clear application needs.' },
  { icon: Eye, title: 'Transparent Product Data', text: 'Verified models and specifications can replace the marked placeholders.' },
  { icon: Handshake, title: 'Business Ready', text: 'Dedicated enquiry journeys for retail, bulk and partner requirements.' },
];

export default function About() {
  useDocumentTitle('About Us', 'Learn about the HONEYWELL PRODUCTS company profile, vision, mission, portfolio and leadership placeholders.');
  return <>
    <PageHero eyebrow="ABOUT US" title="Security Technology With a Clear Purpose" description="A premium framework prepared for the client’s official company story, market position and leadership content." image={heroImage} />
    <section className="section about-overview"><div className="container two-column"><div><SectionHeading eyebrow="COMPANY OVERVIEW" title="Built for Product Discovery and Security Solutions" /><p className="lead">The official HONEYWELL PRODUCTS company overview will be provided by the client.</p><p>This frontend presents a scalable foundation for CCTV, security, solar product discovery, eCommerce preparation, bulk enquiries and channel partnerships without making unverified company claims.</p><Link className="arrow-link" to="/contact">Start a Conversation <ArrowRight /></Link></div><div className="about-image"><img src={portfolioImage} alt="Security cameras and solar technology" /><span>Representative product portfolio visual</span></div></div></section>
    <section className="mission-vision"><div className="container"><article><span>01</span><p className="eyebrow dark">OUR VISION</p><h2>Client-approved vision statement to be provided.</h2><p>Prepared for the official long-term vision supplied by the client.</p></article><article><span>02</span><p className="eyebrow dark">OUR MISSION</p><h2>Client-approved mission statement to be provided.</h2><p>Prepared for the official company mission supplied by the client.</p></article></div></section>
    <section className="section portfolio-section"><div className="container"><SectionHeading eyebrow="PRODUCT PORTFOLIO" title="Security, CCTV & Solar Power Product Portfolio" description="Comprehensive surveillance systems, high-efficiency solar panels, power inverters, energy storage batteries, and network recording solutions." align="center" /><div className="about-values">{portfolio.map(({ icon: Icon, ...item }, index) => <article key={item.title}><span>0{index + 1}</span><Icon /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
    <section className="section about-reasons">
      <div className="container">
        <SectionHeading eyebrow="WHY CHOOSE US" title="A Conservative, Client-Ready Approach" description="Statements avoid unsupported claims and remain ready for verified company information." />
      </div>
      <div className="why-scroll-container">
        <div className="why-scroll-track">
          {[...reasons, ...reasons, ...reasons, ...reasons].map(({ icon: Icon, ...item }, index) => (
            <article key={`${item.title}-${index}`} className="why-scroll-card light">
              <div className="why-icon-wrap">
                <Icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
    <section className="ceo-section" id="ceo-corner"><div className="container"><div className="ceo-image ceo-placeholder"><span aria-hidden="true">CEO</span><small>Image placeholder<br />{ceo.image}</small></div><div><p className="eyebrow">CEO CORNER</p><h2>“{ceo.message}”</h2><p>Replace this placeholder with the approved CEO message supplied by the client.</p><strong>{ceo.name}</strong><small>{ceo.designation}</small></div></div></section>
  </>;
}
