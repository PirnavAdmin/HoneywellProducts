import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Eye, Plus, X } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { OutlookDeleteButton, AnimatedViewButton, Pagination } from '../components/ActionButtons';

const CustomersList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add customer modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'Active',
    address: '',
    district: '',
    state: '',
    type: 'Farmer', // Default client/farmer type
    soilType: 'Red Sandy',
    cropType: 'Cotton',
    farmSizeAcres: '5',
    irrigationSource: 'Borewell'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${getApiDomain()}/api/Customers`, {
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`${getApiDomain()}/api/Customers/${id}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!res.ok) throw new Error('Delete failed');
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Customer Name Validation
    const nameVal = (newCustomer.name || '').trim();
    const lettersOnlyName = nameVal.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (
      !nameVal ||
      nameVal.length < 3 ||
      nameVal.length > 50 ||
      !/^[A-Za-z\s.'\-]{3,50}$/.test(nameVal) ||
      new Set(lettersOnlyName).size < 2 ||
      !/[aeiouy]/.test(lettersOnlyName) ||
      /(.)\1{2,}/i.test(nameVal) ||
      /[bcdfghjklmnpqrstvwxz]{5,}/i.test(lettersOnlyName)
    ) {
      alert('Please enter a valid Customer Name (3-50 letters). Names like "bdhfiebfjcerfyrhbv" or "Nnnnnn" or single repeating letters are invalid.');
      return;
    }

    // 2. Phone Number Validation & Duplicate Check
    const phoneVal = (newCustomer.phone || '').trim().replace(/[\s\-\+]/g, '').replace(/^91/, '');
    const dummyPhones = [
      '1234567890', '0123456789', '9876543210', '1234567891', '6789012345',
      '9876543211', '9999999999', '8888888888', '7777777777', '6666666666',
      '5454545454', '9898989898', '9123456789', '6543210987', '0000000000'
    ];
    if (
      !phoneVal ||
      !/^[6-9]\d{9}$/.test(phoneVal) ||
      new Set(phoneVal).size < 3 ||
      /(\d)\1{4,}/.test(phoneVal) ||
      /(\d{2})\1{3,}/.test(phoneVal) ||
      dummyPhones.includes(phoneVal)
    ) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543201). Non-repetitive digits required. Dummy patterns like 9999999999 or 5454545454 are invalid.');
      return;
    }

    // Duplicate Check
    const existing = customers.find(c => (c.phone || '').trim() === phoneVal);
    if (existing) {
      alert(`A customer with phone number ${phoneVal} already exists in the directory (#${existing.id} - ${existing.name}). Duplicate customer entries are not allowed.`);
      return;
    }

    // 3. Street Address Validation
    const addressVal = (newCustomer.address || '').trim();
    const lettersOnlyAddress = addressVal.replace(/[^a-z]/gi, '');
    const hasAddressSpaceOrSymbol = /[\s,\.\/\-]/.test(addressVal);
    if (addressVal && (addressVal.length < 5 || !/[a-zA-Z]/.test(addressVal) || new Set(addressVal.toLowerCase()).size < 3 || /(.)\1{3,}/.test(addressVal) || (addressVal.length > 8 && !hasAddressSpaceOrSymbol) || /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(lettersOnlyAddress))) {
      alert('Please enter a valid street address (minimum 5 characters, e.g. "H.No 12, Main Road"). Random gibberish or long codes without spaces are invalid.');
      return;
    }

    // 4. District Validation
    const districtVal = (newCustomer.district || '').trim();
    if (!districtVal) {
      alert('District is a required field.');
      return;
    }
    if (districtVal.length < 2 || !/^[A-Za-z\s.'\-]{2,50}$/.test(districtVal) || new Set(districtVal.toLowerCase().replace(/[^a-z]/g, '')).size < 2) {
      alert('Please enter a valid District name (letters and spaces only).');
      return;
    }

    // 5. State Validation
    const stateVal = (newCustomer.state || '').trim();
    if (!stateVal) {
      alert('State is a required field.');
      return;
    }
    if (stateVal.length < 2 || !/^[A-Za-z\s.'\-]{2,50}$/.test(stateVal) || new Set(stateVal.toLowerCase().replace(/[^a-z]/g, '')).size < 2) {
      alert('Please enter a valid State name (letters and spaces only).');
      return;
    }

    try {
      // Create request payload with agrarian profile
      const payload = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: (newCustomer.email || '').trim().toLowerCase(),
        status: newCustomer.status,
        address: newCustomer.address,
        district: newCustomer.district,
        state: newCustomer.state,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newCustomer.name)}&background=2e7d32&color=fff`,
        agrarianProfile: {
          soilType: newCustomer.soilType,
          cropType: newCustomer.cropType,
          farmSizeAcres: parseFloat(newCustomer.farmSizeAcres) || 0,
          irrigationSource: newCustomer.irrigationSource
        }
      };

      const res = await fetch(`${getApiDomain()}/api/Customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create customer');
      const data = await res.json();
      setCustomers(prev => [data, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        status: 'Active',
        address: '',
        district: '',
        state: '',
        type: 'Farmer',
        soilType: 'Red Sandy',
        cropType: 'Cotton',
        farmSizeAcres: '5',
        irrigationSource: 'Borewell'
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const nameVal = c.name ? c.name.toLowerCase() : '';
      const idVal = c.id ? String(c.id).toLowerCase() : '';
      const phoneVal = c.phone ? String(c.phone).toLowerCase() : '';
      const matchesSearch =
        nameVal.includes(searchTerm.toLowerCase()) ||
        idVal.includes(searchTerm.toLowerCase()) ||
        phoneVal.includes(searchTerm.toLowerCase());
      
      const customerType = c.type || 'Farmer';
      const matchesType = typeFilter === 'All' || customerType === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, typeFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  if (loading) return <div className="text-center py-8">Loading customers...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Card matching media_1788166168026.png */}
      <section style={{
        backgroundColor: '#ffffff',
        padding: '24px 28px',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Customers Directory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage registered growers, retailers, and agricultural bulk buyers.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#0057B8',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0, 87, 184, 0.25)',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} /> Add Customer
        </button>
      </section>

      {/* Search Bar & Filter Toolbar */}
      <section style={{
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ flex: '1', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by customer name, id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              fontSize: '13px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="All">All Customer Types</option>
          <option value="Farmer">Farmers</option>
          <option value="Retailer">Retailers</option>
          <option value="Wholesaler">Wholesalers</option>
        </select>
      </section>

      {/* Customer Directory Table Card */}
      <section style={{
        backgroundColor: '#ffffff',
        padding: '0',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Customer Name</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Phone Number</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Address</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Orders</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total Spent</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((cust) => {
                const formatAddr = () => {
                  const parts = [cust.address, cust.district, cust.state].filter(p => p && p.trim() && p !== 'string' && p !== 'N/A');
                  return parts.length > 0 ? parts.join(', ') : '—';
                };
                const displayAddress = formatAddr();
                const orderCount = cust.orders?.length || 0;
                const totalSpent = cust.orders?.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0) || 0;
                const customerType = cust.type || 'Farmer';

                return (
                  <tr 
                    key={cust.id} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => navigate(`/admin/customers/customer?id=${cust.id}`)}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      #{cust.id}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      <span>{cust.name}</span>
                      <span style={{
                        backgroundColor: customerType === 'Farmer' ? '#dcfce7' : (customerType === 'Retailer' ? '#dbeafe' : '#f3e8ff'),
                        color: customerType === 'Farmer' ? '#15803d' : (customerType === 'Retailer' ? '#1e40af' : '#6b21a8'),
                        border: `1px solid ${customerType === 'Farmer' ? '#bbf7d0' : (customerType === 'Retailer' ? '#bfdbfe' : '#e9d5ff')}`,
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        marginLeft: '8px',
                        display: 'inline-block'
                      }}>
                        {customerType}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 500, color: '#475569', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {cust.phone}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayAddress}>
                          {displayAddress}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                      {orderCount}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <AnimatedViewButton to={`/admin/customers/customer?id=${cust.id}`} title="View Profile" />
                        <OutlookDeleteButton onClick={() => handleDelete(cust.id)} title="Delete Customer" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredCustomers.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Rajinder Singh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. +919876543201"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. email@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Type</label>
                  <select
                    value={newCustomer.type}
                    onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider pt-2">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Street Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCustomer.address}
                    placeholder="House/Plot/Village details (e.g. 12 Main St, Pune, Maharashtra)"
                    onChange={e => {
                      const addr = e.target.value;
                      setNewCustomer(prev => {
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
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">District <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCustomer.district}
                    onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Ludhiana"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">State <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCustomer.state}
                    onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Punjab"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={newCustomer.status}
                    onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider pt-2">Agrarian Profile (For Farmers)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Soil Type</label>
                  <select
                    value={newCustomer.soilType}
                    onChange={e => setNewCustomer({ ...newCustomer, soilType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Red Sandy">Red Sandy</option>
                    <option value="Black Clayey">Black Clayey</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Laterite">Laterite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCustomer.farmSizeAcres}
                    onChange={e => setNewCustomer({ ...newCustomer, farmSizeAcres: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Irrigation Source</label>
                  <select
                    value={newCustomer.irrigationSource}
                    onChange={e => setNewCustomer({ ...newCustomer, irrigationSource: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Borewell">Borewell</option>
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Canal">Canal Water</option>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Sprinkler">Sprinklers</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;

