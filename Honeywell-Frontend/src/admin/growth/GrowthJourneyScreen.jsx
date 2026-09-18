import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, RefreshCw, Save, Edit2, Trash2, CheckCircle, AlertCircle, X, TrendingUp } from 'lucide-react';
import { 
  getGrowthJourneyData, 
  createGrowthJourney, 
  bulkUpdateGrowthJourney, 
  deleteGrowthJourney 
} from '../../services/growthJourneyService';
import '../catalog/adminModule.css';
import { Toast } from '../components/Toast';
import { OutlookDeleteButton, AnimatedEditButton } from '../components/ActionButtons';

export default function GrowthJourneyScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Form Modal State (Add / Single Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [formData, setFormData] = useState({
    id: null,
    year: '',
    business: '',
    products: '',
    customers: '',
    sales: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Bulk Edit Mode State
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [bulkData, setBulkData] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getGrowthJourneyData();
      // Sort logically by year ascending
      const sorted = [...data].sort((a, b) => String(a.year).localeCompare(String(b.year), undefined, { numeric: true }));
      setItems(sorted);
      setBulkData(JSON.parse(JSON.stringify(sorted)));
    } catch (err) {
      console.error('Failed to load growth journey data:', err);
      showToast(err.message || 'Failed to load Growth Journey data from backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search filter
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(item => 
      String(item.year).toLowerCase().includes(q) ||
      String(item.business).includes(q) ||
      String(item.products).includes(q) ||
      String(item.customers).includes(q) ||
      String(item.sales).includes(q)
    );
  }, [items, searchTerm]);

  // Handle opening form modal for Add
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      id: null,
      year: String(new Date().getFullYear() + 1),
      business: 50,
      products: 50,
      customers: 50,
      sales: 50
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle opening form modal for Single Edit
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      id: item.id || null,
      year: String(item.year),
      business: item.business !== undefined ? item.business : '',
      products: item.products !== undefined ? item.products : '',
      customers: item.customers !== undefined ? item.customers : '',
      sales: item.sales !== undefined ? item.sales : ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Modal form input validation
  const validateForm = () => {
    const errors = {};
    if (!formData.year || !String(formData.year).trim()) {
      errors.year = 'Year is required.';
    } else if (!/^\d{4}$/.test(String(formData.year).trim())) {
      errors.year = 'Year must be a valid 4-digit year (e.g. 2027).';
    } else if (modalMode === 'add') {
      const exists = items.some(i => String(i.year).trim() === String(formData.year).trim());
      if (exists) {
        errors.year = `A growth record for year ${formData.year} already exists.`;
      }
    }

    ['business', 'products', 'customers', 'sales'].forEach(field => {
      const val = formData[field];
      if (val === '' || val === null || val === undefined) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} value is required.`;
      } else if (isNaN(Number(val)) || Number(val) < 0) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-negative number.`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modal form submission (POST for add, POST/PUT for edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        year: String(formData.year).trim(),
        business: Number(formData.business),
        products: Number(formData.products),
        customers: Number(formData.customers),
        sales: Number(formData.sales)
      };

      if (modalMode === 'add') {
        await createGrowthJourney(payload);
        showToast(`Growth Journey record for ${payload.year} created successfully.`);
      } else {
        // Edit mode: If year changed or single update, we can update via POST or bulk payload
        // POST /api/GrowthJourney updates or creates by year in backend
        await createGrowthJourney(payload);
        showToast(`Growth Journey record for ${payload.year} updated successfully.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving growth journey record:', err);
      showToast(err.message || 'Failed to save Growth Journey record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Edit Table Change Handler
  const handleBulkChange = (index, field, value) => {
    setBulkData(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  // Save Bulk Updates (PUT /api/GrowthJourney/bulk)
  const handleSaveBulk = async () => {
    // Validate bulk data
    for (let i = 0; i < bulkData.length; i++) {
      const row = bulkData[i];
      if (!row.year || !String(row.year).trim()) {
        showToast(`Row ${i + 1}: Year is required.`, 'error');
        return;
      }
      for (const field of ['business', 'products', 'customers', 'sales']) {
        if (row[field] === '' || isNaN(Number(row[field])) || Number(row[field]) < 0) {
          showToast(`Row for year ${row.year}: Invalid ${field} index value.`, 'error');
          return;
        }
      }
    }

    setBulkSubmitting(true);
    try {
      const payload = bulkData.map(row => ({
        year: String(row.year).trim(),
        business: Number(row.business),
        products: Number(row.products),
        customers: Number(row.customers),
        sales: Number(row.sales)
      }));

      await bulkUpdateGrowthJourney(payload);
      showToast('All Growth Journey records updated successfully in bulk.');
      setIsBulkEdit(false);
      await loadData();
    } catch (err) {
      console.error('Error in bulk update:', err);
      showToast(err.message || 'Failed to save bulk growth journey records.', 'error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const targetIdentifier = deleteTarget.year || deleteTarget.id;
      await deleteGrowthJourney(targetIdentifier);
      showToast(`Growth Journey record for year ${deleteTarget.year} deleted successfully.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete growth journey record:', err);
      showToast(err.message || `Failed to delete record for year ${deleteTarget.year}.`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="catalog-page">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Performance & Analytics</span>
          <h1>Growth Journey Management</h1>
          <p>Manage annual performance metrics, product growth, customer network indices, and business indicators displayed across the Honeywell Products platform.</p>
        </div>

        <div className="catalog-header__actions">
          <button 
            type="button" 
            className="catalog-btn" 
            onClick={loadData} 
            disabled={loading} 
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          {!isBulkEdit ? (
            <>
              <button 
                type="button" 
                className="catalog-btn" 
                onClick={() => {
                  setBulkData(JSON.parse(JSON.stringify(items)));
                  setIsBulkEdit(true);
                }}
                disabled={loading || items.length === 0}
                title="Bulk Edit Table"
              >
                <Edit2 size={16} /> Bulk Edit
              </button>
              <button 
                type="button" 
                className="catalog-btn catalog-btn--primary" 
                onClick={handleOpenAdd}
              >
                <Plus size={16} /> Add Growth Record
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="catalog-btn" 
                onClick={() => setIsBulkEdit(false)}
                disabled={bulkSubmitting}
              >
                Cancel Bulk Edit
              </button>
              <button 
                type="button" 
                className="catalog-btn catalog-btn--primary" 
                onClick={handleSaveBulk}
                disabled={bulkSubmitting}
              >
                <Save size={16} className={bulkSubmitting ? 'spin' : ''} />
                {bulkSubmitting ? 'Saving All...' : 'Save Bulk Changes'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Table Card */}
      <section className="catalog-card">
        <div className="catalog-filterbar">
          <div className="catalog-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by year or growth value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isBulkEdit}
            />
          </div>
          <span className="catalog-count">
            {loading ? 'Loading...' : `${filteredItems.length} record${filteredItems.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Year</th>
                <th>Business Growth Index</th>
                <th>Product Range Growth</th>
                <th>Customer Network Growth</th>
                <th>Sales Growth Index</th>
                <th className="catalog-center-cell" style={{ width: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <RefreshCw size={20} className="spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                    Loading Growth Journey records from API...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    No Growth Journey records available. Click <strong>"Add Growth Record"</strong> to create one.
                  </td>
                </tr>
              ) : isBulkEdit ? (
                /* Bulk Edit Table Rows */
                bulkData.map((row, idx) => (
                  <tr key={row.id || row.year || idx}>
                    <td>
                      <input 
                        type="text" 
                        className="catalog-input" 
                        style={{ width: '90px', fontWeight: 'bold' }} 
                        value={row.year} 
                        onChange={(e) => handleBulkChange(idx, 'year', e.target.value)}
                        readOnly // Keep year fixed in bulk edit to avoid index corruption
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="catalog-input" 
                        value={row.business} 
                        onChange={(e) => handleBulkChange(idx, 'business', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="catalog-input" 
                        value={row.products} 
                        onChange={(e) => handleBulkChange(idx, 'products', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="catalog-input" 
                        value={row.customers} 
                        onChange={(e) => handleBulkChange(idx, 'customers', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="catalog-input" 
                        value={row.sales} 
                        onChange={(e) => handleBulkChange(idx, 'sales', e.target.value)} 
                      />
                    </td>
                    <td className="catalog-center-cell">
                      <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Bulk Editing</span>
                    </td>
                  </tr>
                ))
              ) : (
                /* Standard View Rows */
                filteredItems.map((item) => (
                  <tr key={item.id || item.year}>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#1268a5" />
                        <span>{item.year}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.business}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.products}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.customers}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.sales}</span>
                    </td>
                    <td className="catalog-center-cell">
                      <div className="catalog-inline-actions">
                        <AnimatedEditButton 
                          onClick={() => handleOpenEdit(item)} 
                          title={`Edit ${item.year} Record`} 
                        />
                        <OutlookDeleteButton 
                          onClick={() => setDeleteTarget(item)} 
                          title={`Delete ${item.year} Record`} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Single Add / Edit Modal */}
      {isModalOpen && (
        <div className="catalog-modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="catalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="catalog-modal-header">
              <h2>{modalMode === 'add' ? 'Add Growth Journey Entry' : `Edit Growth Journey (${formData.year})`}</h2>
              <button 
                type="button" 
                className="catalog-modal-close" 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="catalog-form" style={{ padding: '20px' }}>
              <div className="catalog-form-group">
                <label className="catalog-label">
                  Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className={`catalog-input ${formErrors.year ? 'catalog-input--error' : ''}`}
                  placeholder="e.g. 2027"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  disabled={modalMode === 'edit' || submitting}
                />
                {formErrors.year && <span className="catalog-error-text">{formErrors.year}</span>}
              </div>

              <div className="catalog-form-group">
                <label className="catalog-label">
                  Business Growth Index <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className={`catalog-input ${formErrors.business ? 'catalog-input--error' : ''}`}
                  placeholder="e.g. 85"
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  disabled={submitting}
                />
                {formErrors.business && <span className="catalog-error-text">{formErrors.business}</span>}
              </div>

              <div className="catalog-form-group">
                <label className="catalog-label">
                  Product Range Growth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className={`catalog-input ${formErrors.products ? 'catalog-input--error' : ''}`}
                  placeholder="e.g. 80"
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  disabled={submitting}
                />
                {formErrors.products && <span className="catalog-error-text">{formErrors.products}</span>}
              </div>

              <div className="catalog-form-group">
                <label className="catalog-label">
                  Customer Network Growth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className={`catalog-input ${formErrors.customers ? 'catalog-input--error' : ''}`}
                  placeholder="e.g. 88"
                  value={formData.customers}
                  onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                  disabled={submitting}
                />
                {formErrors.customers && <span className="catalog-error-text">{formErrors.customers}</span>}
              </div>

              <div className="catalog-form-group">
                <label className="catalog-label">
                  Sales Growth Index <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className={`catalog-input ${formErrors.sales ? 'catalog-input--error' : ''}`}
                  placeholder="e.g. 82"
                  value={formData.sales}
                  onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                  disabled={submitting}
                />
                {formErrors.sales && <span className="catalog-error-text">{formErrors.sales}</span>}
              </div>

              <div className="catalog-modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="catalog-btn" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="catalog-btn catalog-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (modalMode === 'add' ? 'Create Record' : 'Update Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="catalog-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="catalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="catalog-modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="#dc2626" /> Delete Growth Record
              </h2>
              <button 
                type="button" 
                className="catalog-modal-close" 
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: '1.5' }}>
                Are you sure you want to delete the Growth Journey record for Year <strong>{deleteTarget.year}</strong>?
              </p>
              <p style={{ marginTop: '10px', color: '#64748b', fontSize: '13px' }}>
                This action will remove the record from both the Admin console and public website growth charts.
              </p>
            </div>

            <div className="catalog-modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button 
                type="button" 
                className="catalog-btn" 
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="catalog-btn" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{ background: '#dc2626', color: '#ffffff', border: '1px solid #dc2626' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
