import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getFirstAuthorizedRoute, 
  getStoredAdminItem, 
  clearUserSession,
  getEffectiveAuthType,
  getEffectiveAdminRole,
  isUserSessionValid
} from '../utils/rbac';

const AdminIndexRedirect = () => {
  const isValidSession = isUserSessionValid();

  if (!isValidSession) {
    clearUserSession();
    return <Navigate to="/admin/login" replace />;
  }

  const [authType, setAuthType] = useState(() => getEffectiveAuthType());
  const [userRole, setUserRole] = useState(() => getEffectiveAdminRole());
  const [userPermissions, setUserPermissions] = useState(() => {
    try {
      const raw = getStoredAdminItem('adminPermissions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (Array.isArray(e?.detail?.permissions)) {
        setUserPermissions(e.detail.permissions);
      } else {
        const raw = getStoredAdminItem('adminPermissions');
        setUserPermissions(raw ? JSON.parse(raw) : []);
      }
      setAuthType(getEffectiveAuthType());
      setUserRole(getEffectiveAdminRole());
    };

    window.addEventListener('admin_permissions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('admin_permissions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const targetRoute = getFirstAuthorizedRoute(userPermissions, userRole, authType);
  if (targetRoute) {
    return <Navigate to={targetRoute} replace />;
  }

  // If no permitted module exists, render inside AdminLayout to trigger Access Denied view
  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminIndexRedirect;
