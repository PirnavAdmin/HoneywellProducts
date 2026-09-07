import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, ShieldAlert, LogOut, Mail, Phone, Save } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import heroImage from '../assets/images/capital-park2.jpg';

export default function CustomerAccount() {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(localStorage.getItem('customerName') || 'Valued Customer');
  const [customerEmail, setCustomerEmail] = useState(localStorage.getItem('customerEmail') || '');
  const [customerPhone, setCustomerPhone] = useState(localStorage.getItem('customerPhone') || '');
  const [isEditing, setIsEditing] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem('customerToken') || localStorage.getItem('customerEmail'));

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('customerName', customerName);
    localStorage.setItem('customerEmail', customerEmail);
    localStorage.setItem('customerPhone', customerPhone);
    setIsEditing(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!customerEmail) return;
    localStorage.setItem('customerToken', 'demo-customer-token');
    localStorage.setItem('customerEmail', customerEmail);
    localStorage.setItem('customerName', customerName || 'Valued Customer');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerPhone');
    navigate('/');
  };

  return (
    <>
      <PageHero
        eyebrow="CUSTOMER PORTAL"
        title="My Account"
        description="Manage your account profile, orders, tracking, and warranty service requests."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {!isLoggedIn ? (
            <div className="auth-box max-w-md mx-auto">
              <div className="auth-header text-center mb-4">
                <User size={36} className="auth-icon text-primary mx-auto mb-2" />
                <h2>Customer Sign In</h2>
                <p>Access your Honeywell customer orders, warranty registrations, and tracking.</p>
              </div>
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="login-name">Your Full Name</label>
                  <input
                    id="login-name"
                    type="text"
                    required
                    placeholder="e.g. John Smith"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="button button-full">
                  Sign In to Account
                </button>
              </form>
            </div>
          ) : (
            <div className="account-dashboard-grid">
              <div className="account-quick-nav">
                <Link to="/account/orders" className="acc-nav-card">
                  <Package size={28} className="acc-card-icon" />
                  <div>
                    <h3>My Orders</h3>
                    <p>View past order history &amp; invoices</p>
                  </div>
                </Link>
                <Link to="/order-tracking" className="acc-nav-card">
                  <MapPin size={28} className="acc-card-icon" />
                  <div>
                    <h3>Track Order</h3>
                    <p>Track live delivery status</p>
                  </div>
                </Link>
                <Link to="/warranty" className="acc-nav-card">
                  <ShieldAlert size={28} className="acc-card-icon" />
                  <div>
                    <h3>Warranty &amp; Returns</h3>
                    <p>Check coverage &amp; request RMA</p>
                  </div>
                </Link>
              </div>

              <div className="profile-details-card">
                <div className="profile-card-header">
                  <h3><User size={20} /> Personal Profile</h3>
                  <button className="button-text text-small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="profile-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="button button-small">
                      <Save size={14} /> Save Profile
                    </button>
                  </form>
                ) : (
                  <div className="profile-info-display">
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{customerName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label"><Mail size={14} /> Email:</span>
                      <span className="info-value">{customerEmail || 'Not configured'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label"><Phone size={14} /> Phone:</span>
                      <span className="info-value">{customerPhone || 'Not provided'}</span>
                    </div>
                    <div className="profile-actions-row mt-4">
                      <button className="button button-outline button-small" onClick={handleLogout}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
