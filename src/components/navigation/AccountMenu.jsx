import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Shield, LogOut } from 'lucide-react';

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const customerName = localStorage.getItem('customerName') || 'My Account';
  const isLoggedIn = Boolean(localStorage.getItem('customerToken') || localStorage.getItem('customerEmail'));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="account-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className="icon-button account-trigger" 
        onClick={() => setOpen(!open)}
        aria-label="User Account Menu"
        title="Account"
      >
        <User size={20} />
      </button>

      {open && (
        <div className="account-dropdown-menu">
          <div className="account-dropdown-header">
            <span className="account-greeting">Hello, {isLoggedIn ? customerName : 'Guest'}</span>
            <span className="account-subtitle">{isLoggedIn ? 'Manage your account' : 'Welcome to Honeywell'}</span>
          </div>

          <div className="account-dropdown-links">
            <Link to="/account" onClick={() => setOpen(false)}>
              <User size={16} /> My Account &amp; Profile
            </Link>
            <Link to="/account/orders" onClick={() => setOpen(false)}>
              <Package size={16} /> My Orders
            </Link>
            <Link to="/order-tracking" onClick={() => setOpen(false)}>
              <MapPin size={16} /> Track Order
            </Link>
            <Link to="/warranty" onClick={() => setOpen(false)}>
              <Shield size={16} /> Warranty &amp; Service
            </Link>
          </div>

          <div className="account-dropdown-footer">
            {isLoggedIn ? (
              <button className="account-logout-btn" onClick={handleLogout}>
                <LogOut size={15} /> Log Out
              </button>
            ) : (
              <Link to="/account" className="account-login-link" onClick={() => setOpen(false)}>
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
