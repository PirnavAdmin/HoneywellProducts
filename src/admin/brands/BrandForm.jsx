import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Save,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import './brands.css';
import { Toast } from '../components/Toast';

/* =========================================================
   BRAND API CONFIGURATION
   ========================================================= */

const API_DOMAIN = getApiDomain();
const API_BASE = `${API_DOMAIN}/api/Brand`;

const API_ITEM = (id) =>
  `${API_BASE}/${encodeURIComponent(id)}`;

const API_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};

/* =========================================================
   NORMALIZE BRAND RESPONSE
   ========================================================= */

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
      '',
  };
};

/* =========================================================
   LOGO SOURCE RESOLVER
   ========================================================= */

export const getLogoSrc = (logo) => {
  if (!logo) return '';

  if (logo.startsWith('data:')) {
    return logo;
  }

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  /*
   * If API returns a file/path such as:
   * uploads/brands/logo.png
   * /uploads/brands/logo.png
   */
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

  /*
   * If API returns raw Base64
   */
  return `data:image/png;base64,${logo}`;
};

/* =========================================================
   BRAND LOGO COMPONENT
   ========================================================= */

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
        <ImageIcon size={24} />
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

/* =========================================================
   FETCH ALL BRANDS
   GET /api/Brand OR GET /api/Catalog/brands
   ========================================================= */

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

  // Fallback endpoint GET /api/Catalog/brands
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

/* =========================================================
   FETCH SINGLE BRAND
   GET /api/Brand/{id} OR GET /api/Catalog/brands/{id}
   ========================================================= */

export const fetchBrandById = async (id) => {
  if (!id) {
    throw new Error('Brand ID is required.');
  }

  const urlBrand = `${API_DOMAIN}/api/Brand/${encodeURIComponent(id)}`;
  const urlCatalog = `${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(urlBrand, {
      method: 'GET',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const brand = data?.data || data;
      return normalizeBrand(brand);
    }
  } catch (e) {
    console.warn("GET /api/Brand/{id} failed, retrying with /api/Catalog/brands/{id}:", e);
  }

  // Fallback endpoint GET /api/Catalog/brands/{id}
  const response2 = await fetch(urlCatalog, {
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
  const brand2 = data2?.data || data2;
  return normalizeBrand(brand2);
};

/* =========================================================
   BRAND NAME VALIDATION
   ========================================================= */

export const validateBrandName = (rawName) => {
  if (!rawName || !rawName.trim()) {
    return 'Brand Name is required.';
  }

  const name = rawName.trim();

  if (name.length < 2 || name.length > 50) {
    return 'Brand Name must be between 2 and 50 characters.';
  }

  if (!/[a-zA-Z]/.test(name)) {
    return 'Brand Name must contain valid letters.';
  }

  if (/(.)\1{3,}/.test(name)) {
    return 'Brand Name cannot contain repeated random characters.';
  }

  const mashPatterns =
    /(asdf|qwer|zxcv|hjkl|uiop|vbnm|wert|xcvb|erty|dfgh|cvbn|tyui|ghjk|bnm|swq|qwe|asd|zxc|qaz|wsx|edc|rfv|tgb|yhn|ujm)/i;

  if (mashPatterns.test(name)) {
    return 'Brand Name appears to be random keyboard typing.';
  }

  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(name)) {
    return 'Brand Name contains too many consecutive consonants.';
  }

  const cleanWord = name
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  const uniqueChars = new Set(cleanWord).size;

  if (
    cleanWord.length >= 6 &&
    uniqueChars <= cleanWord.length / 2
  ) {
    return 'Brand Name appears to contain invalid repetitive characters.';
  }

  const words = name.split(/\s+/);

  for (const word of words) {
    if (word.length > 5) {
      const vowels =
        (word.match(/[aeiouy]/gi) || []).length;

      if (vowels === 0) {
        return 'Brand Name words must contain vowels.';
      }

      const consonants =
        (word.match(/[bcdfghjklmnpqrstvwxz]/gi) || [])
          .length;

      if (consonants / vowels > 3.5) {
        return 'Brand Name contains invalid random characters.';
      }
    }
  }

  if (
    !/^[A-Za-z0-9][A-Za-z0-9\s&\-'./]{1,49}$/.test(
      name
    )
  ) {
    return "Brand Name contains invalid characters. Only letters, numbers, spaces, and standard punctuation (&, -, ', ., /) are allowed.";
  }

  return null;
};

/* =========================================================
   API ERROR PARSER
   ========================================================= */

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

/* =========================================================
   CREATE BRAND
   POST /api/Brand OR POST /api/Catalog/brands
   ========================================================= */

export const createBrand = async (brand) => {
  const formData = new FormData();

  formData.append('Id', brand.id);
  formData.append('Name', brand.name);
  formData.append(
    'Description',
    brand.description || ''
  );
  formData.append('IsActive', 'true');

  if (brand.logoFile) {
    formData.append('LogoFile', brand.logoFile);
  }

  const urlBrand = `${API_DOMAIN}/api/Brand`;
  const urlCatalog = `${API_DOMAIN}/api/Catalog/brands`;

  try {
    const response = await fetch(urlBrand, {
      method: 'POST',
      headers: API_HEADERS,
      body: formData
    });

    if (response.ok) {
      const text = await response.text();
      if (!text) return { success: true };
      try { return JSON.parse(text); } catch { return { success: true, message: text }; }
    }
  } catch (e) {
    console.warn("POST /api/Brand failed, retrying with /api/Catalog/brands:", e);
  }

  // Fallback to POST /api/Catalog/brands
  const response2 = await fetch(urlCatalog, {
    method: 'POST',
    headers: API_HEADERS,
    body: formData
  });

  if (!response2.ok) {
    const errorMessage = await parseApiError(response2);
    throw new Error(errorMessage);
  }

  const text2 = await response2.text();
  if (!text2) return { success: true };
  try { return JSON.parse(text2); } catch { return { success: true, message: text2 }; }
};

/* =========================================================
   UPDATE BRAND
   PUT /api/Brand/{id} OR PUT /api/Catalog/brands/{id}
   ========================================================= */

export const updateBrand = async (brand) => {
  if (!brand?.id) {
    throw new Error('Brand ID is required for update.');
  }

  const formData = new FormData();

  formData.append('Id', brand.id);
  formData.append('Name', brand.name);
  formData.append(
    'Description',
    brand.description || ''
  );
  formData.append('IsActive', 'true');

  if (brand.logoFile) {
    formData.append('LogoFile', brand.logoFile);
  }

  const urlBrand = `${API_DOMAIN}/api/Brand/${encodeURIComponent(brand.id)}`;
  const urlCatalog = `${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(brand.id)}`;

  try {
    const response = await fetch(urlBrand, {
      method: 'PUT',
      headers: API_HEADERS,
      body: formData
    });

    if (response.ok) {
      const text = await response.text();
      if (!text) return { success: true };
      try { return JSON.parse(text); } catch { return { success: true, message: text }; }
    }
  } catch (e) {
    console.warn("PUT /api/Brand/{id} failed, retrying with /api/Catalog/brands/{id}:", e);
  }

  // Fallback to PUT /api/Catalog/brands/{id}
  const response2 = await fetch(urlCatalog, {
    method: 'PUT',
    headers: API_HEADERS,
    body: formData
  });

  if (!response2.ok) {
    const errorMessage = await parseApiError(response2);
    throw new Error(errorMessage);
  }

  const text2 = await response2.text();
  if (!text2) return { success: true };
  try { return JSON.parse(text2); } catch { return { success: true, message: text2 }; }
};

/* =========================================================
   BRAND FORM
   ========================================================= */

const BrandForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const brandIdFromQuery = searchParams.get('id');
  const isEditing = Boolean(brandIdFromQuery);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nameErrorInline, setNameErrorInline] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [logo, setLogo] = useState('');
  const [logoFile, setLogoFile] =
    useState(null);

  const [toastMessage, setToastMessage] =
    useState('');

  const [toastType, setToastType] =
    useState('success');

  const [isSaving, setIsSaving] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  /* =======================================================
     LOAD BRAND DATA
     ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        /*
         * EDIT MODE
         *
         * GET /api/Brand/{id}
         */
        if (isEditing) {
          const existing =
            await fetchBrandById(
              brandIdFromQuery
            );

          if (!isMounted) return;

          if (!existing?.id) {
            throw new Error(
              'Brand not found.'
            );
          }

          setId(existing.id);
          setName(existing.name || '');
          setDescription(
            existing.description || ''
          );
          setLogo(existing.logo || '');
          setLogoFile(null);

          setNameErrorInline('');
        }

        /*
         * CREATE MODE
         *
         * GET /api/Brand
         *
         * Used only to determine the next
         * display/system ID used by the existing UI.
         */
        else {
          const brands =
            await fetchBrands();

          if (!isMounted) return;

          const nextNum =
            brands.reduce(
              (largest, brand) => {
                const match =
                  String(
                    brand.id || ''
                  ).match(/(\d+)/);

                if (match) {
                  const num = parseInt(
                    match[1],
                    10
                  );

                  return num > largest
                    ? num
                    : largest;
                }

                return largest;
              },
              0
            ) + 1;

          /*
           * Preserve the existing ID-generation
           * behavior.
           */
          const isNumericId =
            brands.length > 0 &&
            brands.every((brand) =>
              /^\d+$/.test(
                String(brand.id || '')
              )
            );

          if (isNumericId) {
            setId(String(nextNum));
          } else {
            setId(
              `BRD-${String(nextNum).padStart(
                3,
                '0'
              )}`
            );
          }

          setLogo('');
          setLogoFile(null);
        }
      } catch (error) {
        if (!isMounted) return;

        setToastMessage(
          error?.message ||
            'Failed to load brand details.'
        );

        setToastType('error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [isEditing, brandIdFromQuery]);

  /* =======================================================
     IMAGE CHANGE
     ======================================================= */

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const allowedExts = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.svg',
      '.gif'
    ];

    const fileName =
      file.name.toLowerCase();

    const isExtensionValid =
      allowedExts.some((extension) =>
        fileName.endsWith(extension)
      );

    const isMimeValid =
      file.type &&
      file.type.startsWith('image/');

    if (
      !isExtensionValid ||
      !isMimeValid
    ) {
      event.target.value = '';

      setToastMessage(
        'Invalid file format. Only image files (PNG, JPG, JPEG, WEBP, SVG, GIF) are allowed.'
      );

      setToastType('error');

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      event.target.value = '';

      setToastMessage(
        'File size exceeds 2MB limit. Please upload a smaller image.'
      );

      setToastType('error');

      return;
    }

    setLogoFile(file);

    /*
     * Local preview
     */
    const reader =
      new FileReader();

    reader.onloadend = () => {
      setLogo(reader.result);
    };

    reader.readAsDataURL(file);
  };

  /* =======================================================
     REMOVE LOGO
     ======================================================= */

  const handleRemoveLogo = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setLogo('');
    setLogoFile(null);
  };

  /* =======================================================
     SUBMIT
     ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nameError =
      validateBrandName(name);

    if (nameError) {
      setNameErrorInline(nameError);

      setToastMessage(nameError);
      setToastType('warning');

      return;
    }

    if (!id.trim()) {
      setToastMessage(
        'Brand ID could not be generated.'
      );

      setToastType('error');

      return;
    }

    setIsSaving(true);

    try {
      const brandPayload = {
        id: id.trim(),
        name: name.trim(),
        description:
          description.trim(),
        logo,
        logoFile
      };

      if (isEditing) {
        await updateBrand(
          brandPayload
        );

        setToastMessage(
          'Brand updated successfully!'
        );
      } else {
        await createBrand(
          brandPayload
        );

        setToastMessage(
          'Brand saved successfully!'
        );
      }

      setToastType('success');

      /*
       * Navigate back to Brands List after
       * successful API operation.
       */
      setTimeout(() => {
        navigate('/admin/brands/list');
      }, 1000);
    } catch (error) {
      setToastMessage(
        error?.message ||
          (isEditing
            ? 'Failed to update brand details.'
            : 'Failed to save brand details.')
      );

      setToastType('error');

      setIsSaving(false);
    }
  };

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div
      className="brands-page"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
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

      {/* ===================================================
          TOP HEADER
          =================================================== */}

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '24px 32px',
          borderRadius: '20px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Link
            className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-200"
            to="/admin/brands/list"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <span
              className="catalog-kicker"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#059669',
                fontWeight: 800,
                display: 'block',
                letterSpacing: '0.05em'
              }}
            >
              CATALOG SETTINGS
            </span>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0
              }}
            >
              {isEditing
                ? 'Edit Brand'
                : 'Create Brand'}
            </h1>
          </div>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <Link
            to="/admin/brands/list"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              textDecoration: 'none'
            }}
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSaving ||
              isLoading
            }
            style={{
              backgroundColor:
                isSaving || isLoading
                  ? '#94a3b8'
                  : '#059669',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor:
                isSaving || isLoading
                  ? 'not-allowed'
                  : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={16} />

            {isSaving
              ? isEditing
                ? 'Updating...'
                : 'Saving...'
              : isEditing
                ? 'Update Brand'
                : 'Save Brand'}
          </button>
        </div>
      </section>

      {/* ===================================================
          MAIN FORM
          =================================================== */}

      <div
        className="brand-form-container"
        style={{
          maxWidth: '680px',
          margin: '16px auto 0',
          width: '100%'
        }}
      >
        <div
          className="brand-form-card"
          style={{
            padding: '28px',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            boxShadow:
              '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="brand-form"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* SECTION TITLE */}

            <h3
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#059669',
                letterSpacing: '0.05em',
                borderBottom:
                  '1px solid #f1f5f9',
                paddingBottom: '12px',
                margin: '0 0 4px 0'
              }}
            >
              BRAND INFORMATION
            </h3>

            {/* BRAND ID */}

            <div
              className="brand-form-group"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center'
                }}
              >
                <label
                  htmlFor="brand-id"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155'
                  }}
                >
                  Brand ID
                </label>

                <span
                  style={{
                    fontSize: '11px',
                    color: '#059669',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Lock size={12} />
                  Auto-generated System ID
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  id="brand-id"
                  type="text"
                  value={
                    id ||
                    (isEditing
                      ? 'Loading...'
                      : 'Generating...')
                  }
                  readOnly
                  disabled
                  placeholder="Auto-generated System ID"
                  style={{
                    width: '100%',
                    padding:
                      '10px 14px 10px 36px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border:
                      '1px solid #e2e8f0',
                    outline: 'none',
                    backgroundColor:
                      '#f1f5f9',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: 'not-allowed'
                  }}
                />

                <Lock
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {/* BRAND NAME */}

            <div
              className="brand-form-group"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <label
                htmlFor="brand-name"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155'
                }}
              >
                Brand Name
              </label>

              <input
                id="brand-name"
                type="text"
                value={name}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setName(value);

                  setNameErrorInline(
                    validateBrandName(
                      value
                    )
                  );
                }}
                onBlur={(event) =>
                  setNameErrorInline(
                    validateBrandName(
                      event.target.value
                    )
                  )
                }
                placeholder="e.g. Shyam Agro Tools"
                required
                disabled={isLoading}
                style={{
                  padding:
                    '10px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: nameErrorInline
                    ? '1px solid #f87171'
                    : '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor:
                    nameErrorInline
                      ? '#fef2f2'
                      : '#ffffff'
                }}
              />

              {nameErrorInline && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#ef4444',
                    fontWeight: 500
                  }}
                >
                  {nameErrorInline}
                </span>
              )}
            </div>

            {/* DESCRIPTION */}

            <div
              className="brand-form-group"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <label
                htmlFor="brand-desc"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155'
                }}
              >
                Description
              </label>

              <textarea
                id="brand-desc"
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Brief information about manufacturer..."
                disabled={isLoading}
                style={{
                  padding:
                    '10px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border:
                    '1px solid #cbd5e1',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* BRAND LOGO */}

            <div
              className="brand-form-group"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155'
                }}
              >
                Brand Logo
              </label>

              {logo ? (
                <div
                  className="brand-image-preview"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    border:
                      '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    backgroundColor:
                      '#f8fafc'
                  }}
                >
                  <div
                    className="brand-image-preview__box"
                    style={{
                      width: '56px',
                      height: '56px',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      overflow: 'hidden'
                    }}
                  >
                    <BrandLogo
                      logo={logo}
                      name="Preview"
                    />
                  </div>

                  <div className="brand-image-preview__actions">
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--danger"
                      onClick={
                        handleRemoveLogo
                      }
                      disabled={isSaving}
                      style={{
                        fontSize: '11px',
                        padding:
                          '6px 12px',
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '4px',
                        backgroundColor:
                          '#ef4444',
                        color: '#fff',
                        borderRadius: '6px',
                        border: 'none',
                        cursor:
                          isSaving
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="brand-image-upload"
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    padding: '24px',
                    border:
                      '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    cursor:
                      isLoading ||
                      isSaving
                        ? 'not-allowed'
                        : 'pointer',
                    backgroundColor:
                      '#f8fafc',
                    transition:
                      'all 0.15s',
                    opacity:
                      isLoading ||
                      isSaving
                        ? 0.6
                        : 1
                  }}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif"
                    onChange={
                      handleImageChange
                    }
                    disabled={
                      isLoading ||
                      isSaving
                    }
                    style={{
                      display: 'none'
                    }}
                  />

                  <div
                    className="brand-image-upload__content"
                    style={{
                      display: 'flex',
                      flexDirection:
                        'column',
                      alignItems:
                        'center',
                      gap: '6px',
                      textAlign:
                        'center'
                    }}
                  >
                    <Upload
                      size={22}
                      style={{
                        color: '#059669'
                      }}
                    />

                    <span
                      style={{
                        fontSize: '13px',
                        color: '#1e293b',
                        fontWeight: 700
                      }}
                    >
                      Click to upload logo
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        color: '#64748b'
                      }}
                    >
                      PNG, JPG, SVG up to 2MB
                    </span>
                  </div>
                </label>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandForm;
