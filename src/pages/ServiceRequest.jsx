import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Wrench, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { API_BASE_URL } from '../services/api';
import heroImage from '../assets/images/capital-park2.jpg';

const HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export default function ServiceRequest() {
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [productName, setProductName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [issueType, setIssueType] = useState('Hardware Defect');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Auto-fill form fields from URL search params if navigated from Warranty or Order page
  useEffect(() => {
    const serialParam = searchParams.get('serial') || searchParams.get('sn');
    const orderParam = searchParams.get('order') || searchParams.get('orderId');
    const productParam = searchParams.get('product') || searchParams.get('model');

    if (serialParam) setSerialNumber(serialParam);
    if (orderParam) setOrderNumber(orderParam);
    if (productParam) setProductName(productParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !description.trim()) {
      setError('Please provide your name, mobile number, and problem description.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      fullName: name.trim(),
      mobile: mobile.trim(),
      mobileNumber: mobile.trim(),
      email: email.trim(),
      productName: productName.trim() || 'Honeywell Product',
      serialNumber: serialNumber.trim(),
      orderNumber: orderNumber.trim(),
      issueType,
      description: description.trim(),
      problemDescription: description.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/Support/service-request`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => null);

      if (!response.ok || (resData && resData.success === false)) {
        throw new Error(resData?.message || `Failed to submit service request (${response.status})`);
      }

      setResultData({
        ticketId: resData?.ticketId,
        ticketCode: resData?.ticketCode || (resData?.ticketId ? `TCK-SRV-${resData.ticketId}` : 'TCK-SRV-SUBMITTED'),
        message: resData?.message || 'Your technical service & repair ticket has been submitted successfully.',
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Service request submission error:', err);
      setError(err.message || 'Failed to submit service request to backend. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setResultData(null);
    setName('');
    setMobile('');
    setEmail('');
    setProductName('');
    setSerialNumber('');
    setOrderNumber('');
    setDescription('');
    setError(null);
  };

  return (
    <>
      <PageHero
        eyebrow="TECHNICAL SERVICE"
        title="Service &amp; Repair Request"
        description="Submit a technical service inquiry or hardware inspection ticket for your product."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {submitted ? (
            <div className="empty-state" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <CheckCircle2 size={64} style={{ color: '#16a34a', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Service Request Submitted
              </h2>
              <p style={{ color: '#475569', fontSize: '15px', marginBottom: '20px' }}>
                {resultData?.message}
              </p>

              {(resultData?.ticketCode || resultData?.ticketId) && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                    Reference Ticket Number
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', fontFamily: 'monospace', display: 'block' }}>
                    {resultData.ticketCode}
                  </span>
                  {resultData.ticketId && (
                    <span style={{ fontSize: '13px', color: '#166534', marginTop: '4px', display: 'block' }}>
                      (Database ID: #{resultData.ticketId})
                    </span>
                  )}
                </div>
              )}

              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
                Our technical service team will contact you at <strong>{mobile}</strong> within 24 business hours.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="button button-small" onClick={handleReset}>
                  Submit Another Ticket
                </button>
                <Link to="/support" className="button button-outline button-small">
                  Return to Support Hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="form-card-container" style={{ maxWidth: '760px', margin: '0 auto', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="service-request-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sr-name">Full Name <span className="required" style={{ color: '#e53935' }}>*</span></label>
                    <input
                      id="sr-name"
                      type="text"
                      required
                      placeholder="e.g. Robert Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sr-mobile">Mobile Number <span className="required" style={{ color: '#e53935' }}>*</span></label>
                    <input
                      id="sr-mobile"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sr-email">Email Address (Optional)</label>
                    <input
                      id="sr-email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sr-product">Product Model / Name</label>
                    <input
                      id="sr-product"
                      type="text"
                      placeholder="e.g. Honeywell IP Dome Camera 4MP"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sr-serial">Serial Number (If available)</label>
                    <input
                      id="sr-serial"
                      type="text"
                      placeholder="e.g. SN-8840291"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sr-order">Order Number (If available)</label>
                    <input
                      id="sr-order"
                      type="text"
                      placeholder="e.g. 10214"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="sr-issue-type">Type of Issue</label>
                  <select
                    id="sr-issue-type"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                  >
                    <option value="Hardware Defect">Hardware Defect / Faulty Unit</option>
                    <option value="Firmware Issue">Firmware / Software Bug</option>
                    <option value="Installation Help">Installation Assistance</option>
                    <option value="Warranty Claim">Warranty Claim Request</option>
                    <option value="General Technical Query">General Technical Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sr-description">Problem Description <span className="required" style={{ color: '#e53935' }}>*</span></label>
                  <textarea
                    id="sr-description"
                    rows={4}
                    required
                    placeholder="Describe the issue you are experiencing in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="button button-full" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, padding: '14px' }}>
                  {loading ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting Request...</>
                  ) : (
                    <><Wrench size={18} /> Submit Service Ticket</>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
