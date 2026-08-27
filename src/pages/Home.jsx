import { useState } from 'react';
import { ArrowRight, Camera, Expand, Headphones, Image, MonitorSmartphone, Network, PlugZap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/home/HeroCarousel';
import SectionHeading from '../components/common/SectionHeading';
import ProductCard from '../components/products/ProductCard';
import GrowthSection from '../components/home/GrowthSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import { categories, products } from '../data/products';
import { applications, solutions } from '../data/solutions';
import { marketTrends } from '../data/marketTrends';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useUI } from '../context/UIContext';
import businessImage from '../assets/images/capital-park2.jpg';

const reasons = [
  { icon: ShieldCheck, title: 'Advanced Security Technology', text: 'A structured portfolio prepared for modern surveillance requirements.' },
  { icon: Camera, title: 'High Quality Products', text: 'Product selection supported by client-verified information and project needs.' },
  { icon: Image, title: 'High Resolution Imaging', text: 'Imaging options can be matched once approved technical data is supplied.' },
  { icon: MonitorSmartphone, title: 'Remote Monitoring', text: 'Connected workflows for suitable IP, Wi-Fi and 4G product categories.' },
  { icon: Network, title: 'Scalable Solutions', text: 'Planning that can expand from a focused installation to a broader site.' },
  { icon: Headphones, title: 'Professional Support', text: 'Clear enquiry pathways for products, projects and business requirements.' },
  { icon: PlugZap, title: 'Easy Installation', text: 'Installation formats organized for practical project conversations.' },
  { icon: Expand, title: 'Reliable Performance', text: 'A conservative approach focused on suitability and verified specifications.' },
];
const partnerTypes = ['Distributor', 'Dealer', 'CCTV Installer', 'System Integrator', 'Reseller', 'Channel Partner'];

export default function Home() {
  useDocumentTitle('Security Products & Solutions', 'Discover CCTV, IP, Wi-Fi, 4G and solar-security product categories and solutions.');
  const [productTab, setProductTab] = useState('Featured');
  const { openQuote } = useUI();
  const tabProducts = products.filter((product) => productTab === 'Featured' ? product.featured : productTab === 'New Products' ? product.newProduct : product.popular).slice(0, 8);

  return <>
    <HeroCarousel />
    <section className="section categories-section"><div className="container"><div className="split-heading"><SectionHeading eyebrow="PRODUCT DISCOVERY" title="Explore Our Products" description="Browse professional camera, recording, storage, networking and installation categories." /><Link className="arrow-link" to="/products">View all products <ArrowRight /></Link></div><div className="category-grid product-category-grid">{categories.map((category) => <Link key={category.id} to={`/products?category=${category.id}`} className="category-card"><img src={category.image} alt={`${category.name} product category`} loading="lazy" /><div className="category-overlay" /><div><h3>{category.name}</h3><p>{category.description}</p><b>Explore Products <ArrowRight size={17} /></b></div></Link>)}</div></div></section>
    <section className="section featured-section"><div className="container"><div className="split-heading"><SectionHeading eyebrow="CURATED CATALOGUE" title="Featured Products" description="Generic product types prepared for client-approved models, specifications and availability." /><Link className="arrow-link" to="/products">Explore catalogue <ArrowRight /></Link></div><div className="content-tabs" role="tablist">{['Featured', 'New Products', 'Popular Products'].map((item) => <button key={item} role="tab" aria-selected={productTab === item} className={productTab === item ? 'active' : ''} onClick={() => setProductTab(item)}>{item}</button>)}</div><div className="product-grid home-products">{tabProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div><p className="demo-disclaimer">Product names, models, specifications, pricing, ratings, availability and imagery are demo placeholders pending client verification.</p></div></section>
    <section className="section applications-section"><div className="container"><SectionHeading eyebrow="SHOP BY APPLICATION" title="What Are You Protecting?" description="Start with the environment and continue to a suggested product category." /><div className="application-grid">{applications.map((application) => <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card"><img src={application.image} alt={`${application.name} security application`} loading="lazy" /><div><span>{application.name}</span><p>{application.description}</p><b>Find a solution <ArrowRight size={16} /></b></div></Link>)}</div></div></section>
    <section className="section solutions-preview"><div className="container"><div className="split-heading"><SectionHeading eyebrow="END-TO-END PLANNING" title="Complete Security Solutions" description="Explore practical solution starting points for common residential, commercial and industrial settings." /><Link className="arrow-link" to="/solutions">View all solutions <ArrowRight /></Link></div><div className="solution-grid">{solutions.map((solution) => <article key={solution.id} className="solution-card"><img src={solution.image} alt={`${solution.title} environment`} loading="lazy" /><div><small>{solution.application}</small><h3>{solution.title}</h3><p>{solution.description}</p><Link to={`/solutions?solution=${solution.id}`}>View Solution <ArrowRight size={16} /></Link></div></article>)}</div></div></section>
    <section className="section why-section"><div className="container"><SectionHeading eyebrow="WHY CHOOSE US" title="Technology Designed Around Your Security" description="A practical, conservative framework for product discovery, project planning and support." inverse /><div className="reason-grid">{reasons.map(({ icon: Icon, ...item }) => <article key={item.title}><Icon /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
    <section className="section business-banner"><div className="container business-banner-grid"><div><SectionHeading eyebrow="BUSINESS PARTNERSHIPS" title="Grow Your Business With Honeywell Products" description="Explore client-editable partnership pathways for channel and project professionals." /><div className="partner-chip-list">{partnerTypes.map((type) => <span key={type}>{type}</span>)}</div><div className="button-row"><Link className="button" to="/business#partner-form">Become a Partner</Link><Link className="button outline" to="/business">Request Business Details</Link></div></div><img src={businessImage} alt="Modern commercial buildings" loading="lazy" /></div></section>
    <TestimonialsSection />
    <GrowthSection />
    <section className="section insights-section"><div className="container"><div className="split-heading"><SectionHeading eyebrow="MARKET TRENDS" title="Technology Trends Shaping Tomorrow" description="Static demo introductions prepared for a future client-approved insights program." /><Link className="arrow-link" to="/solutions">Explore solutions <ArrowRight /></Link></div><div className="insights-grid">{marketTrends.map((item) => <article key={item.id}><img src={item.image} alt="" loading="lazy" /><div><small>{item.category} • Demo insight</small><h3>{item.title}</h3><p>{item.description}</p><Link to="/solutions">Learn More <ArrowRight size={17} /></Link></div></article>)}</div></div></section>
    <section className="cta-band final-security-cta"><div className="container"><span><small>PRODUCTS • PROJECTS • BUSINESS</small><strong>Looking for the Right Security Solution?</strong><p>Talk to our team about products, projects, bulk requirements and business opportunities.</p></span><div className="button-row"><button className="button light" onClick={() => openQuote()}>Get a Quote</button><Link className="button outline light-outline" to="/contact">Contact Sales</Link><a className="button outline light-outline disabled-link" aria-disabled="true" title="WhatsApp URL not configured">WhatsApp Us</a></div></div></section>
  </>;
}
