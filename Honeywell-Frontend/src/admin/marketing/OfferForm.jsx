import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Image as ImageIcon,
  Percent,
  RotateCcw,
  Save,
  Tag,
  Loader2,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Eye,
  ShoppingBag,
  ExternalLink,
  Layers,
  Box,
  DollarSign,
  Info,
  ShieldAlert
} from 'lucide-react';
import '../catalog/adminModule.css';
import { offersService } from '../../services/offersService';
import { productService } from '../../services/productService';
import { fetchCategories, fetchSubcategories } from '../catalog/catalogApi';
import { uploadBannerImage } from './bannersApi';
import { Toast } from '../components/Toast';

// Quick Promotional Badge Suggestions
const BADGE_SUGGESTIONS = [
  '25% OFF',
  'SPECIAL PRICE',
  'LIMITED TIME',
  'FLASH DEAL',
  'BEST DEAL',
  'FESTIVAL OFFER',
  'HOT DEAL',
  'EXCLUSIVE'
];

const DEAL_TYPE_OPTIONS = [
  { value: 'Product Offer', label: 'Product Offer (Standard)' },
  { value: 'Category Offer', label: 'Category Offer' },
  { value: 'Flash Deal', label: 'Flash Deal' },
  { value: 'Featured Deal', label: 'Featured Deal' }
];

const initialFormState = {
  dealType: 'Product Offer',
  categoryId: '',
  subcategoryId: '',
  productId: '',
  title: '',
  badgeTag: '25% OFF',
  description: '',
  originalPrice: '',
  discountType: 'Percentage', // 'Percentage' | 'Flat Amount'
  discountValue: '25',
  dealPrice: '',
  discountPercentage: '',
  startDate: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  expiryTime: '23:59',
  displayOrder: 1,
  isActive: true,
  isFeatured: false,
  showDiscountBadge: true,
  showCountdownTimer: true,
  imageSource: 'product', // 'product' | 'upload'
  imageUrl: ''
};

export default function OfferForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // Main Form State
  const [formData, setFormData] = useState(initialFormState);

  // API Data Lists
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Loading & Error States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOfferLoading, setIsOfferLoading] = useState(isEdit);
  const [apiError, setApiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Search filter inside product selector
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Load Categories, Subcategories, and Products from Backend API
  const loadMasterData = async () => {
    try {
      setIsLoadingData(true);
      setApiError(null);

      const [catsRes, subsRes, prodsRes] = await Promise.all([
        fetchCategories().catch(err => {
          console.error('Failed to load categories:', err);
          return [];
        }),
        fetchSubcategories().catch(err => {
          console.error('Failed to load subcategories:', err);
          return [];
        }),
        productService.getAll().catch(err => {
          console.error('Failed to load products:', err);
          return [];
        })
      ]);

      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setSubcategories(Array.isArray(subsRes) ? subsRes : []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : []);
    } catch (err) {
      console.error('Master data loading failed:', err);
      setApiError('Unable to load catalog master data. Please check backend connection.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Load existing Offer when in Edit Mode
  useEffect(() => {
    if (!isEdit) return;
    async function loadOfferDetails() {
      try {
        setIsOfferLoading(true);
        const offer = await offersService.getById(id);
        if (offer) {
          const endDateFormatted = offer.endDate ? offer.endDate.split('T')[0] : '';
          const endTimeFormatted = offer.endDate && offer.endDate.includes('T')
            ? offer.endDate.split('T')[1].slice(0, 5)
            : '23:59';

          setFormData(prev => ({
            ...prev,
            title: offer.title || '',
            badgeTag: offer.badgeTag || 'SPECIAL PRICE',
            originalPrice: offer.originalPrice ? String(offer.originalPrice) : '',
            dealPrice: offer.dealPrice ? String(offer.dealPrice) : '',
            discountPercentage: offer.discountPercentage ? String(offer.discountPercentage) : '',
            description: offer.description || '',
            imageUrl: offer.imageUrl || '',
            endDate: endDateFormatted || prev.endDate,
            expiryTime: endTimeFormatted,
            isActive: offer.isActive !== undefined ? Boolean(offer.isActive) : true,
            displayOrder: offer.displayOrder || 1,
            productId: offer.productId ? String(offer.productId) : '',
            imageSource: offer.imageUrl ? 'upload' : 'product'
          }));
        }
      } catch (err) {
        console.error('Failed to load offer details:', err);
        setToastMessage('Failed to load offer details from API.');
        setToastType('error');
      } finally {
        setIsOfferLoading(false);
      }
    }
    loadOfferDetails();
  }, [id, isEdit]);

  // Sync selected product data into form when editing or when productId matches loaded products
  useEffect(() => {
    if (formData.productId && products.length > 0) {
      const match = products.find(p => String(p.id) === String(formData.productId));
      if (match) {
        setFormData(prev => ({
          ...prev,
          categoryId: prev.categoryId || String(match.categoryId || ''),
          subcategoryId: prev.subcategoryId || String(match.subcategoryId || ''),
          originalPrice: prev.originalPrice || String(match.mrp || match.price || ''),
          imageUrl: prev.imageSource === 'product'
            ? (match.image || match.imageUrl || '')
            : prev.imageUrl
        }));
      }
    }
  }, [formData.productId, products]);

  // Derived Filtered Subcategories based on Selected Category
  const filteredSubcategories = useMemo(() => {
    if (!formData.categoryId) return [];
    return subcategories.filter(s =>
      String(s.categoryId) === String(formData.categoryId) ||
      String(s.categoryName || '').toLowerCase() === String(categories.find(c => String(c.id) === String(formData.categoryId))?.name || '').toLowerCase()
    );
  }, [formData.categoryId, subcategories, categories]);

  // Derived Filtered Products based on Category, Subcategory & Search Query
  const filteredProducts = useMemo(() => {
    let list = products;

    if (formData.categoryId) {
      const targetCat = categories.find(c => String(c.id) === String(formData.categoryId));
      list = list.filter(p =>
        String(p.categoryId) === String(formData.categoryId) ||
        (targetCat && String(p.categoryName || '').toLowerCase() === String(targetCat.name).toLowerCase())
      );
    }

    if (formData.subcategoryId) {
      const targetSub = subcategories.find(s => String(s.id) === String(formData.subcategoryId));
      list = list.filter(p =>
        String(p.subcategoryId) === String(formData.subcategoryId) ||
        (targetSub && String(p.subcategoryName || '').toLowerCase() === String(targetSub.name).toLowerCase())
      );
    }

    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase().trim();
      list = list.filter(p =>
        String(p.name || p.title || '').toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q) ||
        String(p.brand || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, formData.categoryId, formData.subcategoryId, productSearchQuery, categories, subcategories]);

  // Currently Selected Product Object
  const selectedProduct = useMemo(() => {
    if (!formData.productId) return null;
    return products.find(p => String(p.id) === String(formData.productId)) || null;
  }, [formData.productId, products]);

  // Handle Cascading Selects
  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      subcategoryId: '',
      productId: ''
    }));
  };

  const handleSubcategoryChange = (e) => {
    const subId = e.target.value;
    setFormData(prev => ({
      ...prev,
      subcategoryId: subId,
      productId: ''
    }));
  };

  const handleProductSelect = (prodId) => {
    const prod = products.find(p => String(p.id) === String(prodId));
    if (!prod) {
      setFormData(prev => ({ ...prev, productId: '' }));
      return;
    }

    const mrpVal = Number(prod.mrp || prod.originalPrice || prod.price || 0);
    const priceVal = Number(prod.price || prod.dealPrice || 0);

    let defaultDiscountVal = formData.discountValue || '25';
    let calculatedDealPrice = String(priceVal || '');

    if (mrpVal > 0) {
      if (formData.discountType === 'Percentage' && Number(defaultDiscountVal) > 0) {
        calculatedDealPrice = String(Math.round(mrpVal * (1 - Number(defaultDiscountVal) / 100)));
      } else if (priceVal > 0) {
        calculatedDealPrice = String(priceVal);
      }
    }

    const prodImg = prod.image || prod.imageUrl || (Array.isArray(prod.images) ? prod.images[0] : '');

    setFormData(prev => ({
      ...prev,
      productId: prod.id,
      categoryId: prev.categoryId || String(prod.categoryId || ''),
      subcategoryId: prev.subcategoryId || String(prod.subcategoryId || ''),
      title: prev.title || prod.name || prod.title || '',
      originalPrice: String(mrpVal || ''),
      dealPrice: calculatedDealPrice,
      description: prev.description || prod.shortDescription || prod.description || '',
      imageUrl: prev.imageSource === 'product' ? (prodImg || prev.imageUrl) : prev.imageUrl
    }));
  };

  // Pricing Calculations
  const mrpNum = Number(formData.originalPrice) || 0;

  // Auto-calculate offer price or discount percentage when pricing inputs change
  const handlePricingChange = (field, val) => {
    const next = { ...formData, [field]: val };
    const currentMrp = Number(field === 'originalPrice' ? val : next.originalPrice) || 0;

    if (field === 'discountType' || field === 'discountValue' || field === 'originalPrice') {
      const discVal = Number(field === 'discountValue' ? val : next.discountValue) || 0;
      const discType = field === 'discountType' ? val : next.discountType;

      if (currentMrp > 0 && discVal > 0) {
        if (discType === 'Percentage') {
          const calcPrice = Math.round(currentMrp - (currentMrp * discVal / 100));
          next.dealPrice = String(Math.max(0, calcPrice));
          next.discountPercentage = String(discVal);
        } else { // Flat Amount
          const calcPrice = Math.round(currentMrp - discVal);
          next.dealPrice = String(Math.max(0, calcPrice));
          next.discountPercentage = String(Math.round((discVal / currentMrp) * 100));
        }
      }
    } else if (field === 'dealPrice') {
      const dealNum = Number(val) || 0;
      if (currentMrp > 0 && dealNum > 0 && currentMrp > dealNum) {
        const pct = Math.round(((currentMrp - dealNum) / currentMrp) * 100);
        next.discountPercentage = String(pct);
      }
    }

    setFormData(next);
  };

  // Calculations for Savings Summary & Live Preview
  const dealPriceNum = Number(formData.dealPrice) || 0;
  const youSaveAmount = mrpNum > dealPriceNum ? mrpNum - dealPriceNum : 0;
  const calculatedSavingsPct = mrpNum > 0 && dealPriceNum > 0 && mrpNum > dealPriceNum
    ? Math.round((youSaveAmount / mrpNum) * 100)
    : Number(formData.discountPercentage) || 0;

  // Pricing Validations
  const isMrpInvalid = formData.originalPrice !== '' && mrpNum <= 0;
  const isDealPriceInvalid = formData.dealPrice !== '' && (dealPriceNum <= 0 || (mrpNum > 0 && dealPriceNum >= mrpNum));
  const isDiscountInvalid = formData.discountType === 'Percentage'
    ? (Number(formData.discountValue) <= 0 || Number(formData.discountValue) > 100)
    : (Number(formData.discountValue) <= 0 || (mrpNum > 0 && Number(formData.discountValue) >= mrpNum));

  const isDurationInvalid = formData.endDate && formData.startDate &&
    new Date(`${formData.endDate}T${formData.expiryTime || '23:59'}`) <= new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);

  // Image Upload Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadBannerImage(file);
      if (res) {
        const imageUrlStr = typeof res === 'string' ? res : (res.imageUrl || res.url || res.path || '');
        setFormData(prev => ({ ...prev, imageUrl: imageUrlStr, imageSource: 'upload' }));
        setToastMessage('Custom banner uploaded successfully!');
        setToastType('success');
      }
    } catch (err) {
      console.error('Failed to upload banner:', err);
      setToastMessage('Image upload failed. Please try again.');
      setToastType('error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Form Submission (POST Create / PUT Update)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      setToastMessage('Offer Title is required.');
      setToastType('error');
      return;
    }

    if (!formData.dealPrice || Number(formData.dealPrice) <= 0) {
      setToastMessage('Valid Deal / Offer Price is required.');
      setToastType('error');
      return;
    }

    if (mrpNum > 0 && dealPriceNum >= mrpNum) {
      setToastMessage('Deal price must be strictly less than original MRP.');
      setToastType('error');
      return;
    }

    if (isDurationInvalid) {
      setToastMessage('Expiry Date & Time must be later than Start Date & Time.');
      setToastType('error');
      return;
    }

    // Determine final image URL
    const activeProductImg = selectedProduct?.image || selectedProduct?.imageUrl || '';
    const finalImageUrl = formData.imageSource === 'product' && activeProductImg
      ? activeProductImg
      : formData.imageUrl;

    // Build payload matching backend Offer API contract EXACTLY
    const categoryObj = categories.find(c => String(c.id) === String(formData.categoryId));

    const apiPayload = {
      title: formData.title.trim(),
      category: categoryObj?.name || 'General',
      badgeTag: formData.badgeTag.trim() || 'SPECIAL PRICE',
      originalPrice: mrpNum,
      dealPrice: dealPriceNum,
      discountPercentage: calculatedSavingsPct,
      description: formData.description.trim(),
      imageUrl: finalImageUrl || '',
      endDate: formData.endDate
        ? (formData.endDate.includes('T') ? formData.endDate : `${formData.endDate}T${formData.expiryTime || '23:59'}:00Z`)
        : new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: Boolean(formData.isActive),
      displayOrder: Number(formData.displayOrder || 1),
      productId: formData.productId ? Number(formData.productId) : null
    };

    setIsSaving(true);
    try {
      if (isEdit) {
        await offersService.update(id, apiPayload);
        setToastMessage('Product Offer updated successfully!');
      } else {
        await offersService.create(apiPayload);
        setToastMessage('New Product Offer created successfully!');
      }
      setToastType('success');
      setTimeout(() => {
        navigate('/admin/marketing/offers');
      }, 1200);
    } catch (err) {
      console.error('Failed to save offer:', err);
      setToastMessage(err.message || 'Failed to save offer. Please check backend connection.');
      setToastType('error');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setProductSearchQuery('');
  };

  if (isOfferLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: '#1268a5', margin: '0 auto 12px auto' }} />
        <p style={{ fontWeight: 600 }}>Loading Offer Details...</p>
      </div>
    );
  }

  return (
    <div className="catalog-page" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header & Bar */}
      <header className="catalog-header" style={{ padding: '18px 24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/admin/marketing/offers"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              backgroundColor: '#ffffff',
              transition: 'all 0.2s ease'
            }}
            title="Back to Offers List"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="catalog-kicker" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
              MARKETING CAMPAIGN BUILDER
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isEdit ? `Edit Offer #${id}` : 'Create Product-Linked Offer'}
            </h1>
          </div>
        </div>

        <div className="catalog-header__actions" style={{ gap: '10px' }}>
          <button
            className="catalog-btn"
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            style={{ fontSize: '13px' }}
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            className="catalog-btn catalog-btn--primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || isMrpInvalid || isDealPriceInvalid || isDurationInvalid}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: isSaving ? '#94a3b8' : '#1268a5',
              borderColor: '#1268a5',
              color: '#ffffff'
            }}
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            {isSaving ? 'Saving Offer...' : isEdit ? 'Update Offer' : 'Save & Publish Offer'}
          </button>
        </div>
      </header>

      {/* Backend API Warning Banner if API fails */}
      {apiError && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991b1b',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadMasterData}
            style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Retry API Load
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.65fr) minmax(320px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* LEFT COLUMN: BUILDER FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 1. DEAL TYPE & CASCADING PRODUCT SELECTION */}
          <section className="catalog-card" style={{ padding: '22px' }}>
            <div className="catalog-card__header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={16} color="#1268a5" /> Deal Type &amp; Product Selection
                </h2>
                <p className="catalog-card__subtitle" style={{ fontSize: '12px', marginTop: '2px' }}>
                  Select the promotion deal type and link a catalog product to auto-populate offer details.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Deal Type Dropdown */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Deal Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.dealType}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  {DEAL_TYPE_OPTIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Cascading Category -> Subcategory -> Product Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* Category Dropdown */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    1. Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={handleCategoryChange}
                    disabled={isLoadingData}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: isLoadingData ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <option value="">-- {isLoadingData ? 'Loading Categories...' : 'Select Category'} --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {!isLoadingData && categories.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      No categories found in API.
                    </span>
                  )}
                </div>

                {/* Subcategory Dropdown */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    2. Subcategory <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.subcategoryId}
                    onChange={handleSubcategoryChange}
                    disabled={!formData.categoryId || isLoadingData}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: (!formData.categoryId || isLoadingData) ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <option value="">
                      {!formData.categoryId ? '-- Select Category First --' : '-- Select Subcategory --'}
                    </option>
                    {filteredSubcategories.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Selection with Filter Input */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    3. Select Product from Catalog <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {products.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {filteredProducts.length} product(s) available
                    </span>
                  )}
                </div>

                {/* Filter / Search input */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search product by name, SKU, or brand..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                </div>

                {/* Products Dropdown */}
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  disabled={isLoadingData}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: isLoadingData ? '#f8fafc' : '#ffffff',
                    fontWeight: formData.productId ? 600 : 400
                  }}
                >
                  <option value="">-- Choose Product to Create Offer --</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title} {p.sku ? `[${p.sku}]` : ''} {p.price ? `- ₹${Number(p.price).toLocaleString('en-IN')}` : ''}
                    </option>
                  ))}
                </select>
                {filteredProducts.length === 0 && !isLoadingData && (
                  <span style={{ fontSize: '11px', color: '#e11d48', marginTop: '4px', display: 'block' }}>
                    No products found matching the selected criteria.
                  </span>
                )}
              </div>

            </div>
          </section>

          {/* 2. SELECTED PRODUCT PREVIEW CARD */}
          {selectedProduct && (
            <section className="catalog-card" style={{ padding: '18px', backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <img
                  src={selectedProduct.image || selectedProduct.imageUrl || '/honeywell-products-logo.png'}
                  alt={selectedProduct.name}
                  style={{
                    width: '70px',
                    height: '70px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '4px'
                  }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/honeywell-products-logo.png'; }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#1268a5', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                      {selectedProduct.brand || 'HONEYWELL'}
                    </span>
                    {selectedProduct.sku && (
                      <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: Number(selectedProduct.stock) > 0 ? '#dcfce7' : '#fee2e2',
                      color: Number(selectedProduct.stock) > 0 ? '#15803d' : '#b91c1c'
                    }}>
                      {Number(selectedProduct.stock) > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                    {selectedProduct.name || selectedProduct.title}
                  </h4>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#475569' }}>
                    <span>MRP: <strong>₹{Number(selectedProduct.mrp || selectedProduct.price || 0).toLocaleString('en-IN')}</strong></span>
                    <span>Selling: <strong style={{ color: '#1268a5' }}>₹{Number(selectedProduct.price || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. OFFER INFORMATION CARD */}
          <section className="catalog-card" style={{ padding: '22px' }}>
            <div className="catalog-card__header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} color="#1268a5" /> Offer Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Offer Title */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Offer Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 25% Off Honeywell Solar Kit Deal"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Promotional Badge / Tag */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Promotional Badge / Tag
                </label>
                <input
                  type="text"
                  value={formData.badgeTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, badgeTag: e.target.value }))}
                  placeholder="e.g. 25% OFF, SPECIAL PRICE, FESTIVAL OFFER"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, color: '#1268a5' }}
                />

                {/* Quick Badge Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Quick Suggestions:</span>
                  {BADGE_SUGGESTIONS.map(badge => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, badgeTag: badge }))}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: formData.badgeTag === badge ? '#1268a5' : '#f8fafc',
                        color: formData.badgeTag === badge ? '#ffffff' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Description / Highlights */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Description / Highlights
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe promotion terms, highlights or features..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

            </div>
          </section>

          {/* 4. PRICING & DISCOUNT CALCULATOR CARD */}
          <section className="catalog-card" style={{ padding: '22px' }}>
            <div className="catalog-card__header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} color="#1268a5" /> Pricing &amp; Discount
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Original MRP */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Original MRP (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => handlePricingChange('originalPrice', e.target.value)}
                    placeholder="e.g. 11999"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isMrpInvalid ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '13px'
                    }}
                  />
                  {isMrpInvalid && (
                    <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      MRP must be greater than 0.
                    </span>
                  )}
                </div>

                {/* Discount Type */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Discount Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handlePricingChange('discountType', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat Amount">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Discount Value */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Discount Value ({formData.discountType === 'Percentage' ? '%' : '₹'}) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handlePricingChange('discountValue', e.target.value)}
                    placeholder={formData.discountType === 'Percentage' ? 'e.g. 25' : 'e.g. 3000'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isDiscountInvalid ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '13px'
                    }}
                  />
                  {isDiscountInvalid && (
                    <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {formData.discountType === 'Percentage' ? 'Must be between 1 and 100%' : 'Must be greater than 0 and less than MRP.'}
                    </span>
                  )}
                </div>

                {/* Deal / Offer Price */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Deal / Offer Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.dealPrice}
                    onChange={(e) => handlePricingChange('dealPrice', e.target.value)}
                    placeholder="e.g. 8999"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isDealPriceInvalid ? '#ef4444' : '#1268a5'}`,
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#1268a5'
                    }}
                  />
                  {isDealPriceInvalid && (
                    <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      Offer price must be greater than 0 and less than MRP.
                    </span>
                  )}
                </div>
              </div>

              {/* SAVINGS SUMMARY WIDGET */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  SAVINGS SUMMARY
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Original MRP</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', textDecoration: 'line-through' }}>
                      ₹{mrpNum.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Discount</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                      {calculatedSavingsPct}% OFF
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Customer Saves</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                      ₹{youSaveAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Final Offer Price</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#1268a5' }}>
                      ₹{dealPriceNum.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* 5. CAMPAIGN DURATION & DISPLAY SETTINGS (2 Grid Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Campaign Duration Card */}
            <section className="catalog-card" style={{ padding: '20px' }}>
              <div className="catalog-card__header" style={{ marginBottom: '14px', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#1268a5" /> Campaign Duration
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Start Date &amp; Time
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      style={{ flex: 2, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      style={{ flex: 1, padding: '8px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expiry Date &amp; Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                      style={{
                        flex: 2,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isDurationInvalid ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="time"
                      value={formData.expiryTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryTime: e.target.value }))}
                      style={{ flex: 1, padding: '8px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  {isDurationInvalid && (
                    <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      Expiry Date/Time must be later than Start Date/Time.
                    </span>
                  )}
                </div>

              </div>
            </section>

            {/* Website Display Settings Card */}
            <section className="catalog-card" style={{ padding: '20px' }}>
              <div className="catalog-card__header" style={{ marginBottom: '14px', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} color="#1268a5" /> Display Settings
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Display Order Sequence
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                    placeholder="1"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '15px', height: '15px', accentColor: '#1268a5' }}
                    />
                    Active (Visible on Website)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      style={{ width: '15px', height: '15px', accentColor: '#1268a5' }}
                    />
                    Featured Deal (Highlight on Homepage)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={formData.showCountdownTimer}
                      onChange={(e) => setFormData(prev => ({ ...prev, showCountdownTimer: e.target.checked }))}
                      style={{ width: '15px', height: '15px', accentColor: '#1268a5' }}
                    />
                    Show Live Countdown Timer
                  </label>
                </div>

              </div>
            </section>

          </div>

          {/* 6. OFFER IMAGE / BANNER CARD */}
          <section className="catalog-card" style={{ padding: '22px' }}>
            <div className="catalog-card__header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} color="#1268a5" /> Offer Image / Banner
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Radio Selector */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageSource"
                    value="product"
                    checked={formData.imageSource === 'product'}
                    onChange={() => setFormData(prev => ({ ...prev, imageSource: 'product' }))}
                    style={{ accentColor: '#1268a5' }}
                  />
                  Use Product Primary Image
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageSource"
                    value="upload"
                    checked={formData.imageSource === 'upload'}
                    onChange={() => setFormData(prev => ({ ...prev, imageSource: 'upload' }))}
                    style={{ accentColor: '#1268a5' }}
                  />
                  Upload Custom Offer Banner
                </label>
              </div>

              {/* Custom Image Upload Field if Upload selected */}
              {formData.imageSource === 'upload' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Paste banner URL or upload image file..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <label style={{
                    padding: '9px 16px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    whiteSpace: 'nowrap'
                  }}>
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {/* Image Preview Thumbnail */}
              <div style={{
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}>
                <img
                  src={
                    formData.imageSource === 'product' && selectedProduct
                      ? (selectedProduct.image || selectedProduct.imageUrl || '/honeywell-products-logo.png')
                      : (formData.imageUrl || '/honeywell-products-logo.png')
                  }
                  alt="Offer Banner Preview"
                  style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/honeywell-products-logo.png'; }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '6px' }}>
                  {formData.imageSource === 'product' ? 'Using Selected Product Image' : 'Custom Banner Preview'}
                </span>
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: REAL-TIME STICKY LIVE OFFER PREVIEW */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <section className="catalog-card" style={{ padding: '22px', border: '2px solid #1268a5', boxShadow: '0 10px 25px -5px rgba(18, 104, 165, 0.12)' }}>

            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#1268a5', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> LIVE OFFER PREVIEW
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '999px' }}>
                Customer View
              </span>
            </div>

            {/* PREVIEW CARD UI */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>

              {/* Floating Promotional Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '4px',
                zIndex: 2,
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
              }}>
                {formData.badgeTag || 'SPECIAL OFFER'}
              </div>

              {/* Product Image Container */}
              <div style={{
                height: '190px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                position: 'relative',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <img
                  src={
                    formData.imageSource === 'product' && selectedProduct
                      ? (selectedProduct.image || selectedProduct.imageUrl || '/honeywell-products-logo.png')
                      : (formData.imageUrl || '/honeywell-products-logo.png')
                  }
                  alt={formData.title || 'Product Offer'}
                  style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/honeywell-products-logo.png'; }}
                />
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Deal Category Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase' }}>
                    {categories.find(c => String(c.id) === String(formData.categoryId))?.name || 'NETWORK CAMERAS'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                    {formData.dealType}
                  </span>
                </div>

                {/* Offer / Product Title */}
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: '1.4',
                  minHeight: '40px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {formData.title || selectedProduct?.name || 'Honeywell Product Deal Offer Title'}
                </h3>

                {/* Strikethrough MRP & Deal Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                  {mrpNum > 0 && (
                    <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 500 }}>
                      ₹{mrpNum.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1268a5' }}>
                    ₹{dealPriceNum > 0 ? dealPriceNum.toLocaleString('en-IN') : '0'}
                  </span>
                </div>

                {/* You Save Tag */}
                {youSaveAmount > 0 && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    width: 'fit-content'
                  }}>
                    You Save ₹{youSaveAmount.toLocaleString('en-IN')} ({calculatedSavingsPct}% OFF)
                  </div>
                )}

                {/* Expiry Countdown Preview */}
                {formData.endDate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#dc2626',
                    fontWeight: 600,
                    backgroundColor: '#fef2f2',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginTop: '2px'
                  }}>
                    <Clock size={13} />
                    <span>Ends: {formData.endDate} ({formData.expiryTime || '23:59'})</span>
                  </div>
                )}

                {/* View Deal Button */}
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '6px',
                    backgroundColor: '#1268a5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} /> View Deal
                </button>

              </div>

            </div>

            {/* Note about real-time update */}
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textAlign: 'center', marginTop: '12px' }}>
              Updates dynamically in real time as you edit form parameters.
            </span>

          </section>
        </div>

      </div>
    </div>
  );
}
