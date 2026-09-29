import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Check, Filter, Plus, Search, X, AlertTriangle } from 'lucide-react';
import { getCategoryName, getSubcategoryName } from './catalogStore';
import { deleteProduct as deleteProductApi, fetchCategories, fetchProducts, fetchSubcategories, searchProducts } from './productsApi';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import './adminModule.css';

const Link = RouterLink;

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const parsePriceNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const getDiscountLabel = (product) => {
  if (!product) return '—';

  const mrp = parsePriceNumber(product.mrp);
  const price = parsePriceNumber(product.price);
  const discountVal = parsePriceNumber(product.discountValue);

  if (product.discountType === 'percentage' && discountVal > 0 && discountVal <= 99) {
    const formatted = discountVal % 1 === 0 ? discountVal.toFixed(0) : discountVal.toFixed(1);
    return `${formatted}% off`;
  }

  if (product.discountType === 'fixed' && discountVal > 0) {
    return `₹${discountVal.toLocaleString('en-IN')} off`;
  }

  const effectiveMrp = mrp > 0 ? mrp : price;
  if (effectiveMrp <= 0 || price <= 0 || effectiveMrp <= price) return '—';

  const rawPercentage = ((effectiveMrp - price) / effectiveMrp) * 100;
  if (rawPercentage <= 0 || isNaN(rawPercentage)) return '—';

  if (rawPercentage > 99) {
    const savedAmount = effectiveMrp - price;
    return `₹${savedAmount.toLocaleString('en-IN')} off`;
  }

  const formattedPct = rawPercentage % 1 === 0 ? rawPercentage.toFixed(0) : rawPercentage.toFixed(1);
  return `${formattedPct}% off`;
};

const getStatusBadgeStyle = (status) => {
  if (status === 'In Stock') {
    return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
  }
  if (status === 'Low Stock') {
    return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' };
  }
  return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
};

const ProductsList = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadAll = useCallback(async (isMounted) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [cats, subcats] = await Promise.all([fetchCategories(), fetchSubcategories()]);
      if (!isMounted) return;
      setCategories(cats);
      setSubcategories(subcats);
      const apiProducts = await fetchProducts(cats, subcats);
      if (isMounted) setProducts(apiProducts);
    } catch (error) {
      if (isMounted) setErrorMessage(error.message || 'Unable to load products.');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchTerm.trim()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(searchTerm.trim(), categories, subcategories);
        if (!cancelled) setProducts(results);
      } catch (err) {
        if (!cancelled) setErrorMessage(err.message || 'Search failed.');
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, categories, subcategories]);

  // When search is cleared, reload the full list
  useEffect(() => {
    if (searchTerm.trim()) return;
    let isMounted = true;
    loadAll(isMounted);
    return () => { isMounted = false; };
  }, [searchTerm, loadAll]);

  // Client-side filter by category + status
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategoryId === 'All' || String(product.categoryId) === String(selectedCategoryId);
        const matchesStatus =
          selectedStatus === 'All' || product.status === selectedStatus;
        return matchesCategory && matchesStatus;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [products, selectedCategoryId, selectedStatus]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryId, selectedStatus]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setIsDeletingId(id);
    setErrorMessage('');
    try {
      await deleteProductApi(id);
      setProducts((current) => current.filter((p) => String(p.id) !== String(id)));
    } catch (error) {
      console.error('Delete product failed:', error);
      setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to delete product.');
    } finally {
      setIsDeletingId('');
    }
  };

  const busy = isLoading || isSearching;

  return (
    <div className="catalog-page" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      {/* ── HEADER ── */}
      <section
        className="catalog-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #1d4ed8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '20px',
        }}
      >
        <div className="catalog-title-wrap">
          <span
            className="catalog-kicker"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#1d4ed8',
              fontWeight: 800,
              display: 'block',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            STEP 3 OF 3
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Products
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Products are created after category and subcategory setup, keeping inventory organized for filters and reports.
          </p>
        </div>

        <div className="catalog-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexWrap: 'nowrap' }}>
          <Link
            to="/admin/catalog/subcategories"
            style={{
              backgroundColor: '#2d8a54',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              border: 'none',
            }}
          >
            View Subcategories
          </Link>
          <Link
            to="/admin/catalog/products-form"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
            }}
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </section>

      {/* ── CARD & TABLE ── */}
      <section
        className="catalog-card"
        style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          padding: 0,
        }}
      >
        {errorMessage && (
          <div className="catalog-alert catalog-alert--warning" style={{ margin: '16px' }}>
            {errorMessage}
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="catalog-filterbar"
          style={{
            padding: '12px 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="catalog-search" style={{ maxWidth: '320px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search product name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 10px 6px 32px', fontSize: '13px' }}
            />
          </div>

          <div className="catalog-inline-actions" style={{ gap: '12px', display: 'flex', alignItems: 'center' }}>
            {/* Category Filter */}
            <label className="catalog-filter" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px' }}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Status Filter */}
            <label className="catalog-filter" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px' }}
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>

            <span className="catalog-count" style={{ fontSize: '13px' }}>
              {busy ? '…' : `${filteredProducts.length} products`}
            </span>
          </div>
        </div>

        {/* Formal Table */}
        <div className="catalog-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="catalog-table" style={{ fontSize: '13px', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 16px', width: '60px' }}>ID</th>
                <th style={{ padding: '10px 16px' }}>Product Name</th>
                <th style={{ padding: '10px 16px' }}>SKU</th>
                <th style={{ padding: '10px 16px' }}>Category</th>
                <th style={{ padding: '10px 16px' }}>Subcategory</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Discount</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
                <th className="catalog-center-cell" style={{ padding: '10px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {busy && (
                <tr>
                  <td colSpan="10" className="catalog-center-cell" style={{ padding: '32px', color: '#64748b' }}>
                    {isLoading ? 'Loading products...' : 'Searching products...'}
                  </td>
                </tr>
              )}

              {!busy &&
                currentPageProducts.map((product) => {
                  const priceNum = parsePriceNumber(product.price);
                  const mrpNum = parsePriceNumber(product.mrp);
                  const isDiscounted = mrpNum > priceNum;
                  const discountStr = getDiscountLabel(product);
                  const statusStyle = getStatusBadgeStyle(product.status);

                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* ID */}
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#64748b' }}>
                        {product.id}
                      </td>

                      {/* Product Name & Details */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Brand: {product.brand?.trim() || 'Honeywell'}
                          {product.specificationsObj?.weight ? ` · ${product.specificationsObj.weight}` : ''}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="catalog-path" style={{ padding: '10px 16px', color: '#334155', fontFamily: 'monospace', fontSize: '12px' }}>
                        {product.sku || '—'}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '10px 16px', color: '#334155' }}>
                        {getCategoryName(categories, product.categoryId) || '—'}
                      </td>

                      {/* Subcategory */}
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>
                        {getSubcategoryName(subcategories, product.subcategoryId) || '—'}
                      </td>

                      {/* Price / MRP */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>
                          {formatCurrency(priceNum)}
                        </div>
                        {isDiscounted && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            MRP {formatCurrency(mrpNum)}
                          </div>
                        )}
                      </td>

                      {/* Discount */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {discountStr !== '—' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#166534',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {discountStr}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: '#334155' }}>
                        {product.stock || 0}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            ...statusStyle,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.status === 'In Stock' && <Check size={11} />}
                          {product.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="catalog-center-cell" style={{ padding: '10px 16px' }}>
                        <div className="catalog-inline-actions">
                          <AnimatedEditButton
                            to={`/admin/catalog/products-form?id=${product.id}`}
                            title="Edit product"
                          />
                          <OutlookDeleteButton
                            onClick={() => handleDelete(product.id)}
                            disabled={isDeletingId === product.id}
                            title="Delete product"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!busy && !filteredProducts.length && (
                <tr>
                  <td colSpan="10" className="catalog-center-cell" style={{ padding: '32px', color: '#64748b' }}>
                    No products match your search or filters.
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
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default ProductsList;
