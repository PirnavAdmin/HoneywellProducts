import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  Trash2,
  Edit
} from 'lucide-react';
import '../catalog/adminModule.css';
import { AnimatedViewButton, AnimatedEditButton, OutlookDeleteButton, Pagination } from '../components/ActionButtons';
import SuppliersPopup from './SuppliersPopup';
import { fetchSuppliers, deleteSupplier } from './suppliersApi';

export const supplierCategories = [
  'Farm Tools',
  'Irrigation',
  'Machinery',
  'Seeds & Inputs',
  'Safety Gear',
  'Packaging'
];

export const suppliers = [];

export const formatSupplierCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const supplierStatusMeta = {
  Verified: { icon: CheckCircle2, color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  Approved: { icon: CheckCircle2, color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  Pending: { icon: Clock, color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  Review: { icon: ShieldCheck, color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  Rejected: { icon: XCircle, color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  Inactive: { icon: XCircle, color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
};

const SupplierStatusBadge = ({ status }) => {
  const meta = supplierStatusMeta[status] || (
    String(status || '').toLowerCase().includes('reject') ? supplierStatusMeta.Rejected : supplierStatusMeta.Pending
  );
  const Icon = meta.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '10px',
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: '9999px',
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
        textTransform: 'capitalize'
      }}
    >
      <Icon size={11} />
      {status || 'Pending'}
    </span>
  );
};

const SuppliersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Popup detail state
  const [activePopupSupplier, setActivePopupSupplier] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [suppliersList, setSuppliersList] = useState([]);

  const loadSuppliers = async () => {
    try {
      const data = await fetchSuppliers();
      setSuppliersList(data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers from API:', err);
      setSuppliersList([]);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteSupplier(id);
      setSuppliersList(prev => prev.filter(s => String(s.id) !== String(id)));
    } catch (err) {
      console.error('Backend delete error:', err);
      alert('Failed to delete supplier from server: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return suppliersList
      .filter((supplier) => {
        const matchesSearch = [
          supplier.id,
          supplier.name,
          supplier.contactPerson,
          supplier.email,
          supplier.phone
        ].join(' ').toLowerCase().includes(normalizedSearch);
        const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
  }, [suppliersList, searchTerm, statusFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const summary = useMemo(() => {
    return suppliersList.reduce(
      (acc, supplier) => ({
        verified: acc.verified + (supplier.status === 'Verified' ? 1 : 0),
        total: acc.total + 1
      }),
      { verified: 0, total: 0 }
    );
  }, [suppliersList]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const pagedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="suppliers-page" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header Section with Procurement Label & Top-Right Metrics */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#059669', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            PROCUREMENT
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.2 }}>
            Supplier Management
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Manage approved vendors, contacts, categories, and payment terms.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 16px', textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              VERIFIED
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{summary.verified}</strong>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 16px', textAlign: 'center', minWidth: '70px' }}>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL
            </span>
            <strong style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{summary.total}</strong>
          </div>
        </div>
      </section>

      {/* Main Vendor Directory Card */}
      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', margin: 0, boxSizing: 'border-box' }}>
        
        {/* Card Header with Add Supplier Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor Directory
            </h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
              {filteredSuppliers.length} suppliers match current filters
            </p>
          </div>
          <Link
            to="/admin/suppliers/add"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0 16px',
              height: '36px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            <Plus size={15} />
            <span>Add Supplier</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="search"
              placeholder="Search supplier, contact, phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px 0 36px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              height: '36px',
              padding: '0 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#0f172a',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Review">Review</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="catalog-table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto', width: '100%' }}>
          <table className="catalog-table" style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Supplier</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact Details</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lead Time</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedSuppliers.map((supplier) => (
                <tr 
                  key={supplier.id} 
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onClick={() => setActivePopupSupplier(supplier)}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{supplier.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {supplier.city ? `${supplier.city} • ` : ''}Rating {supplier.rating || '4.5'}/5
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{supplier.contactPerson || supplier.name}</div>
                    {supplier.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        <Phone size={11} />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        <Mail size={11} />
                        {supplier.email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {supplier.category ? (
                      <span className="catalog-badge" style={{ fontSize: '11px' }}>
                        {supplier.category}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#334155' }}>
                      <Truck size={13} style={{ color: '#64748b' }} />
                      {supplier.leadTime || '4-6 days'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <SupplierStatusBadge status={supplier.status} />
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div className="catalog-inline-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                      <AnimatedViewButton
                        onClick={() => setActivePopupSupplier(supplier)}
                        title="View supplier snapshot"
                      />
                      <AnimatedEditButton
                        to={`/admin/suppliers/edit/${supplier.id}`}
                        title="Edit supplier profile"
                      />
                      <OutlookDeleteButton
                        onClick={() => handleDelete(supplier.id)}
                        title="Delete supplier permanently"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredSuppliers.length && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    No suppliers match the current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredSuppliers.length}
          itemsPerPage={itemsPerPage}
        />
      </section>

      {/* Render details popup */}
      {activePopupSupplier && (
        <SuppliersPopup 
          supplier={activePopupSupplier} 
          onClose={() => setActivePopupSupplier(null)} 
        />
      )}
    </div>
  );
};

export default SuppliersList;

