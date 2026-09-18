import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerLogin, customerRegister, customerLogout, getProfile } from '../services/customerApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // profile data from API
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // initial session check

  // Restore session on app boot
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const customerId = localStorage.getItem('customerId');
    const storedEmail = localStorage.getItem('customerEmail');
    const storedName = localStorage.getItem('customerName');

    if (token && storedEmail) {
      // Fetch fresh profile from API to validate session, passing storedEmail as fallback query param
      getProfile(customerId || undefined, storedEmail)
        .then((profile) => {
          const profileEmail = (profile?.email || profile?.emailAddress || '').toLowerCase();
          const targetEmail = storedEmail.toLowerCase();
          const isMatch = profileEmail && profileEmail === targetEmail;

          const email = storedEmail;
          const name = isMatch
            ? (profile?.name || profile?.fullName || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : '') || storedName || email.split('@')[0])
            : (storedName || email.split('@')[0]);

          const merged = {
            ...(isMatch ? profile : {}),
            email,
            name,
            customerId: isMatch ? (profile?.id || profile?.customerId || customerId || '') : (customerId || ''),
          };
          setUser(merged);
          setIsLoggedIn(true);
          syncToStorage(merged);
        })
        .catch(() => {
          // If network fetch fails, retain current stored user session
          const fallbackUser = {
            email: storedEmail,
            name: storedName || storedEmail.split('@')[0],
            customerId: customerId || '',
          };
          setUser(fallbackUser);
          setIsLoggedIn(true);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  function syncToStorage(profile) {
    if (!profile) return;
    const name = profile.name || profile.fullName ||
      (profile.firstName ? ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim() : '');
    if (name) localStorage.setItem('customerName', name);
    if (profile.email) localStorage.setItem('customerEmail', profile.email);
    if (profile.id || profile.customerId)
      localStorage.setItem('customerId', String(profile.id || profile.customerId));
  }

  function clearSession() {
    const keysToRemove = [
      'customerToken', 'customerId', 'customerName', 'customerEmail',
      'customerPhone', 'customerGender', 'customerCompany', 'customerAvatar',
      'shippingAddress', 'shippingCity', 'shippingState', 'shippingPincode', 'shippingCountry',
      'billingAddress', 'billingCity', 'billingState', 'billingPincode',
      'bankAccountHolder', 'bankName', 'bankAccountNumber', 'bankIfscCode', 'bankUpiId'
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setIsLoggedIn(false);
  }

  const login = useCallback(async (emailInput, password) => {
    const data = await customerLogin(emailInput, password);
    const token = data.token || data.Token || data.accessToken || data.AccessToken || '';
    if (!token) throw new Error('No token received from server.');

    const loggedInEmail = data.email || data.emailAddress || data.Email || emailInput;
    const loggedInName = data.name || data.fullName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : '') || loggedInEmail.split('@')[0];
    const profileId = data.customerId || data.id || data.Id || '';

    // Clear stale session values from previous user
    clearSession();

    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerEmail', loggedInEmail);
    localStorage.setItem('customerName', loggedInName);
    if (profileId) localStorage.setItem('customerId', String(profileId));

    let profile = null;
    try {
      profile = await getProfile(profileId || undefined, loggedInEmail);
    } catch (e) {
      console.warn('Profile fetch after login fallback:', e);
    }

    const profileEmail = (profile?.email || profile?.emailAddress || '').toLowerCase();
    const isMatch = profileEmail && profileEmail === loggedInEmail.toLowerCase();

    const finalEmail = loggedInEmail;
    const finalName = isMatch
      ? (profile?.name || profile?.fullName || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : '') || loggedInName)
      : loggedInName;

    const merged = {
      ...(isMatch ? profile : {}),
      email: finalEmail,
      name: finalName,
      customerId: isMatch ? (profile?.id || profile?.customerId || profileId || '') : (profileId || ''),
    };

    setUser(merged);
    setIsLoggedIn(true);
    syncToStorage(merged);
    return merged;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await customerRegister(payload);
    const registeredEmail = payload.email || payload.emailOrPhone || '';
    const registeredName = payload.fullName || payload.name || (registeredEmail ? registeredEmail.split('@')[0] : 'Valued Customer');

    const token = data.token || data.Token || data.accessToken || data.AccessToken || '';

    if (token) {
      clearSession();
      localStorage.setItem('customerToken', token);
      localStorage.setItem('customerEmail', registeredEmail);
      localStorage.setItem('customerName', registeredName);

      const profileId = data.customerId || data.id || data.Id || '';
      if (profileId) localStorage.setItem('customerId', String(profileId));

      const merged = {
        email: registeredEmail,
        name: registeredName,
        customerId: profileId,
      };

      setUser(merged);
      setIsLoggedIn(true);
      syncToStorage(merged);
      return merged;
    }

    // Auto-login with newly registered credentials if backend requires explicit login
    if (registeredEmail && payload.password) {
      return await login(registeredEmail, payload.password);
    }

    return data;
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await customerLogout();
    } catch (e) {
      console.warn('Backend logout call skipped/failed:', e.message);
    } finally {
      clearSession();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const customerId = localStorage.getItem('customerId');
    const email = localStorage.getItem('customerEmail');
    const profile = await getProfile(customerId || undefined, email || undefined);
    const merged = {
      ...profile,
      email: profile?.email || email || '',
      name: profile?.name || profile?.fullName || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : '') || localStorage.getItem('customerName') || '',
      customerId: profile?.id || profile?.customerId || customerId || '',
    };
    setUser(merged);
    syncToStorage(merged);
    return merged;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
