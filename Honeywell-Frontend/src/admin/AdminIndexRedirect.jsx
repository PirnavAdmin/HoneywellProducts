import React from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getFirstAuthorizedRoute, 
  getStoredAdminItem, 
  getAdminToken, 
  isTokenValid, 
  clearUserSession 
} from '../utils/rbac';

const AdminIndexRedirect = () => {
  const token = getAdminToken();
  const isAdmin = getStoredAdminItem('isAdmin') === 'true';
  const isValidSession = Boolean(isAdmin && token && isTokenValid(token));

  if (!isValidSession) {
    clearUserSession();
    return <Navigate to="/admin/login" replace />;
  }

  const authType = (getStoredAdminItem('authType') || (getStoredAdminItem('adminRole') === 'admin' ? 'admin' : 'staff')).toLowerCase();
  let userRole = (getStoredAdminItem('adminRole') || 'staff').toLowerCase();
  if (userRole === 'super admin' || userRole === 'superadmin') {
    userRole = 'admin';
  }

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
