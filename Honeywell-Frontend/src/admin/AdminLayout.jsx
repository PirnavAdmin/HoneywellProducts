import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import AdminTopBar from './AdminTopBar';
import AdminMenuBar from './AdminMenuBar';
import { Toast } from './components/Toast';
import { isPathAuthorized, getFirstAuthorizedRoute, clearUserSession } from '../utils/rbac';
import './AdminLayout.css';

const AdminLayout = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarExpanded(prev => !prev);
  };

  const [globalToast, setGlobalToast] = useState(null);

  useEffect(() => {
    document.title = 'HONEYWELL PRODUCTS | SMART TECHNOLOGY. STRONGER PROTECTION';
  }, [location.pathname]);

  const authType = (localStorage.getItem('authType') || (localStorage.getItem('adminRole') === 'admin' ? 'admin' : 'staff')).toLowerCase();
  let userRole = (localStorage.getItem('adminRole') || 'staff').toLowerCase();
  if (userRole === 'super admin' || userRole === 'superadmin') {
    userRole = 'admin';
  }

  // Load actual permissions from localStorage without static fallbacks
  let userPermissions = [];
  try {
    const raw = localStorage.getItem('adminPermissions');
    if (raw) {
      userPermissions = JSON.parse(raw);
    }
  } catch {
    userPermissions = [];
  }

  // Intercept data mutations for Manager role (Read-Only)
  useEffect(() => {
    if (userRole !== 'manager') return;

    const handleFormSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setGlobalToast({ message: "Read-Only Mode: Manager accounts are not allowed to submit form data.", type: "warning" });
    };

    const handleButtonClick = (e) => {
      const btn = e.target.closest('button, input[type="submit"], a.catalog-btn--primary');
      if (!btn) return;
      
      const text = (btn.textContent || btn.value || '').toLowerCase().trim();
      const isDelete = text.includes('delete') || text.includes('remove') || text.includes('trash');
      const isSave = text.includes('save') || text.includes('create') || text.includes('add') || text.includes('update') || text.includes('submit');
      
      if (isDelete || isSave) {
        e.preventDefault();
        e.stopPropagation();
        setGlobalToast({ message: "Read-Only Mode: Manager accounts are not allowed to modify data.", type: "warning" });
      }
    };

    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('click', handleButtonClick, true);

    return () => {
      document.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, [userRole]);

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  // Verify route authorization using strict RBAC engine
  const allowed = isPathAuthorized(location.pathname, userPermissions, userRole, authType);
  const firstRoute = getFirstAuthorizedRoute(userPermissions, userRole, authType);

  return (
    <div className={`admin-layout ${sidebarExpanded ? 'sidebar-open' : 'sidebar-closed'}`}>
      {globalToast && (
        <Toast 
          message={globalToast.message} 
          type={globalToast.type} 
          onClose={() => setGlobalToast(null)} 
        />
      )}

      <aside className="admin-sidebar-area">
        <AdminMenuBar expanded={sidebarExpanded} onToggleSidebar={toggleSidebar} />
      </aside>
      <header className="admin-topbar-area">
        <AdminTopBar onToggleSidebar={toggleSidebar} sidebarExpanded={sidebarExpanded} />
      </header>
      <main className="admin-main-content">
        {/* Manager Read-Only Warning Banner */}
        {userRole === 'manager' && (
          <div className="manager-read-only-banner">
            <AlertTriangle size={16} />
            <span><strong>Read-Only Mode:</strong> Operations Manager accounts are restricted from saving, modifying, or deleting records.</span>
          </div>
        )}

        {allowed ? (
          <Outlet />
        ) : (
          <div className="access-denied-view">
            <ShieldAlert size={64} className="text-red-500" />
            <h2>Access Denied</h2>
            <p>
              Your security account (<strong>{userRole.toUpperCase()}</strong>) does not have permission to access <code>{location.pathname}</code>.
            </p>
            {firstRoute ? (
              <button 
                onClick={() => navigate(firstRoute)}
                style={{
                  marginTop: '12px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#1268a5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go to Permitted Module
              </button>
            ) : (
              <button 
                onClick={() => {
                  clearUserSession();
                  navigate('/admin/login');
                }}
                style={{
                  marginTop: '12px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign In with Different Account
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
