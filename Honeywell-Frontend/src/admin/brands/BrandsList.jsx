
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Image as ImageIcon,
  Tag,
  Edit3,
  Trash2
} from 'lucide-react';

import { getApiDomain } from '../../utils/apiConfig';
import './brands.css';
import { Toast } from '../components/Toast';

// ============================================================
// API CONFIGURATION
// ============================================================

const API_DOMAIN = getApiDomain();
const API_BASE = `${API_DOMAIN}/api/Brand`;

const API_ITEM = (id) =>
  `${API_BASE}/${encodeURIComponent(id)}`;

const API_HEADERS = {
  'ngrok-skip-browser-warning': 'true'
};

// ============================================================
// NORMALIZE BRAND RESPONSE
// ============================================================

const normalizeBrand = (brand) => {
  if (!brand) return {};

  return {
    ...brand,

    id:
      brand.id !== undefined && brand.id !== null
        ? String(brand.id)
        : '',

    name:
      brand.name ||
      brand.Name ||
      brand.brandName ||
      brand.BrandName ||
      '',

    description:
      brand.description ||
      brand.Description ||
      '',

    logo:
      brand.LogoImage ||
      brand.logoImage ||
      brand.logo ||
      brand.logoUrl ||
      brand.imageUrl ||
      brand.image ||
      brand.logoURL ||
      brand.ImageUrl ||
      brand.Logo ||
      brand.LogoUrl ||
      ''
  };
};

// ============================================================
// LOGO SOURCE
// ============================================================

export const getLogoSrc = (logo) => {
  if (!logo) return '';

  if (logo.startsWith('data:')) {
    return logo;
  }

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  // Server file/path
  if (
    logo.startsWith('/') ||
    logo.includes('.') ||
    logo.includes('/')
  ) {
    const path = logo.startsWith('/')
      ? logo
      : `/${logo}`;

    return `${API_DOMAIN}${path}`;
  }

  // Raw Base64
  return `data:image/png;base64,${logo}`;
};

// ============================================================
// BRAND LOGO COMPONENT
// ============================================================

export const BrandLogo = ({ logo, name }) => {
  const [error, setError] = useState(false);

  const src = getLogoSrc(logo);

  if (!logo || error || !src) {
    return (
      <div
        className="brand-card__logo-placeholder"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8'
        }}
      >
        <ImageIcon size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'Brand'}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
      onError={() => setError(true)}
    />
  );
};

// ============================================================
// API ERROR PARSER
// ============================================================

const parseApiError = async (response) => {
  try {
    const text = await response.text();

    if (!text) {
      return `Request failed with status ${response.status}`;
    }

    try {
      const data = JSON.parse(text);

      return (
        data?.Message ||
        data?.message ||
        data?.error ||
        data?.title ||
        text
      );
    } catch {
      return text;
    }
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

// ============================================================
// GET ALL BRANDS
// GET /api/Brand OR GET /api/Catalog/brands
// ============================================================

export const fetchBrands = async () => {
  const API_BASE_BRAND = `${API_DOMAIN}/api/Brand`;
  const API_BASE_CATALOG = `${API_DOMAIN}/api/Catalog/brands`;

  try {
    const response = await fetch(API_BASE_BRAND, {
      method: 'GET',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const brands = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.results)
              ? data.results
              : [];
      return brands.map(normalizeBrand);
    }
  } catch (e) {
    console.warn("GET /api/Brand failed, retrying with /api/Catalog/brands:", e);
  }

  // Fallback to GET /api/Catalog/brands
  const response2 = await fetch(API_BASE_CATALOG, {
    method: 'GET',
    headers: {
      ...API_HEADERS,
      'Content-Type': 'application/json'
    }
  });

  if (!response2.ok) {
    const errorMessage = await parseApiError(response2);
    throw new Error(errorMessage);
  }

  const data2 = await response2.json();
  const brands2 = Array.isArray(data2)
    ? data2
    : Array.isArray(data2?.data)
      ? data2.data
      : Array.isArray(data2?.items)
        ? data2.items
        : Array.isArray(data2?.results)
          ? data2.results
          : [];

  return brands2.map(normalizeBrand);
};

// ============================================================
// DELETE BRAND
// DELETE /api/Brand/{id} OR DELETE /api/Catalog/brands/{id}
// ============================================================

export const deleteBrand = async (id) => {
  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ''
  ) {
    throw new Error('Brand ID is required.');
  }

  const urlBrand = `${API_DOMAIN}/api/Brand/${encodeURIComponent(id)}`;
  const urlCatalog = `${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(urlBrand, {
      method: 'DELETE',
      headers: API_HEADERS
    });

    if (response.ok) {
      if (response.status === 204) return true;
      try { await response.json(); } catch {}
      return true;
    }
  } catch (e) {
    console.warn("DELETE /api/Brand/{id} failed, retrying with /api/Catalog/brands/{id}:", e);
  }

  // Fallback to DELETE /api/Catalog/brands/{id}
  const response2 = await fetch(urlCatalog, {
    method: 'DELETE',
    headers: API_HEADERS
  });

  if (!response2.ok) {
    const errorMessage = await parseApiError(response2);
    throw new Error(errorMessage);
  }

  if (response2.status === 204) return true;
  try { await response2.json(); } catch {}
  return true;
};

// ============================================================
// BRANDS LIST
// ============================================================

const BrandsList = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // ==========================================================
  // LOAD BRANDS
  // ==========================================================

  useEffect(() => {
    let isMounted = true;

    const loadBrands = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await fetchBrands();

        if (isMounted) {
          setBrands(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.message ||
              'Failed to load brands.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the brand "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBrand(id);

      setBrands((previousBrands) =>
        previousBrands.filter(
          (brand) =>
            String(brand.id) !== String(id)
        )
      );

      /*
       * Prevent current page from becoming empty
       * after deleting the last item on that page.
       */
      setCurrentPage((page) => {
        const remainingItems =
          brands.length - 1;

        const remainingPages =
          Math.max(
            1,
            Math.ceil(
              remainingItems /
                itemsPerPage
            )
          );

        return Math.min(
          page,
          remainingPages
        );
      });

      setToastMessage(
        `Brand "${name}" deleted successfully.`
      );

      setToastType('success');
    } catch (err) {
      setToastMessage(
        `Failed to delete brand: ${
          err?.message ||
          'Unknown error'
        }`
      );

      setToastType('error');
    }
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (id) => {
    navigate(
      `/admin/brands/form?id=${encodeURIComponent(id)}`
    );
  };

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredBrands = useMemo(() => {
    const query =
      searchTerm
        .toLowerCase()
        .trim();

    return brands
      .filter((brand) => {
        const brandName =
          String(
            brand.name || ''
          ).toLowerCase();

        const brandId =
          String(
            brand.id || ''
          ).toLowerCase();

        return (
          brandName.includes(query) ||
          brandId.includes(query)
        );
      })
      .sort((a, b) => {
        /*
         * Newest/highest numeric ID first.
         *
         * For IDs such as BRD-001,
         * extract the number.
         */
        const aMatch =
          String(a.id || '').match(
            /\d+/
          );

        const bMatch =
          String(b.id || '').match(
            /\d+/
          );

        const aNumber = aMatch
          ? Number(aMatch[0])
          : 0;

        const bNumber = bMatch
          ? Number(bMatch[0])
          : 0;

        return bNumber - aNumber;
      });
  }, [brands, searchTerm]);

  // ==========================================================
  // RESET PAGE WHEN SEARCH CHANGES
  // ==========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.ceil(
    filteredBrands.length /
      itemsPerPage
  );

  const pagedBrands =
    filteredBrands.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="brands-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}
    >
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() =>
            setToastMessage('')
          }
        />
      )}

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className="brands-header"
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          width: '100%',
          backgroundColor:
            '#ffffff',
          border:
            '1px solid #e2e8f0',
          borderLeft: 'none',
          borderRadius: '20px',
          padding: '24px 32px',
          boxShadow: 'none'
        }}
      >
        <div>
          <span
            className="catalog-kicker"
            style={{
              fontSize: '11px',
              textTransform:
                'uppercase',
              color: '#1268a5',
              fontWeight: 800,
              display: 'block',
              letterSpacing:
                '0.05em',
              marginBottom: '6px'
            }}
          >
            CATALOG SETTINGS
          </span>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              letterSpacing:
                '-0.02em'
            }}
          >
            Brands Directory
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: '#64748b',
              margin:
                '4px 0 0 0'
            }}
          >
            Manage manufacturers
            and brands assigned to
            products.
          </p>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'flex-end'
          }}
        >
          <Link
            to="/admin/brands/form"
            style={{
              backgroundColor:
                '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding:
                '12px 24px',
              borderRadius: '12px',
              textDecoration:
                'none',
              display:
                'inline-flex',
              alignItems:
                'center',
              gap: '6px',
              whiteSpace:
                'nowrap',
              boxShadow:
                '0 1px 3px rgba(37,99,235,0.25)'
            }}
          >
            <Plus size={16} />
            Add Brand
          </Link>
        </div>
      </div>

      {/* ======================================================
          SEARCH TOOLBAR
          ====================================================== */}

      <div
        className="brands-toolbar"
        style={{
          padding:
            '16px 28px',
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          backgroundColor:
            '#ffffff',
          border:
            '1px solid #e2e8f0',
          borderRadius: '20px'
        }}
      >
        <div
          className="brands-search"
          style={{
            flex:
              '0 1 380px',
            position:
              'relative',
            display: 'flex',
            alignItems:
              'center'
          }}
        >
          <Search
            size={18}
            style={{
              position:
                'absolute',
              left: '14px',
              color: '#94a3b8'
            }}
          />

          <input
            type="text"
            placeholder="Search brands by name or ID..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            style={{
              width: '100%',
              padding:
                '11px 14px 11px 40px',
              fontSize: '13px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '14px',
              outline: 'none',
              backgroundColor:
                '#f8fafc',
              color: '#0f172a'
            }}
          />
        </div>

        <span
          className="brands-count"
          style={{
            fontSize: '13px',
            color: '#475569',
            fontWeight: 600,
            backgroundColor:
              '#f1f5f9',
            padding:
              '8px 20px',
            borderRadius:
              '999px'
          }}
        >
          {filteredBrands.length}{' '}
          {filteredBrands.length ===
          1
            ? 'brand'
            : 'brands'}
        </span>
      </div>

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          Loading brands...
        </div>
      )}

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor:
              '#fef2f2',
            border:
              '1px solid #f87171',
            color: '#ef4444',
            borderRadius: '8px'
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {!loading &&
        !error &&
        filteredBrands.length ===
          0 && (
          <div
            className="brands-empty-state"
            style={{
              padding:
                '48px 24px',
              textAlign: 'center',
              backgroundColor:
                '#ffffff',
              border:
                '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          >
            <Tag
              size={40}
              style={{
                color: '#94a3b8',
                margin:
                  '0 auto 12px',
                display: 'block'
              }}
            />

            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#334155'
              }}
            >
              No brands found
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: '#64748b'
              }}
            >
              {searchTerm
                ? "We couldn't find any brands matching your search."
                : 'There are no brands registered in the catalog yet.'}
            </p>

            {!searchTerm && (
              <Link
                to="/admin/brands/form"
                style={{
                  marginTop: '12px',
                  display:
                    'inline-flex',
                  backgroundColor:
                    '#2563eb',
                  color: '#ffffff',
                  padding:
                    '8px 16px',
                  borderRadius:
                    '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration:
                    'none'
                }}
              >
                <Plus
                  size={16}
                  style={{
                    marginRight:
                      '4px'
                  }}
                />
                Add Your First Brand
              </Link>
            )}
          </div>
        )}

      {/* ======================================================
          BRAND GRID
          ====================================================== */}

      {!loading &&
        !error &&
        filteredBrands.length >
          0 && (
          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '20px'
            }}
          >
            <div
              className="brands-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px'
              }}
            >
              {pagedBrands.map(
                (brand) => (
                  <div
                    className="brand-card"
                    key={brand.id}
                    style={{
                      border:
                        '1px solid #e2e8f0',
                      borderRadius:
                        '12px',
                      overflow:
                        'hidden',
                      backgroundColor:
                        '#ffffff',
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      height:
                        '175px',
                      transition:
                        'all 0.2s ease',
                      boxShadow:
                        '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div
                      className="brand-card__content"
                      style={{
                        padding:
                          '16px 12px 12px',
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        alignItems:
                          'center',
                        textAlign:
                          'center',
                        flex: 1,
                        justifyContent:
                          'center'
                      }}
                    >
                      <div
                        className="brand-card__logo-frame"
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius:
                            '50%',
                          backgroundColor:
                            '#f8fafc',
                          border:
                            '1px solid #f1f5f9',
                          marginBottom:
                            '10px',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          overflow:
                            'hidden'
                        }}
                      >
                        <BrandLogo
                          logo={
                            brand.logo
                          }
                          name={
                            brand.name
                          }
                        />
                      </div>

                      <span
                        className="brand-card__id"
                        style={{
                          fontSize:
                            '11px',
                          color:
                            '#64748b',
                          fontWeight:
                            600,
                          backgroundColor:
                            '#f1f5f9',
                          padding:
                            '2px 10px',
                          borderRadius:
                            '999px',
                          marginBottom:
                            '6px'
                        }}
                      >
                        {brand.id}
                      </span>

                      <h3
                        className="brand-card__name"
                        style={{
                          fontSize:
                            '13px',
                          fontWeight:
                            700,
                          color:
                            '#0f172a',
                          margin: 0,
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                          whiteSpace:
                            'nowrap',
                          width:
                            '100%'
                        }}
                      >
                        {brand.name}
                      </h3>
                    </div>

                    {/* ACTIONS */}

                    <div
                      className="brand-card__actions"
                      style={{
                        borderTop:
                          '1px solid #f1f5f9',
                        padding:
                          '8px 16px',
                        display:
                          'flex',
                        justifyContent:
                          'center',
                        gap: '24px',
                        alignItems:
                          'center',
                        backgroundColor:
                          '#f8fafc'
                      }}
                    >
                      <button
                        onClick={() =>
                          handleEdit(
                            brand.id
                          )
                        }
                        title="Edit Brand"
                        style={{
                          border:
                            'none',
                          background:
                            'transparent',
                          color:
                            '#64748b',
                          cursor:
                            'pointer',
                          padding: '2px'
                        }}
                      >
                        <Edit3
                          size={15}
                        />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            brand.id,
                            brand.name
                          )
                        }
                        title="Delete Brand"
                        style={{
                          border:
                            'none',
                          background:
                            'transparent',
                          color:
                            '#64748b',
                          cursor:
                            'pointer',
                          padding: '2px'
                        }}
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* ==================================================
                PAGINATION
                ================================================== */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                padding:
                  '12px 16px',
                backgroundColor:
                  '#ffffff',
                border:
                  '1px solid #e2e8f0',
                borderRadius:
                  '12px'
              }}
            >
              <span
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#64748b',
                  fontWeight:
                    500
                }}
              >
                Showing{' '}
                {filteredBrands.length ===
                0
                  ? 0
                  : (currentPage -
                      1) *
                      itemsPerPage +
                    1}
                –
                {Math.min(
                  currentPage *
                    itemsPerPage,
                  filteredBrands.length
                )}{' '}
                of{' '}
                {
                  filteredBrands.length
                }{' '}
                entries
              </span>

              <div
                style={{
                  display:
                    'flex',
                  gap: '6px',
                  alignItems:
                    'center'
                }}
              >
                {Array.from(
                  {
                    length:
                      totalPages
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() =>
                      setCurrentPage(
                        page
                      )
                    }
                    style={{
                      padding:
                        '6px 12px',
                      fontSize:
                        '12px',
                      fontWeight:
                        700,
                      borderRadius:
                        '6px',
                      border:
                        page ===
                        currentPage
                          ? 'none'
                          : '1px solid #e2e8f0',
                      backgroundColor:
                        page ===
                        currentPage
                          ? '#2563eb'
                          : '#ffffff',
                      color:
                        page ===
                        currentPage
                          ? '#ffffff'
                          : '#475569',
                      cursor:
                        'pointer'
                    }}
                  >
                    {page}
                  </button>
                ))}

                {currentPage <
                  totalPages && (
                  <button
                    onClick={() =>
                      setCurrentPage(
                        (previous) =>
                          previous + 1
                      )
                    }
                    style={{
                      padding:
                        '6px 12px',
                      fontSize:
                        '12px',
                      fontWeight:
                        600,
                      borderRadius:
                        '6px',
                      border:
                        '1px solid #e2e8f0',
                      backgroundColor:
                        '#ffffff',
                      color:
                        '#475569',
                      cursor:
                        'pointer'
                    }}
                  >
                    Next &gt;
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default BrandsList;
