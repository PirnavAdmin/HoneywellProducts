import React from 'react';
import { Link } from 'react-router-dom';
import {
  LogIn, LayoutDashboard, ShieldCheck,
  TrendingUp, Headphones, GraduationCap, Sparkles,
  ArrowRight, Check, PhoneCall
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import DistributorsDirectory from '../components/business/DistributorsDirectory';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/capital-park2.jpg';

const partnerPillars = [
  {
    id: 'commercial',
    icon: TrendingUp,
    title: 'Wholesale Commercial Margins',
    description: 'Maximize your profitability with volume-tiered wholesale margins, project price protection, and annual retrospective rebate programs.',
    benefits: [
      'High-margin wholesale pricing structure',
      'Annual volume & growth rebate bonuses',
      'Tender-specific commercial price protection'
    ]
  },
  {
    id: 'presales',
    icon: Headphones,
    title: 'Pre-Sales & Engineering Support',
    description: 'Direct escalation to certified Honeywell system architects for complex BOQ drafting, technical specifications, and RFP compliance.',
    benefits: [
      'End-to-end CCTV & Solar BOQ drafting',
      'Tender compliance & architectural specs',
      'Priority pre-sales technical helpline'
    ]
  },
  {
    id: 'training',
    icon: GraduationCap,
    title: 'Certification & Academy',
    description: 'Equip your technical and sales teams with official Honeywell certifications, installation workshops, and hands-on commissioning guides.',
    benefits: [
      'Official Honeywell Certified Partner badge',
      'Free access to video training & webinars',
      'Field installer enablement & firmware labs'
    ]
  },
  {
    id: 'deals',
    icon: ShieldCheck,
    title: 'Deal Registration & Lead Protection',
    description: 'Safeguard your enterprise project pipeline with guaranteed deal registration that locks in special pricing and prevents channel conflict.',
    benefits: [
      '90-day guaranteed project price lock',
      'Exclusive manufacturer bid protection',
      'Inbound enterprise leads sharing'
    ]
  },
  {
    id: 'marketing',
    icon: Sparkles,
    title: 'Co-Op Marketing & Brand Assets',
    description: 'Leverage global Honeywell brand prestige with co-branded collateral, demo showroom units, marketing toolkits, and exhibition co-funding.',
    benefits: [
      'Co-branded sales & technical brochures',
      'Subsidized showroom display demo kits',
      'Regional trade show & event sponsorships'
    ]
  },
  {
    id: 'portal',
    icon: LayoutDashboard,
    title: 'Partner Portal & Rapid Logistics',
    description: '24/7 dedicated partner dashboard for real-time inventory tracking, 1-click quote generation, warranty verification, and priority dispatch.',
    benefits: [
      'Live stock visibility across 14 hubs',
      'Instant wholesale quote & invoice builder',
      '24–48 hours express regional dispatch'
    ]
  }
];


const onboardingSteps = [
  {
    number: '01',
    title: 'Submit Application',
    description: 'Complete the online partner form with your business profile, GSTIN, and preferred partnership track.'
  },
  {
    number: '02',
    title: 'Compliance Review',
    description: 'Our commercial channel management team reviews and validates your credentials within 24–48 hours.'
  },
  {
    number: '03',
    title: 'Portal & Pricing Setup',
    description: 'Receive your Partner Dashboard login, commercial wholesale price list, and technical collateral access.'
  },
  {
    number: '04',
    title: 'Scale & Grow Revenue',
    description: 'Register enterprise project leads, request priority stock quotes, and accelerate your commercial sales.'
  }
];

export default function PartnerBenefits() {
  useDocumentTitle(
    'Honeywell Partner Program & Benefits',
    'Discover commercial wholesale margins, technical pre-sales support, deal registration, and official certification.'
  );

  const { openQuote } = useUI();

  return (
    <div className="partner-benefits-page">
      <PageHero
        eyebrow="HONEYWELL PARTNER ECOSYSTEM"
        title="Honeywell Partner Program & Benefits"
        description="Empowering distributors, system integrators, dealers, and installers with industry-leading commercial margins, priority engineering support, deal protection, and certified training."
        image={heroImage}
      />

      {/* Trust & Metric Highlights Bar */}
      <div className="partner-metrics-ribbon">
        <div className="container">
          <div className="partner-metrics-grid">
            <div className="partner-metric-item">
              <span className="partner-metric-val">14+</span>
              <span className="partner-metric-label">Regional Stockist Hubs</span>
              <small>Pan-India 100% Territory Reach</small>
            </div>
            <div className="partner-metric-item">
              <span className="partner-metric-val">Up to 35%</span>
              <span className="partner-metric-label">Commercial Partner Margins</span>
              <small>Wholesale & Volume Rebates</small>
            </div>
            <div className="partner-metric-item">
              <span className="partner-metric-val">24/7</span>
              <span className="partner-metric-label">Dedicated Pre-Sales Desk</span>
              <small>Engineering & BOQ Validation</small>
            </div>
            <div className="partner-metric-item">
              <span className="partner-metric-val">100%</span>
              <span className="partner-metric-label">Certified Equipment</span>
              <small>BIS, CE, FCC, RoHS Verified</small>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Advantages Grid */}
      <section className="section partner-pillars-section">
        <div className="container">
          <SectionHeading
            eyebrow="CORE ADVANTAGES"
            title="Why Partner with Honeywell?"
            description="Our commercial framework is engineered to maximize profitability, eliminate channel conflict, and accelerate project execution."
            align="center"
          />

          <div className="partner-pillars-grid">
            {partnerPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.id} className="partner-pillar-card">
                  <div className="pillar-header">
                    <div className="pillar-icon-box">
                      <Icon size={22} />
                    </div>
                    <h3>{pillar.title}</h3>
                  </div>
                  <p className="pillar-desc">{pillar.description}</p>
                  <div className="pillar-divider" />
                  <ul className="pillar-benefits-list">
                    {pillar.benefits.map((b) => (
                      <li key={b}>
                        <span className="pillar-check-badge">
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>


      {/* 4-Step Onboarding Process */}
      <section className="section partner-process-section">
        <div className="container">
          <SectionHeading
            eyebrow="FAST-TRACK ONBOARDING"
            title="4 Simple Steps to Get Started"
            description="Our streamlined onboarding process gets your business verified and commercial pricing activated quickly."
            align="center"
          />

          <div className="partner-process-grid">
            {onboardingSteps.map((step) => (
              <div key={step.number} className="partner-process-card">
                <div className="process-step-num">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authorized Regional Distributors Directory Carousel */}
      <DistributorsDirectory />

      {/* High Impact Enterprise Call to Action */}
      <section className="partner-cta-banner-section">
        <div className="container">
          <div className="partner-cta-banner-card">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">COMMERCIAL PARTNERSHIP</span>
              <h2>Ready to Grow Your Enterprise with Honeywell?</h2>
              <p>
                Join over 500+ certified regional distributors, dealers, and systems integrators across India. Submit your business profile to get started today.
              </p>
              <div className="cta-banner-buttons">
                <Link to="/business#partner" className="button button-red">
                  Apply for Partnership <ArrowRight size={16} />
                </Link>
                <Link to="/partner/login" className="button button-ghost">
                  <LogIn size={15} /> Partner Portal Login
                </Link>
                <button
                  type="button"
                  onClick={() => openQuote('Partner Program')}
                  className="button button-ghost-light"
                >
                  <PhoneCall size={15} /> Request Callback
                </button>
              </div>
            </div>
            <div className="cta-banner-badge-box">
              <div className="cta-badge-inner">
                <ShieldCheck size={36} className="cta-badge-icon" />
                <strong>100% Genuine</strong>
                <span>Official Commercial Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
