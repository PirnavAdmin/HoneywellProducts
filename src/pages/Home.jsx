import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Camera, Expand, Headphones, Image, MonitorSmartphone, Network, PlugZap, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/home/HeroCarousel';
import SectionHeading from '../components/common/SectionHeading';
import ProductCard from '../components/products/ProductCard';
import OffersDeals from '../components/home/OffersDeals';
import GrowthSection from '../components/home/GrowthSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { fetchSubcategories } from '../admin/catalog/subcategoriesApi';
import { solutionService } from '../services/solutionService';
import { applications } from '../data/solutions';
import { marketTrends } from '../data/marketTrends';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useUI } from '../context/UIContext';
import { socialLinks } from '../config/socialLinks';
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
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [solutionsList, setSolutionsList] = useState([]);
  const [blogsList, setBlogsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const blogScrollRef = useRef(null);
  const { openQuote } = useUI();

  const handleBlogScrollLeft = () => {
    if (blogScrollRef.current) {
      blogScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const handleBlogScrollRight = () => {
    if (blogScrollRef.current) {
      blogScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      productService.getAll().catch(() => []),
      categoryService.getAll().catch(() => []),
      fetchSubcategories().catch(() => []),
      solutionService.getAll().catch(() => []),
      getBlogs().catch(() => []),
    ])
      .then(([prods, cats, subs, sols, blogs]) => {
        if (isMounted) {
          setProductsList(Array.isArray(prods) ? prods : []);
          setCategoriesList(Array.isArray(cats) ? cats : []);
          setSubcategoriesList(Array.isArray(subs) ? subs : []);
          setSolutionsList(Array.isArray(sols) ? sols : []);
          setBlogsList(Array.isArray(blogs) && blogs.length > 0 ? blogs : marketTrends);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const getSubcategoryCount = (category) => {
    if (!category) return 0;
    const catIdStr = String(category.id ?? category.categoryId ?? '');
    if (Array.isArray(subcategoriesList) && subcategoriesList.length > 0) {
      const matched = subcategoriesList.filter((sub) => {
        const subCatId = String(sub.categoryId ?? sub.category_id ?? '');
        const isActive = sub.status !== 'Inactive' && sub.isActive !== false;
        return subCatId === catIdStr && isActive;
      });
      return matched.length;
    }
    const embedded = category.subCategories || category.subcategories || [];
    if (Array.isArray(embedded) && embedded.length > 0) {
      return embedded.filter((s) => s.isActive !== false && s.status !== 'Inactive').length;
    }
    return Number(category.subcategoryCount || category.subCategoryCount || 0);
  };

  const tabProducts = (productsList.length > 0 ? productsList : []).slice(0, 8);

  return <>
    <HeroCarousel />
    <section className="section categories-section">
      <div className="container">
        <div className="split-heading">
          <SectionHeading eyebrow="PRODUCT DISCOVERY" title="Explore Our Products" description="Browse professional camera, recording, storage, networking and installation categories." />
          <Link className="arrow-link" to="/products">View all products <ArrowRight /></Link>
        </div>
        <div className="category-grid product-category-grid">
          {categoriesList.map((category) => {
            const subCount = getSubcategoryCount(category);
            const countLabel = subCount === 1 ? '1 Subcategory' : `${subCount} Subcategories`;
            const imageSrc = (!category.image && !category.imageUrl) || String(category.image || category.imageUrl).toLowerCase().includes('placeholder')
              ? '/honeywell-products-logo.png'
              : (category.image || category.imageUrl);

            return (
              <Link key={category.id} to={`/products?category=${category.id}`} className="category-card">
                <img
                  src={imageSrc}
                  alt={`${category.name} product category`}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/honeywell-products-logo.png';
                  }}
                />
                <div className="category-overlay" />
                <div className="category-card-content">
                  <div className="category-card-header">
                    <h3>{category.name}</h3>
                    <span className="category-subcount">{countLabel}</span>
                  </div>
                  <div className="category-card-expand">
                    {category.description && category.description.trim() ? (
                      <p className="category-desc">{category.description.trim()}</p>
                    ) : null}
                    <div className="category-action">
                      <span>Explore Products</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>

    <OffersDeals />

    <section className="section featured-section">
      <div className="container">
        <div className="split-heading">
          <SectionHeading eyebrow="CURATED CATALOGUE" title="Featured Products" description="Explore high quality surveillance models and security equipment." />
          <Link className="arrow-link" to="/products">Explore catalogue <ArrowRight /></Link>
        </div>
        <div className="content-tabs" role="tablist">
          {['Featured', 'New Products', 'Popular Products'].map((item) => (
            <button key={item} role="tab" aria-selected={productTab === item} className={productTab === item ? 'active' : ''} onClick={() => setProductTab(item)}>{item}</button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className="product-grid home-products">
            {tabProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </section>

    <section className="section applications-section">
      <div className="container">
        <SectionHeading eyebrow="SHOP BY APPLICATION" title="What Are You Protecting?" description="Start with the environment and continue to a suggested product category." />
        <div className="application-grid">
          {applications.map((application) => (
            <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
              <img src={application.image} alt={`${application.name} security application`} loading="lazy" />
              <div>
                <span>{application.name}</span>
                <p>{application.description}</p>
                <b>Find a solution <ArrowRight size={16} /></b>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="section solutions-preview">
      <div className="container">
        <div className="split-heading">
          <SectionHeading eyebrow="END-TO-END PLANNING" title="Complete Security Solutions" description="Explore practical solution starting points for common residential, commercial and industrial settings." />
          <Link className="arrow-link" to="/solutions">View all solutions <ArrowRight /></Link>
        </div>
        <div className="solution-grid">
          {solutionsList.map((solution) => (
            <article key={solution.id} className="solution-card">
              <img src={solution.image || '/honeywell-products-logo.png'} alt={`${solution.title} environment`} loading="lazy" />
              <div>
                <small>{solution.application}</small>
                <h3>{solution.title}</h3>
                <p>{solution.description}</p>
                <Link to={`/solutions?solution=${solution.id}`}>View Solution <ArrowRight size={16} /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
    <section className="section why-section">
      <div className="container">
        <SectionHeading eyebrow="WHY CHOOSE US" title="Technology Designed Around Your Security" description="A practical, conservative framework for product discovery, project planning and support." inverse />
      </div>
      <div className="why-scroll-container">
        <div className="why-scroll-track">
          {[...reasons, ...reasons].map(({ icon: Icon, ...item }, index) => (
            <article key={`${item.title}-${index}`} className="why-scroll-card">
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
    <section className="section business-banner"><div className="container business-banner-grid"><div><SectionHeading eyebrow="BUSINESS PARTNERSHIPS" title="Grow Your Business With Honeywell Products" description="Explore client-editable partnership pathways for channel and project professionals." /><div className="partner-chip-list">{partnerTypes.map((type) => <span key={type}>{type}</span>)}</div><div className="button-row"><Link className="button" to="/business#partner-form">Become a Partner</Link><Link className="button outline" to="/business">Request Business Details</Link></div></div><img src={businessImage} alt="Modern commercial buildings" loading="lazy" /></div></section>
    <TestimonialsSection />
    <GrowthSection />
    <section className="section insights-section">
      <div className="container">
        <div className="split-heading" style={{ alignItems: 'flex-end', marginBottom: '24px' }}>
          <SectionHeading eyebrow="MARKET TRENDS" title="Technology Trends Shaping Tomorrow" description="Featured blog articles and market technology trends." />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              {(blogsList.length > 0 ? blogsList : marketTrends).length} Articles
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleBlogScrollLeft}
                aria-label="Scroll blogs left"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={handleBlogScrollRight}
                aria-label="Scroll blogs right"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={blogScrollRef}
          className="insights-grid-scrollable"
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            gap: '24px',
            paddingBottom: '16px',
            scrollbarWidth: 'thin',
          }}
        >
          {(blogsList.length > 0 ? blogsList : marketTrends).map((item) => {
            const imgUrl = resolveBlogImageUrl(item.coverImage || item.imageUrl || item.image) || item.image || '/honeywell-products-logo.png';
            const blogId = item.id || item.slug || '1';
            return (
              <article
                key={blogId}
                style={{
                  flex: '0 0 350px',
                  minWidth: '300px',
                  maxWidth: '360px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <img
                  src={imgUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/honeywell-products-logo.png';
                  }}
                />
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <small style={{ color: '#e30613', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px', fontWeight: 700 }}>
                    {item.category || item.authorName || 'Market Trend'}
                  </small>
                  <h3 style={{ margin: '10px 0 8px', fontSize: '18px', lineHeight: 1.3, fontWeight: 700, color: '#0f172a' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px', flex: 1 }}>
                    {item.summary || item.shortSummary || item.description || item.content?.slice(0, 100) || 'Discover security insights.'}
                  </p>
                  <Link
                    to={`/blogs/${blogId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '14px',
                      textDecoration: 'none',
                      marginTop: 'auto',
                    }}
                  >
                    Learn More <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
    <section className="cta-band final-security-cta"><div className="container"><span><small>PRODUCTS • PROJECTS • BUSINESS</small><strong>Looking for the Right Security Solution?</strong><p>Talk to our team about products, projects, bulk requirements and business opportunities.</p></span><div className="button-row"><button className="button light" onClick={() => openQuote()}>Get a Quote</button><Link className="button outline light-outline" to="/contact">Contact Sales</Link>{socialLinks.whatsapp ? <a className="button outline light-outline" href={socialLinks.whatsapp} target="_blank" rel="noreferrer">WhatsApp Us</a> : <a className="button outline light-outline disabled-link" aria-disabled="true" title="WhatsApp URL not configured">WhatsApp Us</a>}</div></div></section>
  </>;
}
