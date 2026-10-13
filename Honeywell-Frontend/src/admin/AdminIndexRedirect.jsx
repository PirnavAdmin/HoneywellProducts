import React from 'react';
import { Navigate } from 'react-router-dom';
import { getFirstAuthorizedRoute } from '../utils/rbac';

const AdminIndexRedirect = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const authType = (localStorage.getItem('authType') || (localStorage.getItem('adminRole') === 'admin' ? 'admin' : 'staff')).toLowerCase();
  let userRole = (localStorage.getItem('adminRole') || 'staff').toLowerCase();
  if (userRole === 'super admin' || userRole === 'superadmin') {
    userRole = 'admin';
  }

  let userPermissions = [];
  try {
    const raw = localStorage.getItem('adminPermissions');
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
