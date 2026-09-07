import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { checkReturnEligibility, getReturnsConfig } from '../admin/api/returns';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function Warranty() {
  const [searchParams] = useSearchParams();
  const initialItemId = searchParams.get('itemId') || searchParams.get('orderId') || '';

  const [orderItemId, setOrderItemId] = useState(initialItemId);
  const [loading, setLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getReturnsConfig();
        setConfig(data);
      } catch (e) {
        console.error('Error loading returns config:', e);
      }
    }
    loadConfig();
  }, []);

  const handleCheckWarranty = async (e) => {
    if (e) e.preventDefault();
    if (!orderItemId.trim()) return;

    setLoading(true);
    setError(null);
    setEligibilityResult(null);

    try {
      const res = await checkReturnEligibility(orderItemId.trim());
      setEligibilityResult(res);
    } catch (err) {
      console.error('Error checking warranty eligibility:', err);
      setError('Unable to verify warranty record for the entered reference.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialItemId) {
      handleCheckWarranty();
    }
  }, [initialItemId]);

  return (
    <>
      <PageHero
        eyebrow="WARRANTY PROTECTION"
        title="Product Warranty &amp; Return Policy"
        description="Honeywell products come with standard manufacturer warranty protection and RMA support."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="warranty-checker-card">
            <h3>Check Warranty &amp; Return Eligibility</h3>
            <p>Enter your Order Item Reference or Product Serial Number to query real warranty eligibility.</p>
            <form onSubmit={handleCheckWarranty} className="warranty-check-form">
              <div className="form-group">
                <input
                  type="text"
                  required
                  placeholder="Enter Order Item ID or Serial #"
                  value={orderItemId}
                  onChange={(e) => setOrderItemId(e.target.value)}
                />
              </div>
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Verifying...' : 'Check Warranty'}
              </button>
            </form>

            {loading ? (
              <div className="route-loading" style={{ minHeight: '120px' }}>
                <p>Querying backend warranty database...</p>
              </div>
            ) : error ? (
              <div className="error-box mt-3">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : eligibilityResult ? (
              <div className={`eligibility-result-box ${eligibilityResult.eligible ? 'eligible' : 'ineligible'}`}>
                <div className="result-header">
                  {eligibilityResult.eligible ? <CheckCircle size={22} color="green" /> : <AlertCircle size={22} color="red" />}
                  <h4>{eligibilityResult.eligible ? 'Product Eligible for Warranty &amp; Return' : 'Warranty / Return Window Expired'}</h4>
                </div>
                <p>{eligibilityResult.reason}</p>
                {eligibilityResult.productName && (
                  <div className="result-details">
                    <span>Product: <strong>{eligibilityResult.productName}</strong></span>
                    {eligibilityResult.sku && <span>SKU: {eligibilityResult.sku}</span>}
                  </div>
                )}
                {eligibilityResult.eligible && (
                  <div className="mt-3">
                    <Link to={`/service-request?serial=${orderItemId}`} className="button button-small">
                      <Wrench size={14} /> Proceed to Service / Replacement Request
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="warranty-policy-section mt-5">
            <h2>Honeywell Warranty Terms &amp; Policy</h2>
            <div className="policy-cards-grid">
              <div className="policy-card">
                <Clock size={24} className="policy-icon" />
                <h4>Standard Coverage Period</h4>
                <p>Most Honeywell surveillance and solar hardware units include {config?.returnWindowDays || 15} to 365 days manufacturer warranty coverage against defects in materials and workmanship.</p>
              </div>
              <div className="policy-card">
                <CheckCircle size={24} className="policy-icon" />
                <h4>Eligible Claim Reasons</h4>
                <ul>
                  {config?.reasonCodes ? config.reasonCodes.map((r) => <li key={r.code}>{r.label}</li>) : (
                    <>
                      <li>Hardware or Component Defect</li>
                      <li>Power / Sensor Failure</li>
                      <li>Shipping Damage / Defective Delivery</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
