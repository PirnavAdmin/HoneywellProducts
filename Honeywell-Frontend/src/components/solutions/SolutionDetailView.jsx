import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  Wrench, 
  HelpCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Check,
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import ArchitectureDiagram from './ArchitectureDiagram';
import SolarEstimatorWidget from './SolarEstimatorWidget';
import ProductCard from '../products/ProductCard';
import { SOLUTION_PILLARS } from '../../data/solutionsData';
import { INDUSTRY_VERTICALS } from '../../data/industryData';
import { applications } from '../../data/solutions';
import { productService } from '../../services/productService';
import { useUI } from '../../context/UIContext';

/**
 * Resolves and ranks recommended hardware products for each solution pillar.
 * Specifically for "solar-solutions", it accurately retrieves both solar-compatible outdoor
 * surveillance cameras (PT/ColorVu/outdoor) and solar power hardware (panels/kits)
 * and organizes them cleanly so both cameras and power equipment appear in cohesive groups.
 */
function filterRecommendedProducts(pillarId, allList = []) {
  if (!Array.isArray(allList) || allList.length === 0) return [];

  const cleanId = String(pillarId || "").toLowerCase();

  const isBrokenUrl = (p) => {
    const rawImg = String(p.image || p.imageUrl || p.ImageUrl || "");
    return rawImg.includes("0b739155") || rawImg.includes("2ff42c5c");
  };

  const getProductSearchText = (p) => {
    return [
      p.name || "",
      p.title || "",
      p.productType || "",
      p.subcategory || "",
      p.subcategoryName || "",
      p.category || "",
      p.categoryName || "",
      p.description || "",
      p.shortDescription || "",
      ...(Array.isArray(p.features) ? p.features : []),
      ...(Array.isArray(p.keyFeatures) ? p.keyFeatures : []),
    ]
      .join(" ")
      .toLowerCase();
  };

  // ── 1. SOLAR SOLUTIONS & OFF-GRID SECURITY ─────────────────────────────────
  if (cleanId === "solar-solutions") {
    const validList = allList.filter((p) => !isBrokenUrl(p));

    // Cameras suitable for off-grid & solar deployments (outdoor, PT, ColorVu, low power)
    const solarCameras = validList.filter((p) => {
      const text = getProductSearchText(p);
      const isCamera = text.includes("camera");
      if (!isCamera) return false;
      return (
        text.includes("outdoor") ||
        text.includes("pt ") ||
        text.includes("ptz") ||
        text.includes("colorvu") ||
        text.includes("solar") ||
        text.includes("hybrid-light") ||
        text.includes("4g") ||
        text.includes("pir")
      );
    });

    // Solar panels, kits, and power modules (strictly non-cameras)
    const solarPower = validList.filter((p) => {
      const text = getProductSearchText(p);
      const isCamera = text.includes("camera");
      const hasSolarTerm =
        text.includes("solar") ||
        text.includes("photovoltaic") ||
        text.includes("waaree") ||
        text.includes("foldable panel") ||
        text.includes("flexible panel") ||
        text.includes("solar kit") ||
        text.includes("small solar") ||
        text.includes("panel") ||
        text.includes("module");
      return hasSolarTerm && !isCamera;
    });

    // Rank cameras: prioritize outdoor, PT, and ColorVu
    solarCameras.sort((a, b) => {
      const aText = `${a.name || ""} ${a.productType || ""}`.toLowerCase();
      const bText = `${b.name || ""} ${b.productType || ""}`.toLowerCase();
      const aScore =
        (aText.includes("outdoor") ? 6 : 0) +
        (aText.includes("colorvu") ? 4 : 0) +
        (aText.includes("pt") ? 2 : 0) +
        (aText.includes("hybrid") ? 1 : 0);
      const bScore =
        (bText.includes("outdoor") ? 6 : 0) +
        (bText.includes("colorvu") ? 4 : 0) +
        (bText.includes("pt") ? 2 : 0) +
        (bText.includes("hybrid") ? 1 : 0);
      return bScore - aScore;
    });

    // Rank solar power: small CCTV modules & panels first, then foldable panels and combo kits
    solarPower.sort((a, b) => {
      const aText = `${a.name || ""} ${a.productType || ""}`.toLowerCase();
      const bText = `${b.name || ""} ${b.productType || ""}`.toLowerCase();
      const aScore =
        (aText.includes("50w") ? 6 : 0) +
        (aText.includes("20w") ? 5 : 0) +
        (aText.includes("5w") ? 4 : 0) +
        (aText.includes("small") ? 3 : 0) +
        (aText.includes("cctv") ? 2 : 0) +
        (aText.includes("foldable") ? 1 : 0);
      const bScore =
        (bText.includes("50w") ? 6 : 0) +
        (bText.includes("20w") ? 5 : 0) +
        (bText.includes("5w") ? 4 : 0) +
        (bText.includes("small") ? 3 : 0) +
        (bText.includes("cctv") ? 2 : 0) +
        (bText.includes("foldable") ? 1 : 0);
      return bScore - aScore;
    });

    // Cohesive ordering: 4 Outdoor Solar Surveillance Cameras + 4 Dedicated Solar Power Modules
    const organized = [
      ...solarCameras.slice(0, 4),
      ...solarPower.slice(0, 4),
    ];

    if (organized.length > 0) return organized;
  }

  // ── 2. SMART SECURITY & AI ANALYTICS ───────────────────────────────────────
  if (cleanId === "smart-security") {
    const validList = allList.filter((p) => !isBrokenUrl(p));
    const smartProds = validList.filter((p) => {
      const text = getProductSearchText(p);
      return (
        text.includes("acusense") ||
        text.includes("human") ||
        text.includes("smart") ||
        text.includes("strobe") ||
        text.includes("warning") ||
        text.includes("ai") ||
        text.includes("darkfighter") ||
        text.includes("analytics")
      );
    });

    smartProds.sort((a, b) => {
      const aText = `${a.name || ""} ${a.productType || ""}`.toLowerCase();
      const bText = `${b.name || ""} ${b.productType || ""}`.toLowerCase();
      const aScore =
        (aText.includes("strobe") ? 4 : 0) +
        (aText.includes("acusense") ? 3 : 0) +
        (aText.includes("human") ? 2 : 0) +
        (aText.includes("darkfighter") ? 1 : 0);
      const bScore =
        (bText.includes("strobe") ? 4 : 0) +
        (bText.includes("acusense") ? 3 : 0) +
        (bText.includes("human") ? 2 : 0) +
        (bText.includes("darkfighter") ? 1 : 0);
      return bScore - aScore;
    });

    if (smartProds.length > 0) return smartProds;
  }

  // ── 3. INTEGRATED SECURITY & ACCESS CONTROL ───────────────────────────────
  if (cleanId === "integrated-solutions") {
    const validList = allList.filter((p) => !isBrokenUrl(p));
    const accessProds = validList.filter((p) => {
      const text = getProductSearchText(p);
      return (
        text.includes("ptrz") ||
        text.includes("dome") ||
        text.includes("turret") ||
        text.includes("varifocal") ||
        text.includes("strobe") ||
        text.includes("access") ||
        text.includes("controller") ||
        text.includes("network")
      );
    });

    accessProds.sort((a, b) => {
      const aText = `${a.name || ""} ${a.productType || ""}`.toLowerCase();
      const bText = `${b.name || ""} ${b.productType || ""}`.toLowerCase();
      const aScore =
        (aText.includes("ptrz") ? 5 : 0) +
        (aText.includes("varifocal") ? 4 : 0) +
        (aText.includes("human") ? 3 : 0) +
        (aText.includes("dome") ? 2 : 0) +
        (aText.includes("turret") ? 1 : 0);
      const bScore =
        (bText.includes("ptrz") ? 5 : 0) +
        (bText.includes("varifocal") ? 4 : 0) +
        (bText.includes("human") ? 3 : 0) +
        (bText.includes("dome") ? 2 : 0) +
        (bText.includes("turret") ? 1 : 0);
      return bScore - aScore;
    });

    if (accessProds.length > 0) return accessProds;
  }

  // ── 4. SECURITY & SURVEILLANCE (HIGH-DEFINITION MONITORING) ───────────────
  const validList = allList.filter((p) => !isBrokenUrl(p));
  const surveillanceProds = validList.filter((p) => {
    const text = getProductSearchText(p);
    return text.includes("camera") || text.includes("turbo hd") || text.includes("network");
  });

  surveillanceProds.sort((a, b) => {
    const aText = `${a.name || ""} ${a.productType || ""}`.toLowerCase();
    const bText = `${b.name || ""} ${b.productType || ""}`.toLowerCase();
    const aScore =
      (aText.includes("4k") ? 5 : 0) +
      (aText.includes("16mp") ? 4 : 0) +
      (aText.includes("colorvu") ? 3 : 0) +
      (aText.includes("bullet") ? 2 : 0) +
      (aText.includes("dome") ? 1 : 0);
    const bScore =
      (bText.includes("4k") ? 5 : 0) +
      (bText.includes("16mp") ? 4 : 0) +
      (bText.includes("colorvu") ? 3 : 0) +
      (bText.includes("bullet") ? 2 : 0) +
      (bText.includes("dome") ? 1 : 0);
    return bScore - aScore;
  });

  return surveillanceProds.length > 0 ? surveillanceProds : validList;
}

export default function SolutionDetailView({ activeSolutionId = "security-surveillance", onSelectSolution }) {
  const pillar = SOLUTION_PILLARS[activeSolutionId] || SOLUTION_PILLARS["security-surveillance"];
  const { openQuote } = useUI();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  const [solarHardwareFilter, setSolarHardwareFilter] = useState("all"); // "all", "cameras", "power"

  // Reset subcategory filter when switching solution pillars
  useEffect(() => {
    setSolarHardwareFilter("all");
  }, [activeSolutionId]);

  // Fetch live real products for the active solution pillar
  useEffect(() => {
    let isMounted = true;
    async function loadSolutionProducts() {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const data = await productService.getAll();
        if (!isMounted) return;

        const allList = Array.isArray(data) ? data : [];
        const filtered = filterRecommendedProducts(activeSolutionId, allList);

        setProducts(filtered.slice(0, 8));
      } catch (err) {
        console.error("Error fetching products for solution:", err);
        if (isMounted) setErrorProducts("Unable to load recommended products.");
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }
    loadSolutionProducts();

    const handleUpdate = () => {
      loadSolutionProducts();
    };
    window.addEventListener("catalog-updated", handleUpdate);
    window.addEventListener("product-updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("catalog-updated", handleUpdate);
      window.removeEventListener("product-updated", handleUpdate);
    };
  }, [activeSolutionId]);

  // Resolve displayed products based on solar hardware sub-filter
  const displayedProducts = React.useMemo(() => {
    if (pillar.id !== "solar-solutions" || solarHardwareFilter === "all") {
      return products;
    }
    if (solarHardwareFilter === "cameras") {
      return products.filter((p) => {
        const text = `${p.name || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();
        return text.includes("camera");
      });
    }
    if (solarHardwareFilter === "power") {
      return products.filter((p) => {
        const text = `${p.name || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();
        return (text.includes("solar") || text.includes("panel") || text.includes("module") || text.includes("waaree")) && !text.includes("camera");
      });
    }
    return products;
  }, [products, pillar.id, solarHardwareFilter]);

  // Pre-fill context for Quote modal
  const handleConsultation = () => {
    openQuote({
      name: `${pillar.title} Consultation`,
      solution: pillar.title,
      description: pillar.subtitle,
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/solutions">Solutions</Link>
        <ChevronRight size={14} />
        <span>{pillar.title}</span>
      </div>

      {/* Reusable Solution Switcher Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '28px',
        padding: '12px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}>
        {Object.values(SOLUTION_PILLARS).map((item) => {
          const isActive = item.id === pillar.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSolution(item.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderColor: isActive ? '#1268a5' : '#cbd5e1',
                background: isActive ? '#1268a5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
              }}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Solution Overview Split Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
      }}>
        <div className="solution-overview-split">
          {/* Left Column: Solution Narrative, Metrics, & Capabilities */}
          <div>
            {/* Eyebrow & Certified Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: '#eff6ff',
                color: '#1268a5',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: '1px solid #bfdbfe'
              }}>
                <Shield size={13} /> {pillar.eyebrow}
              </span>
              {pillar.badge && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#166534',
                  background: '#f0fdf4',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #bbf7d0'
                }}>
                  <ShieldCheck size={14} /> {pillar.badge}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {pillar.title}
            </h2>

            {pillar.subtitle && (
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                {pillar.subtitle}
              </p>
            )}

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65, margin: '0 0 24px 0' }}>
              {pillar.description}
            </p>

            {/* Quick Metrics Grid */}
            {pillar.metrics && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                marginBottom: '26px'
              }}>
                {pillar.metrics.map((m, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1268a5', lineHeight: 1.2 }}>{m.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Verified Capabilities */}
            {pillar.verifiedCapabilities && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={16} color="#16a34a" /> Verified Architecture Capabilities
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                  {pillar.verifiedCapabilities.map((cap, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: '#1e293b',
                      fontWeight: 600,
                      lineHeight: 1.4
                    }}>
                      <Check size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="button"
                onClick={handleConsultation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  padding: '12px 22px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Wrench size={16} /> Request {pillar.title} Consultation
              </button>
              <a
                href="#solution-architecture"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 18px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  textDecoration: 'none',
                  border: '1px solid #cbd5e1',
                  transition: 'background 0.15s ease'
                }}
              >
                View Topology <ArrowDown size={14} />
              </a>
            </div>
          </div>

          {/* Right Column: Visual Showcase & Technical Engineering Specs */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Showcase Image Banner */}
            {pillar.image && (
              <div style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                aspectRatio: '16 / 9',
                background: '#0f172a'
              }}>
                <img
                  src={pillar.image}
                  alt={pillar.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.1) 50%)'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <Shield size={12} color="#38bdf8" /> Commercial Grade
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 700 }}>
                    Honeywell Security
                  </span>
                </div>
              </div>
            )}

            {/* Technical Engineering Specifications Table */}
            {pillar.keySpecs && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Engineering Highlights
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1268a5' }}>
                    Verified Standard
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pillar.keySpecs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: '12px',
                        fontSize: '12px',
                        lineHeight: 1.4,
                        borderBottom: sIdx < pillar.keySpecs.length - 1 ? '1px dashed #f1f5f9' : 'none',
                        paddingBottom: sIdx < pillar.keySpecs.length - 1 ? '8px' : 0
                      }}
                    >
                      <span style={{ color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{spec.label}</span>
                      <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assistance Help Box */}
            <div style={{
              padding: '12px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <HelpCircle size={18} color="#1268a5" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: 1.45 }}>
                <strong>Enterprise Architecture Design:</strong> Need a tailored Bill of Materials (BOM) or multi-floor camera layout? Our certified engineering specialists provide complimentary design support.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture Topology Diagram */}
      <div id="solution-architecture">
        <ArchitectureDiagram steps={pillar.architecture} title={`${pillar.title} Topology`} />
      </div>

      {/* Render Indicative Solar Solution Estimator Widget for Solar Solutions */}
      {pillar.id === 'solar-solutions' && (
        <SolarEstimatorWidget />
      )}

      {/* Recommended Products (Live from productService API) */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>RECOMMENDED HARDWARE</p>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Products for {pillar.title}</h3>
          </div>
          <Link
            to={
              pillar.id === 'solar-solutions'
                ? '/products?category=solar-panels'
                : pillar.id === 'smart-security'
                ? '/products?search=AcuSense'
                : '/products?category=network-cameras'
            }
            style={{ fontSize: '14px', fontWeight: 700, color: '#1268a5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            View All Products <ChevronRight size={16} />
          </Link>
        </div>

        {pillar.id === "solar-solutions" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSolarHardwareFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderColor: solarHardwareFilter === "all" ? "#1268a5" : "#cbd5e1",
                background: solarHardwareFilter === "all" ? "#1268a5" : "#ffffff",
                color: solarHardwareFilter === "all" ? "#ffffff" : "#475569",
              }}
            >
              All Recommended Equipment (8)
            </button>
            <button
              onClick={() => setSolarHardwareFilter("cameras")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderColor: solarHardwareFilter === "cameras" ? "#1268a5" : "#cbd5e1",
                background: solarHardwareFilter === "cameras" ? "#1268a5" : "#ffffff",
                color: solarHardwareFilter === "cameras" ? "#ffffff" : "#475569",
              }}
            >
              Outdoor Solar Cameras (4)
            </button>
            <button
              onClick={() => setSolarHardwareFilter("power")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderColor: solarHardwareFilter === "power" ? "#1268a5" : "#cbd5e1",
                background: solarHardwareFilter === "power" ? "#1268a5" : "#ffffff",
                color: solarHardwareFilter === "power" ? "#ffffff" : "#475569",
              }}
            >
              Solar Panels & Modules (4)
            </button>
          </div>
        )}

        {loadingProducts ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: '10px', color: '#64748b' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
            <span>Loading recommended products from API...</span>
          </div>
        ) : errorProducts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
            <AlertCircle size={18} /> {errorProducts}
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
            No specific products currently categorized for this solution. Explore our full catalog for tailored hardware options.
          </div>
        )}
      </div>

      {/* Recommended Industries */}
      <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>INDUSTRY VERTICALS</p>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Recommended Industries</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {pillar.recommendedIndustryIds.map((indId) => {
            const ind = INDUSTRY_VERTICALS[indId];
            if (!ind) return null;
            const Icon = ind.icon;
            return (
              <Link
                key={ind.id}
                to={`/industries?type=${ind.id}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1268a5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{ind.name.split('&')[0]}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    Explore Vertical <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recommended Environments / Applications */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>APPLICATION FINDER</p>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Choose Your Environment</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {pillar.environmentSubtitle || 'Select the environment where you are deploying security solutions.'}
          </p>
        </div>

        {applications.filter((app) => (pillar.applicationIds || []).includes(app.id)).length > 0 ? (
          <div className="application-grid">
            {applications
              .filter((app) => (pillar.applicationIds || []).includes(app.id))
              .map((application) => (
                <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
                  <img
                    src={application.image || ''}
                    alt={`${application.name} security application`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <span>{application.name}</span>
                    <p>{application.description}</p>
                    <b>View recommendation <ArrowRight size={16} /></b>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
            No specific environments are currently mapped to this solution.
          </div>
        )}
      </div>
    </div>
  );
}
