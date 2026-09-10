import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, ShieldAlert, LogOut, ChevronRight } from 'lucide-react';
import '../../styles/CustomerAccount.css';

export default function CustomerAccountLayout({ 
  title = 'My Account', 
  subtitle = 'Manage your account profile, orders, tracking, and warranty service requests.',
  children 
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const customerName = localStorage.getItem('customerName') || 'Valued Customer';
  const customerEmail = localStorage.getItem('customerEmail') || '';
  const customerAvatar = localStorage.getItem('customerAvatar') || '';

  // Get user initials for avatar badge
  const getInitials = (name) => {
    if (!name || name === 'Valued Customer') return 'CU';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userInitials = getInitials(customerName);

  const handleLogout = () => {
    const keysToRemove = [
      'customerToken', 'customerEmail', 'customerName', 'customerPhone',
      'customerGender', 'customerCompany', 'customerAvatar',
      'shippingAddress', 'shippingCity', 'shippingState', 'shippingPincode', 'shippingCountry',
      'billingAddress', 'billingCity', 'billingState', 'billingPincode',
      'bankAccountHolder', 'bankName', 'bankAccountNumber', 'bankIfscCode', 'bankUpiId'
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    navigate('/');
    window.location.reload();
  };

  const navItems = [
    { path: '/account', label: 'My Profile', icon: User },
    { path: '/account/orders', label: 'My Orders', icon: Package },
    { path: '/order-tracking', label: 'Track Order', icon: MapPin },
    { path: '/warranty', label: 'Warranty & Returns', icon: ShieldAlert },
  ];

  // Helper to determine if nav item is currently active
  const isNavActive = (path) => {
    if (path === '/account') {
      return location.pathname === '/account';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <section className="customer-portal-section">
      <div className="container">
        {/* Top Header & Breadcrumb */}
        <div className="portal-header-area">
          <div className="portal-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <Link to="/account">My Account</Link>
            {location.pathname !== '/account' && (
              <>
                <span className="separator">/</span>
                <span className="current">{title}</span>
              </>
            )}
          </div>
          <div className="portal-title-row">
            <div>
              <h1 className="portal-main-title">{title}</h1>
              <p className="portal-main-subtitle">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Tabs Navigation */}
        <div className="portal-mobile-tabs" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path);
            return (
              <button
                key={item.path}
                className={`portal-mobile-tab-btn ${active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                role="tab"
                aria-selected={active}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar + Main Content Grid */}
        <div className="portal-grid-container">
          {/* Left Desktop Sidebar */}
          <aside className="portal-sidebar-card">
            <div className="portal-sidebar-user-header">
              <div className="portal-user-avatar">
                {customerAvatar ? (
                  <img src={customerAvatar} alt={customerName} className="portal-user-avatar-img" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="portal-user-meta">
                <div className="portal-user-name">{customerName}</div>
                <div className="portal-user-email">{customerEmail || 'Customer Account'}</div>
                <span className="portal-user-badge">Customer Account</span>
              </div>
            </div>

            <nav className="portal-sidebar-nav" aria-label="Customer account menu">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`portal-sidebar-link ${active ? 'active' : ''}`}
                  >
                    <div className="portal-sidebar-link-left">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={15} className="chevron-icon" />
                  </Link>
                );
              })}

              <div className="portal-sidebar-divider" />

              <button className="portal-sidebar-logout-btn" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main Page Content Slot */}
          <main className="portal-content-card">
            {children}
          </main>
        </div>
      </div>
    </section>
  );
}
