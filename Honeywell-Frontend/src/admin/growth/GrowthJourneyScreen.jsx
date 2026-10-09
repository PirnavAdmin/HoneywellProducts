import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Save, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  X, 
  TrendingUp, 
  BarChart3 
} from 'lucide-react';
import { 
  getGrowthJourneyData, 
  createGrowthJourney, 
  bulkUpdateGrowthJourney, 
  deleteGrowthJourney 
} from '../../services/growthJourneyService';
import { Toast } from '../components/Toast';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import './GrowthJourneyScreen.css';

export default function GrowthJourneyScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handle opening form modal for Add
  const handleOpenAdd = () => {
    setModalMode('add');
    const nextYear = items.length > 0 
      ? Math.max(...items.map(i => Number(i.year) || 2024)) + 1 
      : new Date().getFullYear();
    setFormData({
      id: null,
      year: String(nextYear),
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
    if (!item) return;
    setModalMode('edit');
    setFormData({
      id: item.id || null,
      year: String(item.year ?? ''),
      business: item.business !== undefined && item.business !== null ? Number(item.business) : 0,
      products: item.products !== undefined && item.products !== null ? Number(item.products) : 0,
      customers: item.customers !== undefined && item.customers !== null ? Number(item.customers) : 0,
      sales: item.sales !== undefined && item.sales !== null ? Number(item.sales) : 0
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

  // Modal form submission (POST for add/edit)
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

      await createGrowthJourney(payload);
      showToast(`Growth Journey record for ${payload.year} ${modalMode === 'add' ? 'created' : 'updated'} successfully.`);
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

  // Save Bulk Updates
  const handleSaveBulk = async () => {
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

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen && !submitting) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, submitting]);

  return (
    <div className="growth-journey-container">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Top Header Bar (Single horizontal line with heading & action buttons) */}
      <section className="growth-header-card">
        <div className="growth-title-wrap">
          <span className="growth-kicker">PERFORMANCE &amp; ANALYTICS</span>
          <h1>Growth Journey Management</h1>
          <p>Manage annual performance metrics, product range expansion, customer network indexes, and business growth indicators.</p>
        </div>

        <div className="growth-header-actions">
          <button 
            type="button" 
            className="btn-growth-secondary" 
            onClick={loadData} 
            disabled={loading} 
            title="Refresh Growth Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {!isBulkEdit ? (
            <>
              <button 
                type="button" 
                className="btn-growth-secondary" 
                onClick={() => {
                  setBulkData(JSON.parse(JSON.stringify(items)));
                  setIsBulkEdit(true);
                }}
                disabled={loading || items.length === 0}
                title="Bulk Edit All Growth Journey Rows"
              >
                <Edit2 size={15} />
                <span>Bulk Edit</span>
              </button>
              <button 
                type="button" 
                className="btn-growth-primary" 
                onClick={handleOpenAdd}
                title="Create New Annual Growth Record"
              >
                <Plus size={16} />
                <span>Add Growth Record</span>
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="btn-growth-secondary" 
                onClick={() => setIsBulkEdit(false)}
                disabled={bulkSubmitting}
              >
                <X size={15} />
                <span>Cancel Bulk Edit</span>
              </button>
              <button 
                type="button" 
                className="btn-growth-primary" 
                onClick={handleSaveBulk}
                disabled={bulkSubmitting}
              >
                <Save size={15} className={bulkSubmitting ? 'animate-spin' : ''} />
                <span>{bulkSubmitting ? 'Saving All...' : 'Save Bulk Changes'}</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Table Card */}
      <section className="growth-card">
        <div className="growth-filterbar">
          <div className="growth-search-wrap">
            <Search size={16} className="growth-search-icon" />
            <input
              type="text"
              className="growth-search-input"
              placeholder="Search by year or growth metrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isBulkEdit}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="growth-search-clear"
                title="Clear Search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <span className="growth-count-badge">
            {loading ? 'Loading...' : `Showing ${filteredItems.length} of ${items.length} records`}
          </span>
        </div>

        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th className="col-year">Year</th>
                <th className="col-metric">Business Growth Index</th>
                <th className="col-metric">Product Range Growth</th>
                <th className="col-metric">Customer Network Growth</th>
                <th className="col-metric">Sales Growth Index</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    <span>Loading Growth Journey records from database...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    {searchTerm ? 'No growth records matching search query.' : 'No Growth Journey records available. Click "Add Growth Record" to create one.'}
                  </td>
                </tr>
              ) : isBulkEdit ? (
                /* Bulk Edit Table Rows */
                bulkData.map((row, idx) => (
                  <tr key={row.id || row.year || idx}>
                    <td>
                      <span className="growth-year-cell" style={{ background: '#f8fafc' }}>
                        {row.year}
                      </span>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="growth-input" 
                        value={row.business} 
                        onChange={(e) => handleBulkChange(idx, 'business', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="growth-input" 
                        value={row.products} 
                        onChange={(e) => handleBulkChange(idx, 'products', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="growth-input" 
                        value={row.customers} 
                        onChange={(e) => handleBulkChange(idx, 'customers', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="growth-input" 
                        value={row.sales} 
                        onChange={(e) => handleBulkChange(idx, 'sales', e.target.value)} 
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="growth-bulk-badge">Editing</span>
                    </td>
                  </tr>
                ))
              ) : (
                /* Standard View Rows */
                paginatedItems.map((item) => (
                  <tr key={item.id || item.year}>
                    <td>
                      <div className="growth-year-cell">
                        <TrendingUp size={14} color="#1268a5" style={{ flexShrink: 0 }} />
                        <span>{item.year}</span>
                      </div>
                    </td>
                    <td>
                      <div className="growth-metric-box">
                        <span className="growth-metric-val">{item.business}</span>
                        <div className="growth-progress-track">
                          <div 
                            className="growth-progress-bar" 
                            style={{ width: `${Math.min(100, Math.max(0, Number(item.business) || 0))}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="growth-metric-box">
                        <span className="growth-metric-val">{item.products}</span>
                        <div className="growth-progress-track">
                          <div 
                            className="growth-progress-bar" 
                            style={{ width: `${Math.min(100, Math.max(0, Number(item.products) || 0))}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="growth-metric-box">
                        <span className="growth-metric-val">{item.customers}</span>
                        <div className="growth-progress-track">
                          <div 
                            className="growth-progress-bar" 
                            style={{ width: `${Math.min(100, Math.max(0, Number(item.customers) || 0))}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="growth-metric-box">
                        <span className="growth-metric-val">{item.sales}</span>
                        <div className="growth-progress-track">
                          <div 
                            className="growth-progress-bar" 
                            style={{ width: `${Math.min(100, Math.max(0, Number(item.sales) || 0))}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="growth-inline-actions">
                        <AnimatedEditButton 
                          onClick={(e) => {
                            if (e) e.stopPropagation();
                            handleOpenEdit(item);
                          }} 
                          title={`Edit ${item.year} Record`} 
                        />
                        <OutlookDeleteButton 
                          onClick={(e) => {
                            if (e) e.stopPropagation();
                            setDeleteTarget(item);
                          }} 
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

        {/* Pagination bar */}
        {!isBulkEdit && filteredItems.length > itemsPerPage && (
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '4px 16px', background: '#ffffff' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </section>

      {/* Single Add / Edit Modal */}
      {isModalOpen && (
        <div className="growth-modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="growth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="growth-modal-icon-wrap">
                  <TrendingUp size={20} color="#1268a5" />
                </div>
                <div>
                  <h2>{modalMode === 'add' ? 'Add Growth Journey Record' : `Edit Growth Record (${formData.year})`}</h2>
                  <p className="growth-modal-subtitle">
                    {modalMode === 'add' 
                      ? 'Create an annual performance entry with custom growth indexes (0–100).' 
                      : `Update the growth indicators and performance indexes for year ${formData.year}.`}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                title="Close Modal (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="growth-modal-body">
                {/* Year Field */}
                <div className="growth-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>
                      Timeline Year <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {modalMode === 'edit' && (
                      <span className="growth-locked-pill">Locked in Edit Mode</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    className={`growth-input ${modalMode === 'edit' ? 'growth-input-locked' : ''}`}
                    placeholder="e.g. 2027"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={modalMode === 'edit' || submitting}
                  />
                  {formErrors.year && <span className="growth-error-msg">{formErrors.year}</span>}
                </div>

                {/* Growth Metrics Form Grid */}
                <div className="growth-form-grid">
                  {/* Business Growth Index */}
                  <div className="growth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Business Growth Index <span style={{ color: '#ef4444' }}>*</span></label>
                      <span className="growth-metric-badge">{formData.business || 0}%</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="growth-input" 
                      placeholder="e.g. 85"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      disabled={submitting}
                    />
                    <div className="growth-progress-track" style={{ marginTop: '4px' }}>
                      <div 
                        className="growth-progress-bar" 
                        style={{ width: `${Math.min(100, Math.max(0, Number(formData.business) || 0))}%` }} 
                      />
                    </div>
                    {formErrors.business && <span className="growth-error-msg">{formErrors.business}</span>}
                  </div>

                  {/* Product Range Growth */}
                  <div className="growth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Product Range Growth <span style={{ color: '#ef4444' }}>*</span></label>
                      <span className="growth-metric-badge">{formData.products || 0}%</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="growth-input" 
                      placeholder="e.g. 80"
                      value={formData.products}
                      onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                      disabled={submitting}
                    />
                    <div className="growth-progress-track" style={{ marginTop: '4px' }}>
                      <div 
                        className="growth-progress-bar" 
                        style={{ width: `${Math.min(100, Math.max(0, Number(formData.products) || 0))}%` }} 
                      />
                    </div>
                    {formErrors.products && <span className="growth-error-msg">{formErrors.products}</span>}
                  </div>

                  {/* Customer Network Growth */}
                  <div className="growth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Customer Network Growth <span style={{ color: '#ef4444' }}>*</span></label>
                      <span className="growth-metric-badge">{formData.customers || 0}%</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="growth-input" 
                      placeholder="e.g. 88"
                      value={formData.customers}
                      onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                      disabled={submitting}
                    />
                    <div className="growth-progress-track" style={{ marginTop: '4px' }}>
                      <div 
                        className="growth-progress-bar" 
                        style={{ width: `${Math.min(100, Math.max(0, Number(formData.customers) || 0))}%` }} 
                      />
                    </div>
                    {formErrors.customers && <span className="growth-error-msg">{formErrors.customers}</span>}
                  </div>

                  {/* Sales Growth Index */}
                  <div className="growth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Sales Growth Index <span style={{ color: '#ef4444' }}>*</span></label>
                      <span className="growth-metric-badge">{formData.sales || 0}%</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="growth-input" 
                      placeholder="e.g. 82"
                      value={formData.sales}
                      onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                      disabled={submitting}
                    />
                    <div className="growth-progress-track" style={{ marginTop: '4px' }}>
                      <div 
                        className="growth-progress-bar" 
                        style={{ width: `${Math.min(100, Math.max(0, Number(formData.sales) || 0))}%` }} 
                      />
                    </div>
                    {formErrors.sales && <span className="growth-error-msg">{formErrors.sales}</span>}
                  </div>
                </div>
              </div>

              <div className="growth-modal-footer">
                <button 
                  type="button" 
                  className="btn-growth-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-growth-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (modalMode === 'add' ? 'Create Record' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="growth-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="growth-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="growth-modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="#dc2626" /> Delete Growth Record
              </h2>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', lineHeight: '1.5' }}>
                Are you sure you want to delete the Growth Journey record for Year <strong>{deleteTarget.year}</strong>?
              </p>
              <p style={{ marginTop: '8px', color: '#64748b', fontSize: '13px' }}>
                This action will remove the record from both the Admin console and the public website growth charts.
              </p>
            </div>

            <div className="growth-modal-footer">
              <button 
                type="button" 
                className="btn-growth-secondary" 
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-growth-primary" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
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
