import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Clock, Wrench, RotateCcw, Search, ExternalLink, Tag } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { checkReturnEligibility, getReturnsConfig } from '../admin/api/returns';

export default function Warranty() {
  const [searchParams] = useSearchParams();
  const initialItemId = searchParams.get('itemId') || searchParams.get('orderId') || '';

  const [orderItemId, setOrderItemId] = useState(initialItemId);
  const [loading, setLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  // Sample IDs for quick interactive testing
  const sampleTestIds = ['ORD-10214-1', 'SN-HW-9082', 'ORD-10190-2'];

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

  const handleCheckWarranty = async (e, customId) => {
    if (e) e.preventDefault();
    const queryId = (customId !== undefined ? customId : orderItemId).trim();

    if (!queryId) {
      setError('Please enter an Order Item ID or Serial Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setEligibilityResult(null);

    try {
      const res = await checkReturnEligibility(queryId);
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
      handleCheckWarranty(null, initialItemId);
    }
  }, [initialItemId]);

  const handleSampleClick = (sampleId) => {
    setOrderItemId(sampleId);
    handleCheckWarranty(null, sampleId);
  };

  return (
    <CustomerAccountLayout
      title="Warranty & Returns"
      subtitle="Verify hardware coverage, check return eligibility, and request warranty service."
    >
      <div className="portal-cards-stack">
        {/* Header Section */}
        <div className="portal-card-header mb-0">
          <h2>
            <ShieldCheck size={20} className="text-sky-600" />
            <span>Warranty &amp; Returns Portal</span>
          </h2>
          <span className="portal-status-badge success">
            Coverage Database Active
          </span>
        </div>

        {/* Primary Service Pillars Grid */}
        <div className="service-cards-grid mb-0">
          <div className="service-card-item">
            <div className="service-card-icon bg-sky-50 text-sky-600 border border-sky-100">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Hardware Warranty Coverage</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                All Honeywell products feature comprehensive manufacturer warranty coverage. Check status using your order reference or serial number.
              </p>
            </div>
          </div>

          <div className="service-card-item">
            <div className="service-card-icon bg-emerald-50 text-emerald-600 border border-emerald-100">
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Product Returns &amp; RMA</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Eligible purchases within the standard return window can be processed for return, replacement, or warranty repair service.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Warranty & Return Eligibility Checker Card */}
        <div className="portal-card-box">
          <div className="portal-card-section-header">
            <div className="portal-card-section-title">
              <Search size={16} />
              <span>Check Coverage &amp; Return Eligibility</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Instant Database Lookup</span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Enter your Order Item Reference ID or Product Serial Number below to check live coverage status.
          </p>

          <form onSubmit={handleCheckWarranty} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
            <div className="portal-input-wrap flex-1">
              <Search size={16} className="portal-input-icon" />
              <input
                type="text"
                className="portal-input has-icon"
                required
                placeholder="Enter Order Item ID or Serial # (e.g. ORD-10214-1)"
                value={orderItemId}
                onChange={(e) => setOrderItemId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-portal-primary whitespace-nowrap" disabled={loading}>
              {loading ? <span>Verifying...</span> : <><Search size={15} /><span>Check Eligibility</span></>}
            </button>
          </form>

          {/* Quick Sample Test Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1">
              <Tag size={13} /> Try sample IDs:
            </span>
            {sampleTestIds.map((sampleId) => (
              <button
                key={sampleId}
                type="button"
                onClick={() => handleSampleClick(sampleId)}
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  borderRadius: '6px',
                  padding: '3px 9px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {sampleId}
              </button>
            ))}
          </div>

          {/* Result States */}
          {loading ? (
            <div className="py-6 text-center" role="status">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent mb-2" />
              <p className="text-slate-600 font-semibold text-xs">Checking Honeywell database records...</p>
            </div>
          ) : error ? (
            <div className="portal-toast error mt-3" role="alert">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : eligibilityResult ? (
            <div className={`portal-toast mt-3 ${eligibilityResult.eligible ? 'success' : 'error'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                  {eligibilityResult.eligible ? <CheckCircle2 size={18} className="text-emerald-700" /> : <AlertCircle size={18} className="text-red-700" />}
                  <span>{eligibilityResult.eligible ? 'Product Eligible for Warranty & Return Service' : 'Warranty / Return Window Expired'}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{eligibilityResult.reason}</p>
                
                {eligibilityResult.productName && (
                  <div className="mt-3 p-3 bg-white/90 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold">Product:</span>
                      <span className="font-bold text-slate-900">{eligibilityResult.productName}</span>
                    </div>
                    {eligibilityResult.sku && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                        <span className="text-slate-500 font-semibold">SKU:</span>
                        <span className="font-mono font-bold text-emerald-800">{eligibilityResult.sku}</span>
                      </div>
                    )}
                  </div>
                )}

                {eligibilityResult.eligible && (
                  <div className="mt-3 pt-2">
                    <Link to={`/service-request?serial=${encodeURIComponent(orderItemId)}`} className="btn-portal-primary text-xs py-2 px-3 inline-flex items-center gap-2">
                      <Wrench size={14} />
                      <span>Proceed to Service / Replacement Request</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Honeywell Warranty Policy & Terms Section */}
        <div className="portal-card-box">
          <div className="portal-card-section-header">
            <div className="portal-card-section-title">
              <Clock size={16} />
              <span>Honeywell Standard Warranty Policy</span>
            </div>
          </div>

          <div className="service-cards-grid mb-0">
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <Clock size={16} className="text-sky-600" />
                <span>Coverage Duration</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard hardware components carry <strong>{config?.returnWindowDays || 15} to 365 days</strong> of manufacturer warranty against hardware or component defects.
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Eligible Claim Reasons</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
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
    </CustomerAccountLayout>
  );
}
