import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getApiDomain } from '../../utils/apiConfig';
import { ArrowLeft, User, Phone, Mail, MapPin, Tractor, CreditCard, Activity, Edit, Plus, X, Search, ChevronDown } from 'lucide-react';

const Customer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Switch customer state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: '',
    address: '',
    district: '',
    state: '',
    soilType: '',
    cropType: '',
    farmSizeAcres: '',
    irrigationSource: ''
  });

  // Advisory Form State
  const [advisoryText, setAdvisoryText] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Fetch all customers for the search/select capability
  useEffect(() => {
    fetch(`${getApiDomain()}/api/Customers`, {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
      })
      .catch(err => {
        console.error('Error fetching customers list:', err);
      });
  }, []);

  // Fetch specific customer data when ID changes
  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`${getApiDomain()}/api/Customers/${id}`, {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customer profile');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          email: (data.email || '').toLowerCase(),
          status: data.status || 'Active',
          address: data.address || '',
          district: data.district || '',
          state: data.state || '',
          soilType: data.agrarianProfile?.soilType || 'Red Sandy',
          cropType: data.agrarianProfile?.cropType || '',
          farmSizeAcres: data.agrarianProfile?.farmSizeAcres || '',
          irrigationSource: data.agrarianProfile?.irrigationSource || 'Borewell'
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    const nameVal = (editForm.name || '').trim();
    if (!nameVal || nameVal.length < 2) {
      alert('Please enter a valid Customer Name.');
      return;
    }

    const phoneVal = (editForm.phone || '').trim();
    if (!phoneVal || phoneVal.length < 6) {
      alert('Please enter a valid phone number.');
      return;
    }

    const updatedPayload = {
      ...profile,
      name: editForm.name,
      phone: editForm.phone,
      email: (editForm.email || '').trim().toLowerCase(),
      status: editForm.status || 'Active',
      address: editForm.address || '',
      district: editForm.district || '',
      state: editForm.state || '',
      agrarianProfile: {
        ...(profile?.agrarianProfile || {}),
        soilType: editForm.soilType || 'Red Sandy',
        cropType: editForm.cropType || '',
        farmSizeAcres: parseFloat(editForm.farmSizeAcres) || 0,
        irrigationSource: editForm.irrigationSource || 'Borewell'
      }
    };

    try {
      const res = await fetch(`${getApiDomain()}/api/Customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(updatedPayload),
      });

      setProfile(updatedPayload);
      setShowEditModal(false);

      if (res.ok) {
        const refreshed = await fetch(`${getApiDomain()}/api/Customers/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
        });
        if (refreshed.ok) {
          const data = await refreshed.json();
          setProfile(data);
          setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
        }
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setProfile(updatedPayload);
      setShowEditModal(false);
    }
  };

  const postAdvisory = async (e) => {
    e.preventDefault();
    if (!advisoryText.trim() || !recommendation.trim()) {
      alert('Please fill out both advisory notes and recommendation.');
      return;
    }
    try {
      const res = await fetch(`${getApiDomain()}/api/Customers/${id}/advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          advisoryText,
          recommendation,
          staffId: 1
        }),
      });
      if (!res.ok) throw new Error('Advisory post failed');
      const data = await res.json();
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        advisories: [data, ...(prev.advisories || [])]
      }));
      setAdvisoryText('');
      setRecommendation('');
      alert('Advisory posted successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter customers for search
  const filteredSearchList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 10); // Show first 10 by default
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      String(c.id).includes(q)
    );
  }, [customers, searchQuery]);

  const selectCustomer = (custId) => {
    setSearchParams({ id: custId });
    setShowSwitchDropdown(false);
    setSearchQuery('');
  };

  const getTagColor = (type) => {
    switch (type || 'Farmer') {
      case 'Farmer':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Retailer':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
  };

  // Render direct search select interface if no id is specified
  if (!id) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '20px', backgroundColor: '#f8fafc' }}>
        <div style={{
          maxWidth: '640px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          padding: '40px 36px 28px',
          boxSizing: 'border-box'
        }}>
          {/* Avatar Header Icon */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#e6f4ea',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px'
            }}>
              <User size={28} style={{ color: '#059669' }} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#064e3b', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Select Customer Profile
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Search by customer name, phone number, or ID to view their farm record.
            </p>
          </div>

          {/* Search Box Input */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Scrollable Customer Items List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {filteredSearchList.map(c => (
              <div
                key={c.id}
                onClick={() => selectCustomer(c.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>#{c.id}</span>
                    <span>•</span>
                    <span>{c.phone}</span>
                  </div>
                </div>
                <span style={{
                  backgroundColor: (c.type || 'Farmer') === 'Farmer' ? '#e6f4ea' : ((c.type || 'Farmer') === 'Retailer' ? '#dbeafe' : '#f3e8ff'),
                  color: (c.type || 'Farmer') === 'Farmer' ? '#15803d' : ((c.type || 'Farmer') === 'Retailer' ? '#1e40af' : '#6b21a8'),
                  border: `1px solid ${(c.type || 'Farmer') === 'Farmer' ? '#bbf7d0' : ((c.type || 'Farmer') === 'Retailer' ? '#bfdbfe' : '#e9d5ff')}`,
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 14px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {c.type || 'Farmer'}
                </span>
              </div>
            ))}
            {filteredSearchList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '14px' }}>
                No customers match your search query.
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', textAlign: 'center' }}>
            <button 
              type="button"
              onClick={() => navigate('/admin/customers/list')}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} /> Back to Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Loading customer profile...</div>;
  if (error) return (
    <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-100 shadow-xl text-center">
      <h3 className="text-lg font-bold text-rose-600 mb-2">Error Loading Profile</h3>
      <p className="text-slate-500 text-xs mb-4">{error}</p>
      <div className="flex gap-2 justify-center">
        <button 
          onClick={() => { setError(null); setLoading(true); setSearchParams({ id }); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry
        </button>
        <button 
          onClick={() => setSearchParams({})} 
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Select Different Customer
        </button>
      </div>
    </div>
  );
  if (!profile) return <div className="text-center py-12 text-slate-500">Customer profile not found.</div>;

  // Derivations
  const totalSpent = profile.orders?.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0) || 0;
  const customerType = profile.type || 'Farmer';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '18px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/admin/customers/list')}
            style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Customer Profile &amp; Farm Records</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>Overview of grower records, field details, crop advisory, and order transactions.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Switch Customer Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              Switch Customer <ChevronDown size={14} />
            </button>
            
            {showSwitchDropdown && (
              <div style={{ position: 'absolute', right: 0, marginTop: '8px', width: '280px', backgroundColor: '#ffffff', borderRadius: '14px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', padding: '12px', zIndex: 50 }}>
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', outline: 'none' }}
                  autoFocus
                />
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredSearchList.map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c.id)}
                      style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', backgroundColor: c.id === profile.id ? '#e6f4ea' : 'transparent', color: c.id === profile.id ? '#15803d' : '#334155', fontWeight: c.id === profile.id ? 700 : 500 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.name}</span>
                        <span style={{ color: '#94a3b8' }}>#{c.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
          >
            <Edit size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left column – summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '999px', backgroundColor: '#1e7e34', color: '#ffffff', fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', textTransform: 'uppercase' }}>
              {profile.name ? profile.name.slice(0, 2) : 'CU'}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{profile.name}</h3>
            <div style={{ marginTop: '8px', marginBottom: '20px' }}>
              <span style={{ backgroundColor: '#e6f4ea', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block' }}>
                {customerType}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span>{profile.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span>{profile.email || 'No email provided'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={15} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {(() => {
                    const parts = [profile.address, profile.district, profile.state].filter(p => p && p.trim() && p !== 'string' && p !== 'N/A');
                    return parts.length > 0 ? parts.join(', ') : '—';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Farm details */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Tractor size={18} style={{ color: '#059669' }} />
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#064e3b', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>Agrarian Details</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Total Land Area:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {profile.agrarianProfile?.farmSizeAcres ? `${profile.agrarianProfile.farmSizeAcres} Acres` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Soil Condition:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {profile.agrarianProfile?.soilType && profile.agrarianProfile.soilType !== 'N/A' ? profile.agrarianProfile.soilType : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Irrigation Source:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {profile.agrarianProfile?.irrigationSource && profile.agrarianProfile.irrigationSource !== 'N/A' ? profile.agrarianProfile.irrigationSource : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column – finance, orders & advisories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Finance Snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e6f4ea', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Total Spent</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>₹{totalSpent.toLocaleString('en-IN')}</h4>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Agro Coins Balance</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{profile.coinsBalance || 0} Coins</h4>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>RECENT ORDER HISTORY</h4>
            
            {profile.orders && profile.orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile.orders.map((ord) => {
                  const orderItemsText = Array.isArray(ord.items) && ord.items.length > 0 
                    ? ord.items.map(item => item.productName || item.name).join(', ')
                    : 'Agricultural Equipment / Supplies';
                  return (
                    <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{ord.orderNumber || `ORD-#${ord.id}`}</span>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>• {ord.orderDate ? ord.orderDate.slice(0, 10) : 'Recent'}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{orderItemsText}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '2px' }}>₹{(ord.finalAmount || ord.totalAmount || 0).toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: ord.status === 'Delivered' ? '#e6f4ea' : '#dbeafe', color: ord.status === 'Delivered' ? '#15803d' : '#1e40af' }}>
                          {ord.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '36px 0' }}>
                No orders registered for this customer yet.
              </div>
            )}
          </div>

          {/* Crop Advisory Logs & Notes */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '20px' }}>
              <Activity size={18} style={{ color: '#059669' }} />
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#064e3b', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>CROP ADVISORY LOGS &amp; NOTES</h4>
            </div>

            {/* Post New Advisory Box */}
            <form onSubmit={postAdvisory} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>POST NEW EXPERT ADVISORY</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Observation / Issue Description (e.g. Yellowing leaves)"
                  value={advisoryText}
                  onChange={e => setAdvisoryText(e.target.value)}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none' }}
                />
                <textarea
                  placeholder="Expert Recommendation / Solution"
                  value={recommendation}
                  onChange={e => setRecommendation(e.target.value)}
                  rows="3"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{ backgroundColor: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: 700, padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(5,150,105,0.2)' }}
                >
                  <Plus size={16} /> Submit Advisory
                </button>
              </div>
            </form>

            {/* Advisory Logs List */}
            {profile.advisories && profile.advisories.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profile.advisories.map((log) => (
                  <div key={log.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-31px', top: '4px', width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '999px', border: '3px solid #ffffff' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      {log.dateCreated ? log.dateCreated.slice(0, 16).replace('T', ' ') : 'Recent'}
                    </span>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Observation: <span style={{ fontWeight: 500, color: '#475569' }}>{log.advisoryText}</span></span>
                      <span style={{ fontWeight: 800, color: '#065f46', display: 'block' }}>Solution: <span style={{ fontWeight: 500, color: '#047857' }}>{log.recommendation}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '36px 0' }}>
                No advisory logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      {showEditModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 999999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)', maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 'auto' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#064e3b', margin: 0, letterSpacing: '-0.01em' }}>Edit Customer Profile</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* BASIC INFORMATION */}
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>BASIC INFORMATION</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* ADDRESS DETAILS */}
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 0 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>ADDRESS DETAILS</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Street Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      placeholder="e.g. 12 Main St, Pune, Maharashtra"
                      onChange={e => {
                        const addr = e.target.value;
                        setEditForm(prev => {
                          const updated = { ...prev, address: addr };
                          if (addr) {
                            const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
                            if (parts.length >= 2) {
                              const lastPart = parts[parts.length - 1];
                              const secondLastPart = parts[parts.length - 2];
                              const statesList = [
                                'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
                                'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
                                'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
                                'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
                                'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
                              ];
                              const matchedState = statesList.find(s => s.toLowerCase() === lastPart.toLowerCase());
                              if (matchedState) {
                                updated.state = matchedState;
                              }
                              if (secondLastPart && parts.length > 2) {
                                updated.district = secondLastPart;
                              } else if (secondLastPart && parts.length === 2 && !matchedState) {
                                updated.district = secondLastPart;
                              }
                            }
                          }
                          return updated;
                        });
                      }}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        District <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.district}
                        onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                        style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        State <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                        style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                </div>

                {/* AGRARIAN DETAILS */}
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 0 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>AGRARIAN DETAILS</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Soil Type
                    </label>
                    <select
                      value={editForm.soilType}
                      onChange={e => setEditForm({ ...editForm, soilType: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="Red Sandy">Red Sandy</option>
                      <option value="Black Clayey">Black Clayey</option>
                      <option value="Alluvial">Alluvial</option>
                      <option value="Loamy">Loamy</option>
                      <option value="Laterite">Laterite</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Farm Size (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.farmSizeAcres}
                      onChange={e => setEditForm({ ...editForm, farmSizeAcres: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Irrigation Source
                    </label>
                    <select
                      value={editForm.irrigationSource}
                      onChange={e => setEditForm({ ...editForm, irrigationSource: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="Borewell">Borewell</option>
                      <option value="Drip">Drip Irrigation</option>
                      <option value="Canal">Canal Water</option>
                      <option value="Rainfed">Rainfed</option>
                      <option value="Sprinkler">Sprinklers</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '24px', backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#059669', color: '#ffffff', borderRadius: '10px', padding: '10px 26px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.25)' }}
                >
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Customer;

