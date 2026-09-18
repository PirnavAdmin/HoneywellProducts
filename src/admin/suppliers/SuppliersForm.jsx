import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
  Check
} from 'lucide-react';
import { supplierCategories } from './SuppliersList';
import '../catalog/adminModule.css';
import { Toast } from '../components/Toast';
import { fetchSupplier, createSupplier, updateSupplier } from './suppliersApi';

const initialSupplier = {
  name: '',
  contactPerson: '',
  category: supplierCategories[0],
  status: 'Pending',
  email: '',
  phone: '',
  city: '',
  address: '',
  gstin: '',
  leadTime: '',
  paymentTerms: 'Net 15',
  productLines: '',
  notes: ''
};

const SuppliersForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [supplier, setSupplier] = useState(initialSupplier);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const loadSupplierData = async () => {
      try {
        const data = await fetchSupplier(id);
        if (data) {
          setSupplier(data);
        }
      } catch (err) {
        console.error('Failed to load supplier details:', err);
        setToastMessage('Failed to load supplier profile.');
        setToastType('warning');
      }
    };
    loadSupplierData();
  }, [id]);

  const isValidFieldValue = (val) => {
    const str = String(val || '').trim();
    return str.length > 0 && str.toLowerCase() !== 'not specified' && str.toLowerCase() !== 'n/a';
  };

  const completionScore = useMemo(() => {
    const requiredFields = ['name', 'contactPerson', 'email', 'phone', 'city', 'address', 'productLines'];
    const completed = requiredFields.filter((field) => isValidFieldValue(supplier[field])).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [supplier]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();

    const requiredFields = ['name', 'contactPerson', 'email', 'phone', 'city', 'address', 'productLines'];
    const hasInvalidRequired = requiredFields.some((field) => !isValidFieldValue(supplier[field]));

    if (hasInvalidRequired) {
      setToastMessage('Please fill in all required fields (asterisk fields cannot be left blank or "Not specified").');
      setToastType('warning');
      return;
    }

    // Phone / Mobile validation
    const cleanPhone = String(supplier.phone || '').replace(/^\+?91\s*/, '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setToastMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210).');
      setToastType('warning');
      return;
    }
    
    setIsSaving(true);
    try {
      if (id) {
        await updateSupplier(id, supplier);
        setToastMessage(`${supplier.name} has been updated.`);
      } else {
        await createSupplier(supplier);
        setToastMessage(`${supplier.name} has been submitted for onboarding review.`);
      }
      setToastType('success');
      
      setTimeout(() => {
        navigate('/admin/suppliers/list');
      }, 1200);
    } catch (err) {
      console.error('Failed to save supplier:', err);
      setToastMessage('Failed to save supplier details: ' + err.message);
      setToastType('warning');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSupplier(initialSupplier);
  };

  return (
    <div className="suppliers-page supplier-form-page" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Card */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/admin/suppliers/list"
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              background: '#ffffff',
              transition: 'all 0.15s ease',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#059669', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
              PROCUREMENT
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {isEditing ? 'Edit Supplier Profile' : 'Add Supplier Profile'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#047857')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#059669')}
          >
            <RotateCcw size={15} />
            <span>Reset Form</span>
          </button>
        </div>
      </section>

      {/* Progress Bar Card */}
      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Profile Setup Progress
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '220px', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completionScore}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }}></div>
            </div>
            <strong style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{completionScore}%</strong>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Fill required fields to complete the onboarding record.
        </span>
      </section>

      {/* Main 2-Column Form Layout (65% / 35%) */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Left Column: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card A: Company Details */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', margin: '0 0 16px 0' }}>
              COMPANY DETAILS
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Supplier Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={supplier.name}
                  onChange={handleChange}
                  placeholder="e.g. KisanKraft Ltd."
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Contact Person <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  value={supplier.contactPerson}
                  onChange={handleChange}
                  placeholder="Procurement contact name"
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={supplier.category}
                  onChange={handleChange}
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  {supplierCategories.map((category) => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Approval Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={supplier.status}
                  onChange={handleChange}
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Review">Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  GSTIN / Tax ID
                </label>
                <input
                  id="gstin"
                  name="gstin"
                  type="text"
                  value={supplier.gstin}
                  onChange={handleChange}
                  placeholder="Optional tax registration"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Product Lines <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="productLines"
                  name="productLines"
                  type="text"
                  value={supplier.productLines}
                  onChange={handleChange}
                  placeholder="Tillers, pumps, drip kits"
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </section>

          {/* Card B: Contact & Location */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', margin: '0 0 16px 0' }}>
              CONTACT &amp; LOCATION
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={supplier.email}
                  onChange={handleChange}
                  placeholder="orders@supplier.com"
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={supplier.phone}
                  onChange={handleChange}
                  placeholder="+91 98765-43210"
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  City / Region <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={supplier.city}
                  onChange={handleChange}
                  placeholder="City, State"
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Average Lead Time
                </label>
                <input
                  id="leadTime"
                  name="leadTime"
                  type="text"
                  value={supplier.leadTime}
                  onChange={handleChange}
                  placeholder="e.g. 4-6 days"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Registered Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={supplier.address}
                onChange={handleChange}
                placeholder="Street, industrial area, city, state, PIN"
                required
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </section>

        </div>

        {/* Right Column: Procurement Terms, Live Review, Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card C: Procurement Terms */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', margin: '0 0 16px 0' }}>
              PROCUREMENT TERMS
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  name="paymentTerms"
                  value={supplier.paymentTerms}
                  onChange={handleChange}
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Advance 30%">Advance 30%</option>
                  <option value="Advance 50%">Advance 50%</option>
                  <option value="COD">COD</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={supplier.notes}
                  onChange={handleChange}
                  placeholder="Quality parameters, preferred dispatch days, logistics defaults..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', outline: 'none', background: '#ffffff', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </section>

          {/* Card D: Live Review */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', margin: '0 0 16px 0' }}>
              LIVE REVIEW
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.name || 'Vendor Name'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{supplier.status || 'Pending'} | {supplier.category || 'Farm Tools'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>{supplier.phone || 'Phone Number'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>{supplier.email || 'Email Address'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>{supplier.city || 'City / Region'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>{supplier.leadTime || 'Lead time not specified'}</span>
              </div>
            </div>
          </section>

          {/* Far-Right Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <Link
              to="/admin/suppliers/list"
              style={{
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                height: '38px',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                height: '38px',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                opacity: isSaving ? 0.7 : 1,
                transition: 'background 0.15s ease'
              }}
              onMouseOver={(e) => !isSaving && (e.currentTarget.style.background = '#047857')}
              onMouseOut={(e) => !isSaving && (e.currentTarget.style.background = '#059669')}
            >
              <Check size={15} />
              <span>{isSaving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Supplier' : 'Save Supplier')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};

export default SuppliersForm;

