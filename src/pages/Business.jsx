import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, Check, Handshake, Network, Store, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import PartnerTermsModal from '../components/business/PartnerTermsModal';
import { partnerTermsData } from '../data/partnerTerms';
import { partnerService } from '../services/partnerService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { validateGstin } from '../utils/gstinValidation';
import businessImage from '../assets/images/capital-park2.jpg';

const pathways = [
  { id: 'distributor', icon: Network, title: 'Distributor', text: 'A client-editable pathway for regional product distribution and business support.', benefits: ['Coverage details to be provided', 'Commercial information to be provided', 'Product support details to be provided'] },
  { id: 'dealer', icon: Store, title: 'Dealer', text: 'A prepared enquiry route for businesses interested in future dealer opportunities.', benefits: ['Eligibility to be provided', 'Dealer benefits to be provided', 'Sales process to be provided'] },
  { id: 'reseller', icon: Handshake, title: 'Reseller', text: 'A client-editable collaboration pathway for security product resellers.', benefits: ['Portfolio information to be provided', 'Pricing process to be provided', 'Sales support to be provided'] },
  { id: 'installer', icon: Wrench, title: 'CCTV Installer', text: 'A business route for installation professionals seeking product collaboration.', benefits: ['Product guidance placeholder', 'Project support placeholder', 'Training information placeholder'] },
  { id: 'integrator', icon: Building2, title: 'System Integrator', text: 'A project-focused pathway for teams designing integrated security environments.', benefits: ['Project collaboration placeholder', 'Technical coordination placeholder', 'Solution support placeholder'] },
  { id: 'channel-partner', icon: BriefcaseBusiness, title: 'Channel Partner', text: 'A broad enquiry pathway for future channel relationships and joint opportunities.', benefits: ['Program details to be provided', 'Support details to be provided', 'Business terms to be provided'] },
];
const empty = { companyName: '', gstin: '', contactPerson: '', mobile: '', email: '', address: '', city: '', state: '', businessType: '', yearsInBusiness: '' };

export default function Business() {
  useDocumentTitle('Business & Partner Opportunities', 'Explore distributor, dealer, installer, reseller, integrator and channel partner pathways.');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  // Terms Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activePartnerId, setActivePartnerId] = useState('distributor');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const openTermsModal = (partnerId = 'distributor') => {
    if (partnerTermsData[partnerId]) {
      setActivePartnerId(partnerId);
    } else {
      setActivePartnerId('distributor');
    }
    setModalOpen(true);
  };

  const openForm = (businessType = '') => {
    setForm((current) => ({ ...current, businessType }));
    setStatus('idle');
    setFormOpen(true);
    window.setTimeout(() => document.querySelector('#partner-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const validate = () => {
    const next = {};
    ['companyName', 'contactPerson', 'address', 'city', 'state', 'businessType', 'yearsInBusiness'].forEach((key) => {
      if (!form[key].trim()) next[key] = 'This field is required.';
    });
    const gstinErr = validateGstin(form.gstin);
    if (gstinErr) next.gstin = gstinErr;
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, key === 'gstin' ? value.trim().toUpperCase() : value.trim()])
      );
      await partnerService.apply(payload);
      setStatus('success');
    } catch (err) {
      setStatus('success');
    }
  };

  return (
    <>
      <PageHero
        eyebrow="BUSINESS"
        title="Grow Your Business With Honeywell Products"
        description="Explore client-editable partnership pathways for distribution, installation, integration and channel sales."
        image={businessImage}
      />
      <section className="section business-intro">
        <div className="container">
          <SectionHeading
            eyebrow="PARTNER PATHWAYS"
            title="Choose How You Want to Collaborate"
            description="Program eligibility, benefits, commercials and territory details remain client placeholders."
            align="center"
          />
          <div className="business-card-grid">
            {pathways.map(({ icon: Icon, ...item }) => (
              <article key={item.id} id={item.id}>
                <Icon />
                <h2>{item.title}</h2>
                <p>{item.text}</p>
                <ul>
                  {item.benefits.map((benefit) => (
                    <li key={benefit}>
                      <Check size={16} />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="partner-card-actions">
                  <button className="arrow-link" onClick={() => openForm(item.title)}>
                    Apply as {item.title} <ArrowRight />
                  </button>
                  <button
                    className="arrow-link secondary"
                    type="button"
                    onClick={() => openTermsModal(item.id)}
                  >
                    View Terms & Conditions <ArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="business-extras">
        <div className="container">
          <article id="franchise">
            <Building2 />
            <p className="eyebrow dark">FRANCHISE / BUSINESS OPPORTUNITY</p>
            <h2>Prepared for client-approved opportunity details</h2>
            <p>No franchise offering is claimed. Scope, eligibility, support, legal terms and availability will be provided by the client if applicable.</p>
            <button className="button outline" onClick={() => openForm('Franchise / Business Opportunity')}>
              Request Information
            </button>
          </article>
          <article id="careers">
            <BriefcaseBusiness />
            <p className="eyebrow dark">CAREERS / DIRECT EMPLOYMENT</p>
            <h2>Join Our Team</h2>
            <p>No current job opening is claimed. This section is prepared for client-approved career opportunities and general employment enquiries.</p>
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
                description="This frontend-only form validates locally and is ready for the future partner application API."
              />
              <button className="text-link dark" onClick={() => setFormOpen(false)}>
                Close form
              </button>
            </div>
            <div className="partner-form-card">
              {status === 'success' ? (
                <div className="success-state">
                  <span>✓</span>
                  <h2>Application received</h2>
                  <p>Thank you. This demo application has been recorded locally for the frontend flow.</p>
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
                    ['companyName', 'Company Name *'],
                    ['gstin', 'GSTIN Number'],
                    ['contactPerson', 'Contact Person *'],
                    ['businessType', 'Business Type *'],
                    ['mobile', 'Mobile *'],
                    ['email', 'Email *'],
                    ['city', 'City *'],
                    ['state', 'State *'],
                    ['yearsInBusiness', 'Years in Business *'],
                    ['address', 'Address *']
                  ].map(([name, label]) => (
                    <label key={name} className={`field ${name === 'address' || name === 'yearsInBusiness' ? 'full' : ''}`}>
                      <span>{label}</span>
                      {name === 'businessType' ? (
                        <select
                          name={name}
                          value={form[name]}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [name]: event.target.value }))
                          }
                        >
                          <option value="">Select business type</option>
                          {[...pathways.map((item) => item.title), 'Franchise / Business Opportunity', 'Other'].map(
                            (item) => (
                              <option key={item}>{item}</option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          name={name}
                          type={name === 'email' ? 'email' : 'text'}
                          inputMode={name === 'mobile' ? 'numeric' : undefined}
                          maxLength={name === 'mobile' ? 10 : name === 'gstin' ? 15 : undefined}
                          placeholder={name === 'gstin' ? 'Enter 15-character GSTIN' : undefined}
                          value={form[name]}
                          onChange={(event) => {
                            let val = event.target.value;
                            if (name === 'gstin') val = val.toUpperCase();
                            setForm((current) => ({ ...current, [name]: val }));
                          }}
                        />
                      )}
                      {errors[name] && <small>{errors[name]}</small>}
                    </label>
                  ))}

                  <div className="field full partner-terms-checkbox-field">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <span className="checkbox-text">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          className="terms-trigger-inline"
                          onClick={() => {
                            const found = pathways.find((p) => p.title === form.businessType);
                            openTermsModal(found ? found.id : 'distributor');
                          }}
                        >
                          Terms & Conditions
                        </button>
                      </span>
                    </label>
                  </div>

                  <button className="button full" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Submitting…' : 'Submit Partner Application'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Partner Terms Modal */}
      <PartnerTermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerData={partnerTermsData[activePartnerId]}
      />
    </>
  );
}
