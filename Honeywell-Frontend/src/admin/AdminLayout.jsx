import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import AdminTopBar from './AdminTopBar';
import AdminMenuBar from './AdminMenuBar';
import { Toast } from './components/Toast';
import { 
  isPathAuthorized, 
  getFirstAuthorizedRoute, 
  clearUserSession, 
  getStoredAdminItem, 
  getAdminToken, 
  isTokenValid,
  getEffectiveAuthType,
  getEffectiveAdminRole,
  isUserSessionValid
} from '../utils/rbac';
import './AdminLayout.css';

const AdminLayout = () => {
  const isValidSession = isUserSessionValid();

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

  // Dynamic 30-minute Inactivity Auto-Lock
  useEffect(() => {
    if (!isValidSession) return;

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const performInactivityLogout = () => {
      clearUserSession();
      setGlobalToast({
        message: "Your session has expired after 30 minutes of inactivity. Please log in again.",
        type: "warning"
      });
      setTimeout(() => {
        navigate('/admin/login', { 
          replace: true, 
          state: { reason: 'inactivity', message: 'Session expired due to inactivity. Please sign in again.' } 
        });
      }, 1000);
    };

    let timer = setTimeout(performInactivityLogout, INACTIVITY_LIMIT_MS);

    let lastRecord = Date.now();
    sessionStorage.setItem('adminLastActivity', String(lastRecord));
    localStorage.setItem('adminLastActivity', String(lastRecord));

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastRecord > 1000) {
        lastRecord = now;
        sessionStorage.setItem('adminLastActivity', String(now));
        localStorage.setItem('adminLastActivity', String(now));
        if (timer) clearTimeout(timer);
        timer = setTimeout(performInactivityLogout, INACTIVITY_LIMIT_MS);
      }
    };

    // Check on visibility/focus in case computer was suspended or tab was backgrounded
    const checkOnFocus = () => {
      const storedLast = parseInt(sessionStorage.getItem('adminLastActivity') || localStorage.getItem('adminLastActivity') || '0', 10);
      if (storedLast && Date.now() - storedLast >= INACTIVITY_LIMIT_MS) {
        performInactivityLogout();
      } else {
        resetTimer();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });
    window.addEventListener('visibilitychange', checkOnFocus);
    window.addEventListener('focus', checkOnFocus);

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
      window.removeEventListener('visibilitychange', checkOnFocus);
      window.removeEventListener('focus', checkOnFocus);
    };
  }, [isValidSession, navigate]);

  const authType = getEffectiveAuthType();
  const userRole = getEffectiveAdminRole();

  // Load actual permissions from dynamic session storage without static fallbacks
  let userPermissions = [];
  try {
    const raw = getStoredAdminItem('adminPermissions');
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

  if (!isValidSession) {
    clearUserSession();
    return <Navigate to="/admin/login" replace />;
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
