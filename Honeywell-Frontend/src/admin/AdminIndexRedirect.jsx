import React from 'react';
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

  const authType = getEffectiveAuthType();
  const userRole = getEffectiveAdminRole();

  let userPermissions = [];
  try {
    const raw = getStoredAdminItem('adminPermissions');
    if (raw) {
      userPermissions = JSON.parse(raw);
    }
  } catch {
    userPermissions = [];
  }

  const targetRoute = getFirstAuthorizedRoute(userPermissions, userRole, authType);
  if (targetRoute) {
    return <Navigate to={targetRoute} replace />;
  }

  // If no permitted module exists, render inside AdminLayout to trigger Access Denied view
  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminIndexRedirect;
