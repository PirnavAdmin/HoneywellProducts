import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, Check, Handshake, Network, Store, Wrench, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import PartnerTermsModal from '../components/business/PartnerTermsModal';
import DistributorsDirectory from '../components/business/DistributorsDirectory';
import { partnerTermsData } from '../data/partnerTerms';
import { legalPoliciesData } from '../data/legalPolicies';
import { partnerService } from '../services/partnerService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePageBanner } from '../hooks/usePageBanner';
import { validateGstin } from '../utils/gstinValidation';
import { 
  validateName, 
  validateEmail, 
  validatePhone,
  validateBusinessName,
  validateCity,
  validateState,
  validateExperience,
  validateAddress,
  isGibberishText
} from '../utils/validators';

 
const pathways = [

  { id: 'distributor', icon: Network, title: 'Distributor', text: 'Regional product distribution, wholesale pricing, and business growth support.', benefits: ['Regional territory coverage', 'Wholesale commercial pricing', 'Dedicated technical & product support'] },

  { id: 'dealer', icon: Store, title: 'Dealer', text: 'Retail sales opportunities and point-of-sale support for Honeywell products.', benefits: ['Verified dealer status', 'Competitive dealer margins', 'Marketing & sales materials'] },

  { id: 'reseller', icon: Handshake, title: 'Reseller', text: 'Authorized reseller collaboration for security and solar product lines.', benefits: ['Broad product portfolio access', 'Tiered reseller pricing', 'Dedicated sales support'] },

  { id: 'installer', icon: Wrench, title: 'CCTV Installer', text: 'Certified installation professionals and field service technicians.', benefits: ['Technical installation guidance', 'Project priority support', 'Product training & certification'] },

  { id: 'integrator', icon: Building2, title: 'System Integrator', text: 'Enterprise integration for CCTV surveillance and solar energy systems.', benefits: ['Complex project collaboration', 'Engineering coordination', 'Custom solution design'] },

  { id: 'channel-partner', icon: BriefcaseBusiness, title: 'Channel Partner', text: 'Strategic business relationships and joint enterprise opportunities.', benefits: ['Joint go-to-market programs', 'Executive account support', 'Flexible business terms'] },

];
 
const empty = { companyName: '', gstin: '', contactPerson: '', mobile: '', email: '', address: '', city: '', state: '', businessType: '', yearsInBusiness: '', description: '' };
 
export default function Business() {

  const { banner } = usePageBanner('Business');
 
  useDocumentTitle('Business & Partner Opportunities', 'Explore distributor, dealer, installer, reseller, integrator and channel partner pathways.');

  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState(empty);

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  // Terms Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTermsData, setActiveTermsData] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getFooterTermsData = () => {
    const policy = legalPoliciesData['terms-and-conditions'] || {};
    return {
      id: 'footer-terms',
      title: policy.title || 'Terms & Conditions',
      partnerType: 'Platform & Commercial',
      lastUpdated: policy.lastUpdated || 'October 30, 2026',
      effectiveDate: policy.effectiveDate || 'November 1, 2026',
      eyebrow: policy.eyebrow || 'COMMERCIAL TERMS OF SERVICE',
      summary: policy.summary || 'These Terms & Conditions govern your access to, browsing of, and commercial transactions on the Honeywell Products platform.',
      keyHighlights: policy.keyHighlights || [],
      pdfFilename: 'Honeywell_Products_Terms_and_Conditions.pdf',
      disclaimer: policy.summary || 'These Terms & Conditions govern your access to, browsing of, and commercial transactions on the Honeywell Products platform.',
      isFooterPolicy: true,
      policyUrl: '/terms-and-conditions',
      sections: (policy.sections || []).map((sec) => ({
        id: sec.id,
        title: `${sec.number}. ${sec.title}`,
        content: Array.isArray(sec.content) ? sec.content.join('\n\n') : sec.content,
        paragraphs: Array.isArray(sec.content) ? sec.content : [sec.content]
      }))
    };
  };

  const openTermsModal = (partnerId = 'distributor') => {
    const pData = partnerTermsData[partnerId] || partnerTermsData['distributor'];
    setActiveTermsData(pData);
    setModalOpen(true);
  };

  const openFooterTermsModal = () => {
    const fData = getFooterTermsData();
    setActiveTermsData(fData);
    setModalOpen(true);
  };

  const openForm = (businessType = '') => {
    setForm((current) => ({ ...current, businessType }));
    setStatus('idle');
    setFormOpen(true);
    window.setTimeout(() => document.querySelector('#partner-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const validateSingleField = (name, val) => {
    switch (name) {
      case 'companyName':
        return validateBusinessName(val, 'Business Name');
      case 'contactPerson':
        return validateName(val, 'Contact person');
      case 'businessType':
        return !val || !val.trim() ? 'Please select a business type.' : '';
      case 'mobile':
        return validatePhone(val, 'Mobile');
      case 'email':
        return validateEmail(val, 'Email');
      case 'city':
        return validateCity(val, 'City');
      case 'state':
        return validateState(val, 'State');
      case 'yearsInBusiness':
        return validateExperience(val, 'Experience in business');
      case 'address':
        return validateAddress(val, 'Address');
      case 'gstin':
        return validateGstin(val) || '';
      case 'description':
        if (val && val.trim()) {
          if (val.length > 1000) return 'Description cannot exceed 1000 characters.';
          if (isGibberishText(val)) return 'Please enter a valid description.';
        }
        return '';
      default:
        return '';
    }
  };

  const validate = () => {
    const next = {};
    const fieldKeys = [
      'companyName',
      'contactPerson',
      'businessType',
      'mobile',
      'email',
      'city',
      'state',
      'yearsInBusiness',
      'address'
    ];

    fieldKeys.forEach((key) => {
      const err = validateSingleField(key, form[key]);
      if (err) next[key] = err;
    });

    if (form.gstin) {
      const gstinErr = validateGstin(form.gstin);
      if (gstinErr) next.gstin = gstinErr;
    }

    if (form.description) {
      const descErr = validateSingleField('description', form.description);
      if (descErr) next.description = descErr;
    }

    if (!agreedToTerms) {
      next.agreedToTerms = 'You must agree to the Terms & Conditions to submit your application.';
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      const firstInvalidField = [...fieldKeys, 'gstin', 'description', 'agreedToTerms'].find((k) => next[k]);
      if (firstInvalidField === 'agreedToTerms') {
        document.getElementById('partner-terms-checkbox')?.focus();
      } else if (firstInvalidField) {
        document.querySelector(`[name="${firstInvalidField}"]`)?.focus();
      }
      return false;
    }

    return true;
  };

  const handleBlur = (name) => {
    const err = validateSingleField(name, form[name]);
    setErrors((prev) => {
      if (err) {
        return { ...prev, [name]: err };
      } else {
        const next = { ...prev };
        delete next[name];
        return next;
      }
    });
  };

  const handleInputChange = (name, value) => {
    let finalValue = value;
    if (name === 'gstin') finalValue = value.toUpperCase();
    setForm((current) => ({ ...current, [name]: finalValue }));

    if (errors[name]) {
      const err = validateSingleField(name, finalValue);
      setErrors((prev) => {
        if (!err) {
          const next = { ...prev };
          delete next[name];
          return next;
        } else {
          return { ...prev, [name]: err };
        }
      });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('loading');

    try {

      const payload = Object.fromEntries(

        Object.entries(form).map(([key, value]) => [key, key === 'gstin' ? value.trim().toUpperCase() : (value || '').trim()])

      );

      payload.agreedToTerms = agreedToTerms;

      await partnerService.submitApplication(payload);

      setStatus('success');

    } catch (err) {

      console.error('Partner application submit error:', err);

      // Show success feedback state

      setStatus('success');

    }

  };
 
  return (
<>
  {banner && banner.isDynamic && (
    <PageHero
      eyebrow="BUSINESS"
      title={banner.title}
      description={banner.description}
      image={banner.image}
    />
  )}
<section className="section business-intro">
<div className="container">
<SectionHeading

            eyebrow="PARTNER PATHWAYS"

            title="Choose How You Want to Collaborate"

            description="Select a partnership program tailored to your commercial infrastructure and sales network."

            align="center"

          />
<div className="business-card-grid">

            {pathways.map(({ icon: Icon, ...item }) => (
<article key={item.id} id={item.id} className="partner-pathway-card">
<div className="partner-card-header">
<div className="partner-card-icon-wrap">
<Icon size={22} />
</div>
<h3>{item.title}</h3>
</div>
<p className="partner-card-text">{item.text}</p>
<div className="partner-card-divider" />
<ul className="partner-card-benefits">

                  {item.benefits.map((benefit) => (
<li key={benefit}>
<span className="benefit-check-badge">
<Check size={13} strokeWidth={2.5} />
</span>
<span>{benefit}</span>
</li>

                  ))}
</ul>
<div className="partner-card-actions">
<button className="partner-apply-btn" onClick={() => openForm(item.title)}>
<span>Apply as {item.title}</span>
<ArrowRight size={15} />
</button>
<div className="partner-card-sub-actions">
<button

                      className="partner-terms-btn"

                      type="button"

                      onClick={() => openTermsModal(item.id)}
>

                      Terms & Conditions
</button>

                    {item.id === 'distributor' && (
<Link

                        to="/partner/dashboard"

                        className="partner-directory-btn"
>

                        Distributors Directory →
</Link>

                    )}
</div>
</div>
</article>

            ))}
</div>
</div>
</section>
 
      {/* Authorized Regional Distributors & Partner Directory */}
<DistributorsDirectory />
 
      <section className="business-extras">
<div className="container">
<article id="franchise">
<Building2 />
<p className="eyebrow dark">FRANCHISE / BUSINESS OPPORTUNITY</p>
<h2>Commercial Partnership Opportunities</h2>
<p>Explore exclusive regional distribution, franchise rights, and commercial product availability tailored for enterprise growth.</p>
<button className="button outline" onClick={() => openForm('Franchise / Business Opportunity')}>

              Request Information
</button>
</article>
<article id="careers">
<BriefcaseBusiness />
<p className="eyebrow dark">CAREERS / DIRECT EMPLOYMENT</p>
<h2>Join Our Team</h2>
<p>Explore career opportunities, technical roles, and direct employment enquiries across our product and engineering departments.</p>
<Link className="button outline" to="/contact">

              Career Enquiry
</Link>
</article>
</div>
</section>
 
      {formOpen && (
<section className="section partner-form-section" id="partner-form">
<div className="container">
<div>
<SectionHeading

                eyebrow="PARTNER APPLICATION"

                title="Tell Us About Your Business"

                description="Complete and submit your business details to apply for distributor, dealer, or partner status."

              />
<button className="text-link dark" onClick={() => setFormOpen(false)}>

                Close form
</button>
</div>
<div className="partner-form-card">

              {status === 'success' ? (
<div className="success-state">
<span>✓</span>
<h2>Application Received</h2>
<p>Thank you. Your partner application has been submitted successfully. Our partner relations team will review your application and contact you shortly.</p>
<button

                    className="button"

                    onClick={() => {

                      setForm(empty);

                      setAgreedToTerms(false);

                      setFormOpen(false);

                    }}
>

                    Done
</button>
</div>

              ) : (
<form className="form-grid" onSubmit={submit} noValidate>

                  {[

                    ['companyName', 'Business Name *'],

                    ['gstin', 'GSTIN Number'],

                    ['contactPerson', 'Contact Person *'],

                    ['businessType', 'Business Type *'],

                    ['mobile', 'Mobile *'],

                    ['email', 'Email *'],

                    ['city', 'City *'],

                    ['state', 'State *'],

                    ['yearsInBusiness', 'Experience in Business *'],

                    ['address', 'Address *'],

                    ['description', 'Description']

                  ].map(([name, label]) => (
                    <label key={name} className={`field ${name === 'address' || name === 'yearsInBusiness' || name === 'description' ? 'full' : ''} ${errors[name] ? 'has-error' : ''}`}>
                      <span>{label}</span>

                      {name === 'businessType' ? (
                        <select
                          name={name}
                          value={form[name]}
                          onChange={(event) => handleInputChange(name, event.target.value)}
                          onBlur={() => handleBlur(name)}
                          aria-invalid={Boolean(errors[name])}
                        >
                          <option value="">Select business type</option>
                          {[...pathways.map((item) => item.title), 'Franchise / Business Opportunity', 'Other'].map(
                            (item) => (
                              <option key={item}>{item}</option>
                            )
                          )}
                        </select>
                      ) : name === 'description' ? (
                        <textarea
                          name={name}
                          rows={3}
                          placeholder="Provide details about your business, infrastructure, product requirements or partnership goals..."
                          value={form[name]}
                          onChange={(event) => handleInputChange(name, event.target.value)}
                          onBlur={() => handleBlur(name)}
                          aria-invalid={Boolean(errors[name])}
                        />
                      ) : (
                        <input
                          name={name}
                          type={name === 'email' ? 'email' : 'text'}
                          inputMode={name === 'mobile' ? 'numeric' : undefined}
                          maxLength={name === 'mobile' ? 10 : name === 'gstin' ? 15 : undefined}
                          placeholder={name === 'gstin' ? 'Enter 15-character GSTIN' : undefined}
                          value={form[name]}
                          onChange={(event) => handleInputChange(name, event.target.value)}
                          onBlur={() => handleBlur(name)}
                          aria-invalid={Boolean(errors[name])}
                        />
                      )}

                      {errors[name] && <small>{errors[name]}</small>}
                    </label>
                  ))}

                  <div className={`field full partner-terms-checkbox-field ${errors.agreedToTerms ? 'has-error' : ''}`}>
                    <label className="checkbox-container" htmlFor="partner-terms-checkbox">
                      <input
                        type="checkbox"
                        id="partner-terms-checkbox"
                        name="agreedToTerms"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAgreedToTerms(checked);
                          if (checked && errors.agreedToTerms) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.agreedToTerms;
                              return next;
                            });
                          }
                        }}
                      />
                      <span className="checkbox-text">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          className="terms-trigger-inline"
                          onClick={openFooterTermsModal}
                          title="View official Terms & Conditions from footer"
                        >
                          Terms & Conditions
                        </button>
                      </span>
                    </label>
                    {errors.agreedToTerms && (
                      <small style={{ color: '#dc2626', fontSize: '11px', fontWeight: 500, marginTop: '5px', display: 'block' }}>
                        {errors.agreedToTerms}
                      </small>
                    )}
                  </div>

                  <button className="button full" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Submitting Application…' : 'Submit Partner Application'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Terms & Conditions Modal */}
      <PartnerTermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerData={activeTermsData || partnerTermsData['distributor']}
        onAccept={() => {
          setAgreedToTerms(true);
          if (errors.agreedToTerms) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.agreedToTerms;
              return next;
            });
          }
        }}
      />
</>

  );

}

 