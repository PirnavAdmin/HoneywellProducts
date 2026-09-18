import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Clock, Wrench,
  RotateCcw, Search, ExternalLink, Calendar, CheckSquare
} from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { checkReturnEligibility, getReturnsConfig } from '../admin/api/returns';

export default function Warranty() {
  const [searchParams] = useSearchParams();
  const initialItemId = searchParams.get('itemId') || searchParams.get('orderId') || searchParams.get('serial') || searchParams.get('query') || '';

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

  const handleCheckWarranty = async (e, customId) => {
    if (e) e.preventDefault();
    const queryId = (customId !== undefined ? customId : orderItemId).trim();

    if (!queryId) {
      setError('Please enter an Order Number (e.g. ORD-31904), Item ID, or Product Serial Number.');
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
            Enter your Order Reference Number (e.g. <strong>ORD-31904</strong>) or Product Serial Number below to check live coverage status.
          </p>

          <form onSubmit={handleCheckWarranty} className="warranty-search-form">
            <div className="warranty-search-input-wrap">
              <Search size={17} className="portal-input-icon" />
              <input
                type="text"
                className="warranty-search-input"
                required
                placeholder="Enter Order # (e.g. ORD-31904), Item ID, or Serial Number"
                value={orderItemId}
                onChange={(e) => setOrderItemId(e.target.value)}
              />
            </div>
            <button type="submit" className="warranty-search-btn" disabled={loading}>
              {loading ? <span>Verifying...</span> : <><Search size={15} /><span>Check Eligibility</span></>}
            </button>
          </form>

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
            <div className={`portal-toast mt-4 ${eligibilityResult.eligible ? 'success' : 'error'}`} style={{ borderLeftWidth: '4px' }}>
              <div className="flex-1">
                {/* Status Title Banner */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {eligibilityResult.eligible ? (
                      <>
                        <CheckCircle2 size={20} className="text-emerald-700" />
                        <span className="text-emerald-900 font-extrabold">{eligibilityResult.returnEligibilityStatus || 'Product Eligible for Warranty & Return Service'}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="text-red-700" />
                        <span className="text-red-900 font-extrabold">Warranty Record Not Found or Inactive</span>
                      </>
                    )}
                  </div>
                  {eligibilityResult.warrantyStatus && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${eligibilityResult.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {eligibilityResult.warrantyStatus}
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="mt-3 p-3.5 bg-white/95 border border-emerald-200/80 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Product Name</span>
                    <span className="font-bold text-slate-900 text-sm">{eligibilityResult.productName}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Order Reference</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{eligibilityResult.orderReference || eligibilityResult.searchQuery}</span>
                  </div>

                  {eligibilityResult.purchaseDate && (
                    <div>
                      <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Purchase Date</span>
                      <span className="font-semibold text-slate-800">{eligibilityResult.purchaseDate}</span>
                    </div>
                  )}

                  {eligibilityResult.warrantyExpiryDate && (
                    <div>
                      <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Warranty Expiry Date</span>
                      <span className="font-semibold text-slate-800">{eligibilityResult.warrantyExpiryDate}</span>
                    </div>
                  )}

                  {eligibilityResult.daysRemaining !== undefined && (
                    <div className="md:col-span-2 bg-emerald-50/80 p-2.5 rounded border border-emerald-100 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Warranty Validity Remaining:</span>
                      <span className="font-bold text-emerald-800">{eligibilityResult.daysRemaining} Days (out of {eligibilityResult.warrantyDaysTotal || 365} days total)</span>
                    </div>
                  )}
                </div>

                {/* Eligible Claim Reasons */}
                {eligibilityResult.eligibleClaimReasons && eligibilityResult.eligibleClaimReasons.length > 0 && (
                  <div className="mt-3 bg-slate-50/90 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-emerald-600" />
                      Eligible Service &amp; Claim Reasons:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {eligibilityResult.eligibleClaimReasons.map((reason, idx) => (
                        <span key={idx} className="text-[11px] font-semibold bg-white text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button to proceed to Service Request */}
                {eligibilityResult.eligible && (
                  <div className="mt-4 pt-1 flex items-center gap-3">
                    <Link
                      to={`/service-request?serial=${encodeURIComponent(eligibilityResult.orderReference || orderItemId)}&product=${encodeURIComponent(eligibilityResult.productName || '')}`}
                      className="btn-portal-primary text-xs py-2.5 px-4 inline-flex items-center gap-2 font-bold"
                    >
                      <Wrench size={15} />
                      <span>Proceed to Service / Replacement Request</span>
                      <ExternalLink size={13} />
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
              <span>Honeywell Standard Warranty Policy &amp; Terms</span>
            </div>
          </div>

          <div className="service-cards-grid mb-0">
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <Clock size={16} className="text-sky-600" />
                <span>Coverage Duration</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard hardware components carry <strong>7 to 365 days</strong> of manufacturer warranty against hardware or component defects.
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Eligible Claim Reasons</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Hardware or Component Defect</li>
                <li>Power / Sensor / Display Fault</li>
                <li>Product Arrived Damaged / Defective Delivery</li>
                <li>Missing Parts or Accessories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CustomerAccountLayout>
  );
}
