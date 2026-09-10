import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import SignInModal from '../auth/SignInModal';

export default function AccountMenu() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const navigate = useNavigate();

  const customerName = localStorage.getItem('customerName') || 'Valued Customer';
  const isLoggedIn = Boolean(localStorage.getItem('customerToken') || localStorage.getItem('customerEmail'));

  // Click handler for Header User Icon
  const handleUserIconClick = () => {
    if (isLoggedIn) {
      // Authenticated: Navigate directly to /account (My Profile) page
      navigate('/account');
    } else {
      // Unauthenticated: Open Sign-In modal popup directly WITHOUT changing the current URL
      setIsSignInOpen(true);
    }
  };

  return (
    <>
      <div className="account-dropdown-wrapper">
        <button 
          className={`account-trigger ${isSignInOpen ? 'active' : ''}`}
          onClick={handleUserIconClick}
          aria-label="User Account"
          title={isLoggedIn ? `${customerName} - Go to My Profile` : 'Sign In / Account'}
        >
          <User size={20} />
          {isLoggedIn && <span className="account-trigger-badge" title="Logged in" />}
        </button>
      </div>

      {/* Header Sign In Modal Popup for Guests / Unauthenticated Users */}
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
      />
    </>
  );
}

