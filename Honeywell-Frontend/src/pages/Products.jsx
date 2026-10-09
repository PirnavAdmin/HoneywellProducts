import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePageBanner } from '../hooks/usePageBanner';
import { resolveBannerImage } from '../admin/marketing/bannersApi';
import { useSettings } from '../context/SettingsContext';
const normalizeCategory = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};



const formatCategoryName = (cat) => {
  if (!cat) return '';
  const catLower = String(cat).toLowerCase().trim();
  if (catLower.includes('-')) {
    return catLower.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return String(cat);
};



// Aliases mapping environment/solution slugs to category/subcategory names and search terms
const CATEGORY_ALIASES = {
  'cctv-cameras': {
    targetCategories: ['Network Cameras', 'Turbo HD Cameras', 'CCTV Cameras'],
    targetSubcategories: ['Bullet Cameras', 'Dome Cameras', 'IP Cameras'],
    keywords: ['cctv', 'camera', 'surveillance', 'network', 'turbo hd', 'ip']
  },
  'cctv': {
    targetCategories: ['Network Cameras', 'Turbo HD Cameras'],
    keywords: ['cctv', 'camera', 'surveillance']
  },
  'ip-cameras': {
    targetCategories: ['Network Cameras'],
    targetSubcategories: ['IP Cameras', 'Network Cameras', 'Bullet Cameras', 'Dome Cameras'],
    keywords: ['ip camera', 'network camera', 'ip', 'network', '4mp', '2mp', '8mp']
  },
  'network-cameras': {
    targetCategories: ['Network Cameras'],
    keywords: ['network', 'ip', 'camera']
  },
  'turbo-hd-cameras': {
    targetCategories: ['Turbo HD Cameras'],
    keywords: ['turbo', 'hd', 'analog', 'camera']
  },
  'solar-cameras': {
    targetCategories: ['Solar kit', 'Solar panels', 'Solar Kit', 'Solar Panels'],
    targetSubcategories: ['Solar Camera', 'Solar Cameras', '4G Camera'],
    keywords: ['solar', 'battery', 'kit', 'panel', 'off-grid', '4g', 'sun']
  },
  'solar-kit': {
    targetCategories: ['Solar kit', 'Solar Kit'],
    keywords: ['solar', 'kit', 'power']
  },
  'solar-panels': {
    targetCategories: ['Solar panels', 'Solar Panels'],
    keywords: ['solar', 'panel', 'panels']
  },
  'bullet-cameras': {
    targetSubcategories: ['Bullet Cameras', 'Bullet Camera', 'Outdoor Cameras'],
    targetCategories: ['Network Cameras', 'Turbo HD Cameras'],
    keywords: ['bullet', 'outdoor', 'long range', 'ir', 'weatherproof']
  },
  'bullet-camera': {
    targetSubcategories: ['Bullet Cameras', 'Bullet Camera'],
    targetCategories: ['Network Cameras', 'Turbo HD Cameras'],
    keywords: ['bullet', 'outdoor', 'ir']
  },
  'dome-cameras': {
    targetSubcategories: ['Dome Cameras', 'Dome Camera', 'Indoor Cameras'],
    targetCategories: ['Network Cameras', 'Turbo HD Cameras'],
    keywords: ['dome', 'indoor', '360', 'vandal', 'panoramic']
  },
  'dome-camera': {
    targetSubcategories: ['Dome Cameras', 'Dome Camera'],
    targetCategories: ['Network Cameras', 'Turbo HD Cameras'],
    keywords: ['dome', 'indoor', '360', 'vandal', 'pos']
  },
  'ptz-cameras': {
    targetSubcategories: ['PTZ Cameras', 'Speed Dome'],
    targetCategories: ['Network Cameras'],
    keywords: ['ptz', 'pan tilt', 'speed dome', 'zoom']
  },
  'wifi-cameras': {
    targetSubcategories: ['Wi-Fi Cameras', 'WiFi Cameras', 'Wireless Cameras'],
    targetCategories: ['Network Cameras'],
    keywords: ['wifi', 'wi-fi', 'wireless', 'smart home', 'intercom', 'home']
  },
  '4g-cameras': {
    targetCategories: ['Solar kit', 'Solar panels', 'Network Cameras'],
    targetSubcategories: ['4G Cameras', 'Solar Cameras'],
    keywords: ['4g', 'lte', 'cellular', 'solar', 'sim']
  },
  'networking': {
    targetCategories: ['Network Cameras'],
    targetSubcategories: ['Networking', 'Switches', 'Routers', 'NVR'],
    keywords: ['network', 'switch', 'poe', 'router', 'nvr', 'ip', 'access']
  },
  'access-control': {
    targetCategories: ['Network Cameras'],
    keywords: ['access', 'biometric', 'rfid', 'barrier', 'entry', 'door', 'controller']
  }
};



const checkCategoryMatch = (product, filterCategoryName, categoriesList = [], subcategoriesList = []) => {
  if (!filterCategoryName) return true;



  const targetNorm = normalizeCategory(filterCategoryName);
  const prodCatNorm = normalizeCategory(product.category);
  const prodCatId = String(product.categoryId ?? '').trim();
  const prodSubCatId = String(product.subcategoryId ?? '').trim();
  const prodTypeNorm = normalizeCategory(product.productType || product.subcategory || '');
  const prodNameNorm = normalizeCategory(product.name || product.productName || '');



  // 1. Direct match on product category or category ID
  if (prodCatNorm && prodCatNorm === targetNorm) return true;
  if (prodCatId && prodCatId === targetNorm) return true;
  if (prodTypeNorm && prodTypeNorm === targetNorm) return true;



  // 2. Check categoriesList for matching category object
  const catObj = categoriesList.find(
    (c) =>
      String(c.id) === String(filterCategoryName) ||
      normalizeCategory(c.name) === targetNorm ||
      normalizeCategory(c.slug) === targetNorm
  );



  if (catObj) {
    if (prodCatId && prodCatId === String(catObj.id)) return true;
    if (prodCatNorm && (prodCatNorm === normalizeCategory(catObj.name) || prodCatNorm === normalizeCategory(catObj.slug))) return true;
    if (prodSubCatId) {
      const sub = subcategoriesList.find((s) => String(s.id) === prodSubCatId);
      if (sub && String(sub.categoryId) === String(catObj.id)) return true;
    }
  }



  // 3. Check Subcategory matching (if filterCategoryName was actually a subcategory)
  const subObj = subcategoriesList.find(
    (s) =>
      String(s.id) === String(filterCategoryName) ||
      normalizeCategory(s.name) === targetNorm ||
      normalizeCategory(s.slug) === targetNorm
  );
  if (subObj) {
    if (prodSubCatId && prodSubCatId === String(subObj.id)) return true;
    if (prodTypeNorm && (prodTypeNorm === normalizeCategory(subObj.name) || prodTypeNorm === normalizeCategory(subObj.slug))) return true;
    if (prodCatId && String(subObj.categoryId) === prodCatId) return true;
  }



  // 4. Check Alias Map
  const slugKey = Object.keys(CATEGORY_ALIASES).find(
    (k) => normalizeCategory(k) === targetNorm || normalizeCategory(formatCategoryName(k)) === targetNorm
  );
  if (slugKey) {
    const alias = CATEGORY_ALIASES[slugKey];
    if (alias.targetCategories && alias.targetCategories.some(tc => normalizeCategory(tc) === prodCatNorm)) {
      return true;
    }
    if (alias.targetSubcategories && alias.targetSubcategories.some(ts => normalizeCategory(ts) === prodTypeNorm)) {
      return true;
    }
    if (alias.keywords) {
      const pText = `${product.name} ${product.category} ${product.productType} ${product.description} ${(product.keyFeatures || []).join(' ')}`.toLowerCase();
      if (alias.keywords.some(kw => pText.includes(kw.toLowerCase()))) {
        return true;
      }
    }
  }



  // 5. Broad substring/keyword match fallback on product fields
  if (targetNorm.length >= 3) {
    if (prodCatNorm.includes(targetNorm) || targetNorm.includes(prodCatNorm)) return true;
    if (prodTypeNorm.includes(targetNorm) || targetNorm.includes(prodTypeNorm)) return true;
    if (prodNameNorm.includes(targetNorm)) return true;
  }



  return false;
};



const checkSubcategoryMatch = (product, filterSubcategoryName, subcategoriesList = []) => {
  if (!filterSubcategoryName) return true;



  const targetNorm = normalizeCategory(filterSubcategoryName);
  const prodSubCatId = String(product.subcategoryId ?? '').trim();
  const prodTypeNorm = normalizeCategory(product.productType);
  const prodSubcatNorm = normalizeCategory(product.subcategory || product.subcategoryName);
  const prodNameNorm = normalizeCategory(product.name || product.productName || '');



  // 1. Direct match on productType or subcategoryId
  if (prodSubCatId && prodSubCatId === targetNorm) return true;
  if (prodTypeNorm && prodTypeNorm === targetNorm) return true;
  if (prodSubcatNorm && prodSubcatNorm === targetNorm) return true;



  // 2. Check subcategoriesList for matching subcategory object
  const subObj = subcategoriesList.find(
    (s) =>
      String(s.id) === String(filterSubcategoryName) ||
      normalizeCategory(s.name) === targetNorm ||
      normalizeCategory(s.slug) === targetNorm
  );



  if (subObj) {
    if (prodSubCatId && prodSubCatId === String(subObj.id)) return true;
    if (prodTypeNorm && (prodTypeNorm === normalizeCategory(subObj.name) || prodTypeNorm === normalizeCategory(subObj.slug))) return true;
    if (prodSubcatNorm && (prodSubcatNorm === normalizeCategory(subObj.name) || prodSubcatNorm === normalizeCategory(subObj.slug))) return true;
  }



  // 3. Check Alias Map
  const slugKey = Object.keys(CATEGORY_ALIASES).find(
    (k) => normalizeCategory(k) === targetNorm || normalizeCategory(formatCategoryName(k)) === targetNorm
  );
  if (slugKey) {
    const alias = CATEGORY_ALIASES[slugKey];
    if (alias.targetSubcategories && alias.targetSubcategories.some(ts => normalizeCategory(ts) === prodTypeNorm)) {
      return true;
    }
    if (alias.keywords) {
      const pText = `${product.name} ${product.productType} ${product.description}`.toLowerCase();
      if (alias.keywords.some(kw => pText.includes(kw.toLowerCase()))) {
        return true;
      }
    }
  }



  // 4. Substring fallback
  if (targetNorm.length >= 3 && prodNameNorm.includes(targetNorm)) {
    return true;
  }



  return false;
};



export default function Products() {



   const { banner } = usePageBanner(
  'Products',
  'Products',
  'Search and filter professional surveillance, recording, networking and solar-security product categories.',
  ''
  );
  useDocumentTitle('Products', 'Explore professional surveillance, recording, networking and security product categories.');
  const { priceVisibility } = useSettings();
  const [params] = useSearchParams();
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: [], subcategory: [], installation: [], connectivity: [], features: [] });
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);



  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, subcats, prods] = await Promise.all([
        productService.categories().catch(() => []),
        productService.subcategories().catch(() => []),
        productService.getAll().catch(() => []),
      ]);
      const validCats = (Array.isArray(cats) ? cats : []).slice().sort((a, b) => {
        const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
        const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
        if (orderA !== orderB && (orderA > 0 || orderB > 0)) {
          if (orderA === 0) return 1;
          if (orderB === 0) return -1;
          return orderA - orderB;
        }
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });
      const validSubcats = Array.isArray(subcats) ? subcats : [];



      setCategoriesList(validCats);
      setSubcategoriesList(validSubcats);
      setProductsList(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error('Failed to load products/categories/subcategories:', err);
      setError(err.message || 'Unable to connect to products server. Please check backend status.');
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadData();
  }, []);



  useEffect(() => {
    const categoryParam = params.get('category');
    const subcategoryParam = params.get('subcategory');
    const searchParam = params.get('search') || params.get('q');
    const applicationParam = params.get('application') || params.get('environment');



    if (searchParam) {
      setQuery(searchParam.trim());
    }



    if (!categoryParam && !subcategoryParam && !applicationParam) return;



    let targetCatParam = categoryParam;
    if (!targetCatParam && applicationParam) {
      // Map application parameter to default category
      const appMap = {
        home: 'wifi-cameras',
        apartment: 'dome-cameras',
        shop: 'cctv-cameras',
        office: 'ip-cameras',
        'retail-store': 'ip-cameras',
        retail: 'cctv-cameras',
        warehouse: 'bullet-cameras',
        factory: 'ptz-cameras',
        commercial: 'cctv-cameras',
        school: 'dome-cameras',
        hospital: 'ip-cameras',
        hotel: 'dome-cameras',
        farm: 'solar-cameras',
        'construction-site': 'solar-cameras',
      };
      targetCatParam = appMap[applicationParam.toLowerCase()] || applicationParam;
    }



    let matchedCatName = '';
    let matchedSubcatName = '';



    if (targetCatParam) {
      // 1. Try matching category in categoriesList
      const matchCat = categoriesList.find(
        (c) =>
          String(c.id) === String(targetCatParam) ||
          normalizeCategory(c.slug) === normalizeCategory(targetCatParam) ||
          normalizeCategory(c.name) === normalizeCategory(targetCatParam)
      );



      if (matchCat) {
        matchedCatName = matchCat.name;
      } else {
        // 2. Try matching subcategory in subcategoriesList
        const matchSub = subcategoriesList.find(
          (s) =>
            String(s.id) === String(targetCatParam) ||
            normalizeCategory(s.slug) === normalizeCategory(targetCatParam) ||
            normalizeCategory(s.name) === normalizeCategory(targetCatParam)
        );



        if (matchSub) {
          matchedSubcatName = matchSub.name;
          // Also find parent category if available
          const parentCat = categoriesList.find((c) => String(c.id) === String(matchSub.categoryId));
          if (parentCat) {
            matchedCatName = parentCat.name;
          }
        } else {
          // 3. Check Alias Map for fallback category
          const slugKey = Object.keys(CATEGORY_ALIASES).find(
            (k) => normalizeCategory(k) === normalizeCategory(targetCatParam)
          );
          if (slugKey) {
            const alias = CATEGORY_ALIASES[slugKey];
            if (alias.targetCategories && alias.targetCategories.length > 0) {
              const foundCat = categoriesList.find((c) =>
                alias.targetCategories.some((tc) => normalizeCategory(tc) === normalizeCategory(c.name))
              );
              if (foundCat) {
                matchedCatName = foundCat.name;
              } else {
                matchedCatName = alias.targetCategories[0];
              }
            } else if (alias.targetSubcategories && alias.targetSubcategories.length > 0) {
              const foundSub = subcategoriesList.find((s) =>
                alias.targetSubcategories.some((ts) => normalizeCategory(ts) === normalizeCategory(s.name))
              );
              if (foundSub) {
                matchedSubcatName = foundSub.name;
              } else {
                matchedSubcatName = alias.targetSubcategories[0];
              }
            } else {
              matchedCatName = formatCategoryName(targetCatParam);
            }
          } else {
            matchedCatName = formatCategoryName(targetCatParam);
          }
        }
      }
    }



    if (subcategoryParam) {
      const matchSub = subcategoriesList.find(
        (s) =>
          String(s.id) === String(subcategoryParam) ||
          normalizeCategory(s.slug) === normalizeCategory(subcategoryParam) ||
          normalizeCategory(s.name) === normalizeCategory(subcategoryParam)
      );
      matchedSubcatName = matchSub ? matchSub.name : formatCategoryName(subcategoryParam);
    }



    setFilters((current) => ({
      ...current,
      category: matchedCatName ? [matchedCatName] : current.category,
      subcategory: matchedSubcatName ? [matchedSubcatName] : current.subcategory,
    }));
  }, [params, categoriesList, subcategoriesList]);



  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setFiltersOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);



  // 1. Dynamic Categories from API + real products
  const dynamicCategoryList = useMemo(() => {
    const apiCatNames = categoriesList
      .filter((c) => c.status !== 'Inactive')
      .map((c) => c.name)
      .filter(Boolean);
    const prodCatNames = productsList
      .map((p) => p.category)
      .filter(Boolean);
    const combined = [...new Set([...apiCatNames, ...prodCatNames])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, [categoriesList, productsList]);



  // 2. Dynamic Subcategories: when category is selected, ONLY show subcategories under that category
  const availableSubcategories = useMemo(() => {
    if (filters.category.length > 0) {
      // Find selected category IDs & names
      const selectedCatObjects = categoriesList.filter((c) =>
        filters.category.some((catName) =>
          normalizeCategory(c.name) === normalizeCategory(catName) || String(c.id) === String(catName)
        )
      );
      const selectedCatIds = selectedCatObjects.map((c) => String(c.id));



      // 1) From subcategoriesList: only those matching selected categories
      const matchingSubcatObjects = subcategoriesList.filter((s) => {
        if (s.status === 'Inactive') return false;
        if (selectedCatIds.includes(String(s.categoryId))) return true;
        if (filters.category.some((catName) => normalizeCategory(s.categoryName) === normalizeCategory(catName))) return true;
        return false;
      });
      const subcatNamesFromApi = matchingSubcatObjects.map((s) => s.name).filter(Boolean);



      // 2) From products belonging to the selected categories
      const matchingProducts = productsList.filter((product) =>
        filters.category.some((catName) => checkCategoryMatch(product, catName, categoriesList, subcategoriesList))
      );
      const subcatNamesFromProds = matchingProducts.map((p) => p.productType).filter(Boolean);



      const combined = [...new Set([...subcatNamesFromApi, ...subcatNamesFromProds])];
      return combined.sort((a, b) => a.localeCompare(b));
    }



    // When no category is selected: show all active subcategories
    const allApiSubcats = subcategoriesList
      .filter((s) => s.status !== 'Inactive')
      .map((s) => s.name)
      .filter(Boolean);
    const allProdSubcats = productsList
      .map((p) => p.productType)
      .filter(Boolean);
    const combined = [...new Set([...allApiSubcats, ...allProdSubcats])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, [filters.category, categoriesList, subcategoriesList, productsList]);



  // 3. Dynamic Installation options from products
  const availableInstallation = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      if (Array.isArray(p.installation)) {
        p.installation.forEach((item) => item && options.add(String(item).trim()));
      } else if (typeof p.installation === 'string' && p.installation.trim()) {
        options.add(p.installation.trim());
      }
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);



  // 4. Dynamic Connectivity options from products
  const availableConnectivity = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      if (Array.isArray(p.connectivity)) {
        p.connectivity.forEach((item) => item && options.add(String(item).trim()));
      } else if (typeof p.connectivity === 'string' && p.connectivity.trim()) {
        options.add(p.connectivity.trim());
      }
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);



  // 5. Dynamic Features options from products
  const availableFeatures = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      const featList = Array.isArray(p.features)
        ? p.features
        : Array.isArray(p.keyFeatures)
        ? p.keyFeatures
        : Array.isArray(p.highlights)
        ? p.highlights
        : [];
      featList.forEach((item) => {
        if (typeof item === 'string' && item.trim() && item.length < 35) {
          options.add(item.trim());
        }
      });
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);



  // 6. Filter Groups built dynamically
  const dynamicFilterGroups = useMemo(() => {
    const groups = [
      { key: 'category', label: 'Category', items: dynamicCategoryList },
      { key: 'subcategory', label: 'Sub Category', items: availableSubcategories },
    ];
    if (availableInstallation.length > 0) {
      groups.push({ key: 'installation', label: 'Installation', items: availableInstallation });
    }
    if (availableConnectivity.length > 0) {
      groups.push({ key: 'connectivity', label: 'Connectivity', items: availableConnectivity });
    }
    if (availableFeatures.length > 0) {
      groups.push({ key: 'features', label: 'Features', items: availableFeatures });
    }
    return groups;
  }, [dynamicCategoryList, availableSubcategories, availableInstallation, availableConnectivity, availableFeatures]);



  const toggle = (key, item) => setFilters((current) => {
    const currentList = current[key] || [];
    const nextItems = currentList.includes(item) ? currentList.filter((value) => value !== item) : [...currentList, item];



    if (key === 'category') {
      // When category selection changes, prune subcategories that don't belong to the remaining selected categories
      if (nextItems.length === 0) {
        return { ...current, category: nextItems };
      }



      const selectedCatObjects = categoriesList.filter((c) =>
        nextItems.some((catName) =>
          normalizeCategory(c.name) === normalizeCategory(catName) || String(c.id) === String(catName)
        )
      );
      const selectedCatIds = selectedCatObjects.map((c) => String(c.id));



      const validSubcats = subcategoriesList
        .filter((s) =>
          selectedCatIds.includes(String(s.categoryId)) ||
          nextItems.some((catName) => normalizeCategory(s.categoryName) === normalizeCategory(catName))
        )
        .map((s) => s.name);



      const matchingProducts = productsList.filter((product) =>
        nextItems.some((catName) => checkCategoryMatch(product, catName, categoriesList, subcategoriesList))
      );
      const validProdSubcats = matchingProducts.map((p) => p.productType).filter(Boolean);
      const allValid = new Set([...validSubcats, ...validProdSubcats]);



      const nextSubcategories = (current.subcategory || []).filter((sub) => allValid.has(sub));
      return { ...current, category: nextItems, subcategory: nextSubcategories };
    }



    return { ...current, [key]: nextItems };
  });



  const filtered = useMemo(() => {
    const result = productsList.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.productType,
        product.description,
        product.brand,
        product.sku,
        ...(product.keywords || []),
        ...(product.highlights || []),
        ...(product.keyFeatures || []),
      ].filter(Boolean).join(' ').toLowerCase();



      const categoryMatch = !filters.category.length || filters.category.some((name) =>
        checkCategoryMatch(product, name, categoriesList, subcategoriesList)
      );



      const subcategoryMatch = !filters.subcategory.length || filters.subcategory.some((subName) =>
        checkSubcategoryMatch(product, subName, subcategoriesList)
      );



      const installationMatch = !filters.installation.length || (product.installation && filters.installation.some((item) =>
        Array.isArray(product.installation) ? product.installation.includes(item) : String(product.installation).includes(item)
      ));



      const connectivityMatch = !filters.connectivity.length || (product.connectivity && filters.connectivity.some((item) =>
        Array.isArray(product.connectivity) ? product.connectivity.includes(item) : String(product.connectivity).includes(item)
      ));



      const featureMatch = !filters.features.length || filters.features.some((item) => {
        const feats = Array.isArray(product.features) ? product.features : Array.isArray(product.keyFeatures) ? product.keyFeatures : Array.isArray(product.highlights) ? product.highlights : [];
        return feats.some((f) => String(f).toLowerCase().includes(item.toLowerCase()));
      });



      return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch && subcategoryMatch && installationMatch && connectivityMatch && featureMatch;
    });



    if (sort === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sort === 'new') result.sort((a, b) => Number(b.newProduct || 0) - Number(a.newProduct || 0));
    if (sort === 'price-low') result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === 'price-high') result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sort === 'rating') result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    return result;
  }, [productsList, categoriesList, subcategoriesList, query, filters, sort]);



  const activeFilterCount = Object.values(filters).reduce((total, items) => total + items.length, 0) + (query.trim() ? 1 : 0) + (sort !== 'featured' ? 1 : 0);
  const reset = () => { setQuery(''); setFilters({ category: [], subcategory: [], installation: [], connectivity: [], features: [] }); setSort('featured'); setVisible(12); };



  return <>
   <PageHero
  eyebrow="PRODUCT CATALOGUE"
  title={banner.title}
  description={banner.description}
  image={banner.image}
   />
   <section className="catalogue section">
      <div className="container">
        <button className="filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> FILTER PRODUCTS</button>
        <div className="catalogue-layout">
          <aside className={`filters ${filtersOpen ? 'open' : ''}`} aria-label="Product filters">
            <header className="filter-panel-head">
              <div><span>REFINE CATALOGUE</span><h2>Filter products</h2></div>
              <span className={`filter-active-count ${activeFilterCount ? '' : 'empty'}`}>{activeFilterCount ? `${activeFilterCount} active` : 'All products'}</span>
              <button className="filter-panel-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
            </header>



            <div className="filter-block filter-search-block">
              <label htmlFor="product-search">Search products</label>
              <div className="filter-search">
                <Search size={17} />
                <input id="product-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Name, category or type" />
              </div>
            </div>



            {dynamicFilterGroups.map((group) => {
              const items = group.items || [];
              const selectedList = filters[group.key] || [];
              const selectedCount = selectedList.length;
              return <details className="filter-dropdown" key={group.key}>
                <summary>
                  <span>{group.label}</span>
                  <span className="filter-dropdown-meta">{selectedCount > 0 && <small>{selectedCount} selected</small>}<ChevronDown size={17} /></span>
                </summary>
                <div className="filter-dropdown-panel">
                  <div className="filter-options" role="group" aria-label={group.label}>
                    {items.length ? items.map((item) => (
                      <label className="filter-option" key={item}>
                        <input type="checkbox" checked={selectedList.includes(item)} onChange={() => { toggle(group.key, item); setVisible(12); }} />
                        <span className="filter-checkbox" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                        <span className="filter-option-label">{item}</span>
                      </label>
                    )) : <p className="filter-options-empty">No options available.</p>}
                  </div>
                </div>
              </details>;
            })}



            <footer className="filter-panel-footer">
              <div>
                <button className="reset-filters" onClick={reset} disabled={!activeFilterCount}><RotateCcw size={15} />Reset all</button>
                <span>{filtered.length} matches</span>
              </div>
              <button className="button filter-apply" onClick={() => setFiltersOpen(false)}>Show {filtered.length} products</button>
            </footer>
          </aside>



          {filtersOpen && <div className="filter-scrim" onClick={() => setFiltersOpen(false)} />}



          <div className="catalogue-results">
            <div className="catalogue-toolbar">
              <p><strong>{filtered.length}</strong> products</p>
              <label>Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="new">New Products</option>
                  <option value="rating">Customer rating</option>
                  {priceVisibility && <option value="price-low">Price: Low to high</option>}
                  {priceVisibility && <option value="price-high">Price: High to low</option>}
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>



            {loading ? (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="product-card-skeleton">
                    <div className="skeleton-img-box skeleton-pulse" />
                    <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div className="skeleton-line" style={{ width: '50%', height: '10px' }} />
                      <div className="skeleton-line" style={{ width: '90%', height: '26px' }} />
                      <div className="skeleton-line" style={{ width: '40%', height: '10px' }} />
                      <div className="skeleton-line" style={{ width: '70%', height: '16px', marginTop: 'auto' }} />
                      <div className="skeleton-line" style={{ width: '100%', height: '28px', marginTop: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="empty-state large" style={{ padding: '4rem 1rem' }}>
                <AlertCircle size={40} color="#ef4444" />
                <h2>Product Service Connection Issue</h2>
                <p>{error}</p>
                <button className="button outline" onClick={loadData}>Try Refreshing</button>
              </div>
            ) : filtered.length ? (
              <>
                <div className="product-grid">
                  {filtered.slice(0, visible).map((product, idx) => (
                    <ProductCard key={product.id} product={product} priority={idx < 4} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <button className="button outline load-more" onClick={() => setVisible((value) => value + 6)}>Load more products</button>
                )}
              </>
            ) : (
              <div className="empty-state large">
                <Search size={36} />
                <h2>No products found</h2>
                <p>Try a different search term or clear your filters.</p>
                <button className="button outline" onClick={reset}>Reset filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  </>;
}
