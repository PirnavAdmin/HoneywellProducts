import { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Camera, Expand, Headphones, Image, MonitorSmartphone, Network, PlugZap, ShieldCheck } from 'lucide-react';
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
import { INDUSTRY_VERTICALS } from '../data/industryData';
import { SOLUTION_PILLARS } from '../data/solutionsData';
import { industryImages, applicationImages } from '../data/imageLibrary';
import { marketTrends } from '../data/marketTrends';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useUI } from '../context/UIContext';
import { socialLinks } from '../config/socialLinks';
import OptimizedImage from '../components/common/OptimizedImage';
import businessImage from '../assets/images/capital-park2.jpg';
import industryResidentialImage from '../assets/images/catalog/industry-residential.png';
import industryCommercialImage from '../assets/images/catalog/industry-commercial.png';
import industryIndustrialImage from '../assets/images/catalog/industry-industrial.png';
import industryRetailImage from '../assets/images/catalog/industry-retail.png';
import industryEducationImage from '../assets/images/catalog/industry-education.png';
import industryHealthcareImage from '../assets/images/catalog/industry-healthcare.png';

const homeIndustryImages = {
  residential: industryResidentialImage,
  commercial: industryCommercialImage,
  industrial: industryIndustrialImage,
  retail: industryRetailImage,
  education: industryEducationImage,
  healthcare: industryHealthcareImage,
};

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

  // Filter & sort products depending on active tab
  const tabProducts = useMemo(() => {
    if (!Array.isArray(productsList) || productsList.length === 0) return [];
    const listCopy = [...productsList];

    if (productTab === 'New Products') {
      // Sort by creation date or newest ID descending
      return listCopy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }).slice(0, 8);
    }

    if (productTab === 'Popular Products') {
      // Sort by reviews count & rating descending
      return listCopy.sort((a, b) => {
        const revA = Number(a.reviewCount || a.totalReviews || 0);
        const revB = Number(b.reviewCount || b.totalReviews || 0);
        if (revA !== revB) return revB - revA;
        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);
        return ratingB - ratingA;
      }).slice(0, 8);
    }

    // Default: 'Featured'
    const featuredOnly = listCopy.filter(p => p.isFeatured || p.featured || Number(p.rating || 0) >= 4.5);
    if (featuredOnly.length >= 4) {
      return featuredOnly.slice(0, 8);
    }
    return listCopy.slice(0, 8);
  }, [productsList, productTab]);

  return <>
    <HeroCarousel />
    <section className="section categories-section">
      <div className="container">
        <div className="split-heading">
          <SectionHeading eyebrow="PRODUCT DISCOVERY" title="Explore Our Products" description="Browse professional camera, recording, storage, networking and installation categories." />
          <Link className="arrow-link" to="/products">View all products <ArrowRight /></Link>
        </div>
        <div className="category-grid product-category-grid">
          {categoriesList.map((category, idx) => {
            const subCount = getSubcategoryCount(category);
            const countLabel = subCount === 1 ? '1 Subcategory' : `${subCount} Subcategories`;
            const imageSrc = (!category.image && !category.imageUrl) || String(category.image || category.imageUrl).toLowerCase().includes('placeholder')
              ? '/honeywell-products-logo.png'
              : (category.image || category.imageUrl);

            return (
              <Link key={category.id} to={`/products?category=${category.id}`} className="category-card">
                <OptimizedImage
                  src={imageSrc}
                  alt={`${category.name} product category`}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  fetchPriority={idx < 2 ? 'high' : undefined}
                  decoding="async"
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
          <div className="product-grid home-products">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="product-card-skeleton">
                <div className="skeleton-img-box skeleton-pulse" />
                <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div className="skeleton-line" style={{ width: '50%', height: '10px' }} />
                  <div className="skeleton-line" style={{ width: '90%', height: '26px' }} />
                  <div className="skeleton-line" style={{ width: '40%', height: '10px' }} />
                  <div className="skeleton-line" style={{ width: '70%', height: '16px', marginTop: 'auto' }} />
                  <div className="skeleton-line" style={{ width: '100%', height: '28px', marginTop: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid home-products">
            {tabProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))}
          </div>
        )}
      </div>
    </section>

    {/* Section 1: SHOP BY APPLICATION */}
    <section className="section applications-section">
      <div className="container">
        <SectionHeading eyebrow="SHOP BY APPLICATION" title="What Are You Protecting?" description="Start with the environment and continue to a suggested product category." />
        <div className="application-grid">
          {applications.map((application) => (
            <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
              <OptimizedImage src={application.image} alt={`${application.name} security application`} loading="lazy" decoding="async" />
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

    {/* Section 2: INDUSTRY VERTICALS */}
    <section className="section industry-verticals-section">
      <div className="container">
        <div className="split-heading">
          <SectionHeading eyebrow="INDUSTRY VERTICALS" title="Tailored Industry Solutions" description="Discover specialized technology architectures engineered for specific operational environments." />
          <Link className="arrow-link" to="/industries">Explore all industries <ArrowRight /></Link>
        </div>
          <div className="industry-verticals-grid">
            {Object.values(INDUSTRY_VERTICALS).map((ind) => {
              const Icon = ind.icon;
              const cardImage = homeIndustryImages[ind.id] || ind.image || industryImages[ind.id] || applicationImages[ind.id] || '/honeywell-products-logo.png';
              return (
                <Link
                  key={ind.id}
                  to={`/industries?type=${ind.id}`}
                  className="industry-overlay-card"
                >
                  <img
                    src={cardImage}
                    alt={ind.name}
                    className="industry-card-bg"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/honeywell-products-logo.png';
                    }}
                  />
                  <div className="industry-card-gradient-overlay" />
                  <div className="industry-card-icon-badge">
                    <Icon size={22} />
                  </div>
                  <div className="industry-card-body">
                    <span className="industry-card-category">{ind.eyebrow}</span>
                    <h3 className="industry-card-title">{ind.name}</h3>
                    <p className="industry-card-description">{ind.subtitle}</p>
                  </div>
                  <div className="industry-card-arrow-btn">
                    <ArrowRight size={18} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: COMPLETE SECURITY SOLUTIONS (PILLARS) */}
      <section className="section solutions-preview">
        <div className="container">
          <div className="split-heading">
            <SectionHeading eyebrow="ARCHITECTURE PILLARS" title="Complete Security Solutions" description="Explore enterprise security architecture packages engineered for scalable monitoring and control." />
            <Link className="arrow-link" to="/solutions">View all solutions <ArrowRight /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px', marginTop: '24px' }}>
            {Object.values(SOLUTION_PILLARS).map((pillar) => (
              <Link
                key={pillar.id}
                to={`/solutions?solution=${pillar.id}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#e53935';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.03)';
                }}
              >
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pillar.eyebrow}</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{pillar.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{pillar.subtitle}</p>
                
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#1268a5', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Explore Architecture <ArrowRight size={14} />
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                    {pillar.architecture?.length || 4} Steps
                  </span>
                </div>
              </Link>
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
    <section className="section business-banner"><div className="container business-banner-grid"><div><SectionHeading eyebrow="BUSINESS PARTNERSHIPS" title="Grow Your Business With Honeywell Products" /><div className="partner-chip-list">{partnerTypes.map((type) => <span key={type}>{type}</span>)}</div><div className="button-row"><Link className="button" to="/business#partner-form">Become a Partner</Link><Link className="button outline" to="/business">Request Business Details</Link></div></div><img src={businessImage} alt="Modern commercial buildings" loading="lazy" /></div></section>
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
