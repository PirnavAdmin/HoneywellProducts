import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { createTicket } from '../admin/api/tickets';
import heroImage from '../assets/images/capital-park2.jpg';

export default function ServiceRequest() {
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
  const [ticketId, setTicketId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      setError('Please provide your name and mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      customerName: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      productName: productName.trim() || 'Honeywell Product',
      serialNumber: serialNumber.trim(),
      orderNumber: orderNumber.trim(),
      issueType,
      subject: `Service Request: ${productName || 'Honeywell Unit'} - ${issueType}`,
      description: description.trim(),
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await createTicket(payload);
      setTicketId(res?.id || res?.ticketId || 'SR-' + Math.floor(100000 + Math.random() * 900000));
      setSubmitted(true);
    } catch (err) {
      console.error('Service request submission error:', err);
      setError('Failed to submit service request to backend. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <div className="empty-state">
              <CheckCircle size={56} className="text-success" />
              <h2>Service Request Submitted Successfully</h2>
              <p>Your ticket reference ID is <strong>#{ticketId}</strong>.</p>
              <p>Our technical service team will contact you at <strong>{mobile}</strong> within 24 business hours.</p>
              <div className="btn-group justify-center mt-3">
                <button className="button button-small" onClick={() => { setSubmitted(false); setName(''); setMobile(''); setDescription(''); }}>
                  Submit Another Ticket
                </button>
                <Link to="/support" className="button button-outline button-small">
                  Return to Support Hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="form-card-container">
              {error && (
                <div className="error-box mb-3">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="service-request-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sr-name">Full Name <span className="required">*</span></label>
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
                    <label htmlFor="sr-mobile">Mobile Number <span className="required">*</span></label>
                    <input
                      id="sr-mobile"
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
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
                  <label htmlFor="sr-description">Problem Description <span className="required">*</span></label>
                  <textarea
                    id="sr-description"
                    rows={4}
                    required
                    placeholder="Describe the issue you are experiencing in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="button button-full" disabled={loading}>
                  {loading ? 'Submitting Request...' : 'Submit Service Ticket'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
