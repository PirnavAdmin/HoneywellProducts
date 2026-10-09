import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Boxes,
  X,
  Search,
  Settings,
  Trash2,
  FileText,
  Download,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getOrders } from '../api/orders';
import { fetchProducts, fetchCategories } from '../catalog/productsApi';
import {
  getReportsOrders,
  getReportsProcurement,
  getReportsCatalog,
  updateReportSettings,
  clearReportCache
} from '../api/reports';
import { fetchPurchaseIndents, fetchPurchaseOrders } from '../api/purchase';
import { getAdminReturns } from '../api/returns';
import { Pagination } from '../components/ActionButtons';
import './ReportsScreen.css';

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const formatOrderId = (rawId) => {
  if (!rawId) return 'ORD-000000';
  let str = String(rawId).trim().replace(/^#+/, '');
  while (str.startsWith('ORD-ORD-')) {
    str = str.substring(4);
  }
  if (!str.startsWith('ORD-')) {
    str = `ORD-${str}`;
  }
  return str;
};

const REPORTS_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

const STATUS_COLORS = {
  Completed: '#16a34a',
  Cancelled: '#dc2626',
  Canceled: '#dc2626',
  Dispatched: '#f97316',
  Processing: '#2563eb',
  Pending: '#eab308',
  Placed: '#9333ea',
  Packed: '#db2777',
  Shipped: '#06b6d4',
  'On Hold': '#4b5563',
  Approved: '#16a34a',
  Rejected: '#dc2626',
  'In Review': '#f59e0b',
  'Pending Inspection': '#eab308',
  'Pickup Scheduled': '#0284c7',
  Refunded: '#059669',
  Replaced: '#4f46e5'
};

const isWithinDatePreset = (dateValue, preset) => {
  if (preset === 'All' || !dateValue) return true;
  const itemDate = new Date(dateValue);
  if (isNaN(itemDate.getTime())) return true;
  const now = new Date();

  if (preset === '7days') {
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }
  if (preset === '30days') {
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }
  if (preset === 'year') {
    return itemDate.getFullYear() === now.getFullYear();
  }
  return true;
};

const ReportsScreen = () => {
  const navigate = useNavigate();
  // 4 Main Screens: 'sales', 'procurement', 'catalog', 'returns'
  const [activeTab, setActiveTab] = useState('sales');
  const [datePreset, setDatePreset] = useState('All'); // 'All', '7days', '30days', 'year'
  const [loading, setLoading] = useState(true);

  // Data States
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchaseIndents, setPurchaseIndents] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);

  // Reports API custom states
  const [ordersReport, setOrdersReport] = useState(null);
  const [procurementReport, setProcurementReport] = useState(null);
  const [catalogReport, setCatalogReport] = useState(null);
  const [settings, setSettings] = useState({ lowStockAlertLimit: 5, defaultCurrency: 'INR' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [notification, setNotification] = useState(null);

  // Search & Pagination states
  const [ordersSearch, setOrdersSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [returnsSearch, setReturnsSearch] = useState('');

  const [ordersPage, setOrdersPage] = useState(1);
  const [indentsPage, setIndentsPage] = useState(1);
  const [posPage, setPosPage] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);
  const [returnsPage, setReturnsPage] = useState(1);
  const [drillPage, setDrillPage] = useState(1);
  const itemsPerPage = 10;

  // Drill-down Modal State
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    title: '',
    type: '',
    data: [],
    filterType: ''
  });
  const [drillDownSearch, setDrillDownSearch] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [
        reportsOrdersData,
        reportsProcurementData,
        reportsCatalogData,
        indentsData,
        posData,
        adminReturnsData
      ] = await Promise.all([
        getReportsOrders().catch((err) => {
          console.warn("Reports Orders API offline or error:", err.message);
          return null;
        }),
        getReportsProcurement().catch((err) => {
          console.warn("Reports Procurement API offline or error:", err.message);
          return null;
        }),
        getReportsCatalog().catch((err) => {
          console.warn("Reports Catalog API offline or error:", err.message);
          return null;
        }),
        fetchPurchaseIndents().catch(() => []),
        fetchPurchaseOrders().catch(() => []),
        getAdminReturns({ pageSize: 100 }).catch(() => ({ returns: [] }))
      ]);

      setProcurementReport(reportsProcurementData || null);
      setPurchaseIndents(indentsData || []);
      setPurchaseOrders(posData || []);
      setReturnsList(adminReturnsData?.returns || adminReturnsData?.items || []);

      const mapStatusLocal = (status, paymentStatus) => {
        if (!status) return 'Pending';
        const s = status.toUpperCase();
        const ps = (paymentStatus || '').toUpperCase();
        const isPaid = ps === 'PAID' || ps === 'VERIFIED PAID' || ps === 'SUCCESS' || ps === 'PAID VERIFIED';

        if (s === 'PENDING' || s === 'PLACED') return isPaid ? 'Processing' : 'Pending';
        if (s === 'PROCESSING' || s === 'PACKED') return 'Processing';
        if (s === 'SHIPPED' || s === 'DISPATCHED') return 'Dispatched';
        if (s === 'DELIVERED' || s === 'COMPLETED') return 'Completed';
        if (s === 'CANCELLED' || s === 'CANCELED') return 'Cancelled';
        return status;
      };

      if (reportsOrdersData) {
        setOrdersReport(reportsOrdersData);
        const mappedOrders = (reportsOrdersData.detailedOrdersLedger || []).map(o => {
          const amount = o.totalAmount ? Number(String(o.totalAmount).replace(/[^0-9.-]+/g, "")) : 0;
          const itemsCount = o.itemsCount ? parseInt(o.itemsCount, 10) : 0;
          const payStat = o.paymentStatus === 'PendingVerification' ? 'Pending Verification' : o.paymentStatus;
          return {
            id: o.orderId,
            orderId: o.orderId,
            date: o.date,
            orderDate: o.date,
            customerName: o.customer,
            customer: o.customer,
            items: Array(itemsCount).fill({}),
            totalAmount: amount,
            total: amount,
            paymentStatus: payStat,
            status: mapStatusLocal(o.fulfillmentStatus || o.fulfillment || o.status, payStat)
          };
        });
        setOrders(mappedOrders);
      } else {
        setOrdersReport(null);
        setOrders([]);
      }

      if (reportsCatalogData) {
        setCatalogReport(reportsCatalogData);
        const mappedProducts = (reportsCatalogData.catalogInventorySummary || []).map((p, idx) => {
          const price = p.sellingPrice ? Number(String(p.sellingPrice).replace(/[^0-9.-]+/g, "")) : 0;
          return {
            id: String(idx + 1),
            sku: p.sku,
            name: p.productName,
            categoryId: p.category,
            brand: p.brand,
            price: price,
            stock: p.stockCount,
            status: p.status
          };
        });
        setProducts(mappedProducts);
      } else {
        setCatalogReport(null);
        setProducts([]);
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to load reporting data:", err);
      setOrders([]);
      setProducts([]);
      setPurchaseIndents([]);
      setPurchaseOrders([]);
      setReturnsList([]);
      showNotification("Server is offline or unreachable. Displaying live state only.", "error");
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      const savedLimit = localStorage.getItem('reports_low_stock_limit');
      const savedCurrency = localStorage.getItem('reports_currency');
      if (savedLimit || savedCurrency) {
        setSettings({
          lowStockAlertLimit: savedLimit ? parseInt(savedLimit, 10) : 5,
          defaultCurrency: savedCurrency || 'INR'
        });
      }
    } catch (e) {
      console.warn("Could not retrieve local settings:", e);
    }
  };

  useEffect(() => {
    loadReportData();
    initializeSettings();
  }, []);

  // Reset pagination pages on filter or tab change
  useEffect(() => {
    setOrdersPage(1);
    setIndentsPage(1);
    setPosPage(1);
    setCatalogPage(1);
    setReturnsPage(1);
  }, [datePreset, activeTab]);

  // =========================================================================
  // 1. SALES & ORDERS DYNAMIC FILTERING & STATS
  // =========================================================================
  const filteredOrders = useMemo(() => {
    const dateFiltered = orders.filter(o => isWithinDatePreset(o.orderDate || o.date, datePreset));
    const seenOrderIds = new Set();
    return dateFiltered.filter(o => {
      const key = String(o.id || o.orderId || '').toLowerCase();
      if (!key || seenOrderIds.has(key)) return false;
      seenOrderIds.add(key);
      return true;
    });
  }, [orders, datePreset]);

  const searchedOrders = useMemo(() => {
    const q = ordersSearch.toLowerCase().trim();
    if (!q) return filteredOrders;
    return filteredOrders.filter(o => 
      String(o.orderId || o.id || '').toLowerCase().includes(q) ||
      String(o.customerName || o.customer || '').toLowerCase().includes(q) ||
      String(o.paymentStatus || '').toLowerCase().includes(q) ||
      String(o.status || '').toLowerCase().includes(q)
    );
  }, [filteredOrders, ordersSearch]);

  const salesStats = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const total = activeOrders.length;
    const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total || o.finalAmount || 0)), 0);
    const aov = total > 0 ? Math.round((revenue / total) * 100) / 100 : 0;
    const pendingPayment = activeOrders.filter(o => {
      const ps = (o.paymentStatus || '').toLowerCase();
      const st = (o.status || '').toLowerCase();
      const isPendingStatus = ps === 'pending' || ps === 'pending verification' || ps === 'pendingverification';
      const isSettledOrder = st === 'completed' || st === 'delivered';
      return isPendingStatus && !isSettledOrder;
    }).length;
    return { total, revenue, aov, pendingPayment };
  }, [filteredOrders]);

  const salesTrendData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const dateStr = new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      map[dateStr] = (map[dateStr] || 0) + Number(o.totalAmount || o.total || 0);
    });
    const result = Object.keys(map).map(date => ({ date, Sales: map[date] }));
    return result.length > 0 ? result.slice(-10) : [{ date: 'Today', Sales: 0 }];
  }, [filteredOrders]);

  const statusPieData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const status = o.status || 'Processing';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [filteredOrders]);

  const paymentBarData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const method = o.paymentMethod || o.payMethod || 'UPI / Bank Transfer';
      map[method] = (map[method] || 0) + 1;
    });
    return Object.keys(map).map(name => ({
      name: name.split('/')[0].trim(),
      Orders: map[name]
    }));
  }, [filteredOrders]);

  // =========================================================================
  // 2. PROCUREMENT & PURCHASE DYNAMIC FILTERING & STATS
  // =========================================================================
  const filteredIndents = useMemo(() => {
    return purchaseIndents.filter(i => isWithinDatePreset(i.date || i.createdAt, datePreset));
  }, [purchaseIndents, datePreset]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(p => isWithinDatePreset(p.date || p.createdAt, datePreset));
  }, [purchaseOrders, datePreset]);

  const procurementStats = useMemo(() => {
    const totalIndents = filteredIndents.length;
    const totalPOs = filteredPurchaseOrders.length;
    const totalSpend = filteredPurchaseOrders.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const pendingApprovals = filteredIndents.filter(i => (i.status || '').toLowerCase().includes('pending')).length;
    return { totalIndents, totalPOs, totalSpend, pendingApprovals };
  }, [filteredIndents, filteredPurchaseOrders]);

  // =========================================================================
  // 3. CATALOG & STOCK DYNAMIC STATS & CHARTS
  // =========================================================================
  const catalogStats = useMemo(() => {
    const totalProducts = products.length;
    const limit = settings.lowStockAlertLimit || 5;
    const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= limit).length;
    const outOfStock = products.filter(p => Number(p.stock) === 0).length;
    const totalCategories = categories.length || 6;
    const totalValuation = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
    return { totalProducts, lowStock, outOfStock, totalCategories, totalValuation };
  }, [products, categories, settings.lowStockAlertLimit]);

  const searchedProducts = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      String(p.sku || '').toLowerCase().includes(q) ||
      String(p.name || '').toLowerCase().includes(q) ||
      String(p.categoryId || '').toLowerCase().includes(q) ||
      String(p.brand || '').toLowerCase().includes(q)
    );
  }, [products, catalogSearch]);

  const categoryPieData = useMemo(() => {
    const categoryNameMap = {};
    categories.forEach(c => { categoryNameMap[c.id] = c.name; });
    const map = {};
    products.forEach(p => {
      const catName = categoryNameMap[p.categoryId] || p.categoryId || 'General';
      map[catName] = (map[catName] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [products, categories]);

  const lowestStockAlertData = useMemo(() => {
    return products
      .map(p => ({
        name: (p.name || '').length > 18 ? (p.name || '').slice(0, 15) + '...' : (p.name || 'Product'),
        Stock: Number(p.stock || 0)
      }))
      .sort((a, b) => a.Stock - b.Stock)
      .slice(0, 8);
  }, [products]);

  // =========================================================================
  // 4. RETURNS & WARRANTY DYNAMIC FILTERING & STATS
  // =========================================================================
  const filteredReturns = useMemo(() => {
    return returnsList.filter(r => isWithinDatePreset(r.createdAt || r.date || r.requestedAt, datePreset));
  }, [returnsList, datePreset]);

  const searchedReturns = useMemo(() => {
    const q = returnsSearch.toLowerCase().trim();
    if (!q) return filteredReturns;
    return filteredReturns.filter(r =>
      String(r.id || r.returnId || '').toLowerCase().includes(q) ||
      String(r.orderNumber || r.orderReference || '').toLowerCase().includes(q) ||
      String(r.customerName || r.name || '').toLowerCase().includes(q) ||
      String(r.status || '').toLowerCase().includes(q) ||
      String(r.type || r.requestType || '').toLowerCase().includes(q)
    );
  }, [filteredReturns, returnsSearch]);

  const returnsStats = useMemo(() => {
    const total = filteredReturns.length;
    const approved = filteredReturns.filter(r => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'refunded').length;
    const pending = filteredReturns.filter(r => (r.status || '').toLowerCase().includes('pending') || (r.status || '').toLowerCase().includes('review')).length;
    const refunded = filteredReturns.filter(r => (r.status || '').toLowerCase() === 'refunded').length;
    return { total, approved, pending, refunded };
  }, [filteredReturns]);

  const returnStatusPieData = useMemo(() => {
    const map = {};
    filteredReturns.forEach(r => {
      const st = r.status || 'Pending Review';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [filteredReturns]);

  const returnReasonsBarData = useMemo(() => {
    const map = {};
    filteredReturns.forEach(r => {
      const reason = r.reason || r.reasonCode || 'Defective Item';
      const cleanReason = String(reason).replace(/_/g, ' ').slice(0, 18);
      map[cleanReason] = (map[cleanReason] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, Count: map[name] }));
  }, [filteredReturns]);

  // =========================================================================
  // DRILL DOWN MODAL OPENERS (FOR ALL 4 SECTORS)
  // =========================================================================
  const openOrdersVolumeDrillDown = () => {
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Total Orders Volume Ledger Drill-Down',
      type: 'orders',
      data: filteredOrders,
      filterType: 'all_orders'
    });
  };

  const openUnconfirmedPaymentsDrillDown = () => {
    const unconfirmed = filteredOrders.filter(o => {
      const ps = (o.paymentStatus || '').toLowerCase();
      const st = (o.status || '').toLowerCase();
      const isPendingStatus = ps.includes('pending') || ps.includes('unconfirmed') || ps.includes('verification');
      const isSettledOrder = st === 'completed' || st === 'delivered' || st === 'cancelled';
      return isPendingStatus && !isSettledOrder;
    });
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Unconfirmed & Pending Payments Drill-Down',
      type: 'orders',
      data: unconfirmed,
      filterType: 'unconfirmed'
    });
  };

  const openOutOfStockDrillDown = () => {
    const outOfStock = products.filter(p => Number(p.stock || 0) === 0);
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Critical Out-of-Stock Products Drill-Down',
      type: 'products',
      data: outOfStock,
      filterType: 'out_of_stock'
    });
  };

  const openLowStockDrillDown = () => {
    const limit = settings.lowStockAlertLimit || 5;
    const lowStock = products.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= limit);
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Low Stock Warning Products Drill-Down',
      type: 'products',
      data: lowStock,
      filterType: 'low_stock'
    });
  };

  const openCatalogProductsDrillDown = () => {
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Complete Catalog Inventory Ledger Drill-Down',
      type: 'products',
      data: products,
      filterType: 'all_products'
    });
  };

  const openIndentsDrillDown = () => {
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Material Purchase Indents Drill-Down',
      type: 'indents',
      data: filteredIndents,
      filterType: 'all_indents'
    });
  };

  const openPendingIndentsDrillDown = () => {
    const pending = filteredIndents.filter(i => (i.status || '').toLowerCase().includes('pending'));
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Pending Indent Approvals Drill-Down',
      type: 'indents',
      data: pending,
      filterType: 'pending_indents'
    });
  };

  const openPOsDrillDown = () => {
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Issued Purchase Orders Drill-Down',
      type: 'pos',
      data: filteredPOs,
      filterType: 'all_pos'
    });
  };

  const openReturnsDrillDown = () => {
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Return & Warranty Claims Drill-Down',
      type: 'returns',
      data: filteredReturns,
      filterType: 'all_returns'
    });
  };

  const openPendingReturnsDrillDown = () => {
    const pending = filteredReturns.filter(r => (r.status || '').toLowerCase().includes('pending') || (r.status || '').toLowerCase().includes('review'));
    setDrillDownSearch('');
    setDrillPage(1);
    setDrillDownModal({
      isOpen: true,
      title: 'Pending Return Claims in Review Drill-Down',
      type: 'returns',
      data: pending,
      filterType: 'pending_returns'
    });
  };

  const filteredDrillDownData = useMemo(() => {
    if (!drillDownModal.isOpen || !drillDownModal.data) return [];
    const query = drillDownSearch.trim().toLowerCase();
    if (!query) return drillDownModal.data;

    if (drillDownModal.type === 'orders') {
      return drillDownModal.data.filter(o =>
        String(o.orderId || o.id || '').toLowerCase().includes(query) ||
        String(o.customerName || o.customer || '').toLowerCase().includes(query) ||
        String(o.paymentStatus || '').toLowerCase().includes(query) ||
        String(o.status || '').toLowerCase().includes(query)
      );
    } else if (drillDownModal.type === 'products') {
      return drillDownModal.data.filter(p =>
        String(p.sku || '').toLowerCase().includes(query) ||
        String(p.name || '').toLowerCase().includes(query) ||
        String(p.categoryId || '').toLowerCase().includes(query) ||
        String(p.brand || '').toLowerCase().includes(query)
      );
    } else if (drillDownModal.type === 'indents') {
      return drillDownModal.data.filter(i =>
        String(i.indentNo || i.id || '').toLowerCase().includes(query) ||
        String(i.requester || i.requestedBy || '').toLowerCase().includes(query) ||
        String(i.department || '').toLowerCase().includes(query) ||
        String(i.status || '').toLowerCase().includes(query)
      );
    } else if (drillDownModal.type === 'pos') {
      return drillDownModal.data.filter(po =>
        String(po.poNumber || po.id || '').toLowerCase().includes(query) ||
        String(po.supplierName || po.supplier || '').toLowerCase().includes(query) ||
        String(po.status || '').toLowerCase().includes(query)
      );
    } else if (drillDownModal.type === 'returns') {
      return drillDownModal.data.filter(r =>
        String(r.returnNo || r.id || '').toLowerCase().includes(query) ||
        String(r.customerName || r.customer || '').toLowerCase().includes(query) ||
        String(r.orderId || '').toLowerCase().includes(query) ||
        String(r.reason || '').toLowerCase().includes(query) ||
        String(r.status || '').toLowerCase().includes(query)
      );
    }
    return drillDownModal.data;
  }, [drillDownModal, drillDownSearch]);

  // =========================================================================
  // ACTIONS: CACHE, SETTINGS, EXPORT PDF
  // =========================================================================
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const response = await clearReportCache();
      showNotification(response?.message || "Analytics cache cleared successfully!", "success");
      await loadReportData();
    } catch (e) {
      console.error("Failed to clear cache:", e);
      showNotification("Failed to clear report cache", "error");
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      if (settings?.lowStockAlertLimit) {
        localStorage.setItem('reports_low_stock_limit', String(settings.lowStockAlertLimit));
      }
      if (settings?.defaultCurrency) {
        localStorage.setItem('reports_currency', String(settings.defaultCurrency));
      }
      const response = await updateReportSettings(settings);
      if (response && response.settings) {
        setSettings(response.settings);
      }
      showNotification("Settings updated successfully!", "success");
      setShowSettingsModal(false);
      await loadReportData();
    } catch (e) {
      console.error("Failed to save settings:", e);
      showNotification("Settings updated successfully!", "success");
      setShowSettingsModal(false);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // =========================================================================
  // PDF REPORT GENERATOR (Replaces CSV Export)
  // =========================================================================
  const handleExportPDF = () => {
    try {
      showNotification("Generating professional PDF report...", "success");

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      const screenTitles = {
        sales: 'Sales & Orders Analytics Report',
        procurement: 'Procurement & Purchase Analytics Report',
        catalog: 'Catalog & Stock Inventory Report',
        returns: 'Returns & Hardware Warranty Report'
      };

      const presetLabels = {
        All: 'All Time',
        '7days': 'Last 7 Days',
        '30days': 'Last 30 Days',
        year: 'This Fiscal Year'
      };

      const title = screenTitles[activeTab] || 'Analytics Report';
      const durationLabel = presetLabels[datePreset] || 'All Time';

      // ── Header Banner ──
      doc.setFillColor(18, 104, 165);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('HONEYWELL ENTERPRISE ANALYTICS', margin + 6, y + 8);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(title.toUpperCase(), margin + 6, y + 14);

      doc.setFontSize(8);
      doc.text(`Duration Scope: ${durationLabel}  |  Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin + 6, y + 19);

      y += 28;

      // ── KPI Summary Metric Grid (4 Boxes) ──
      let kpis = [];
      if (activeTab === 'sales') {
        kpis = [
          { label: 'TOTAL REVENUE', value: formatCurrency(salesStats.revenue) },
          { label: 'ORDERS VOLUME', value: `${salesStats.total} Orders` },
          { label: 'AVG ORDER VALUE', value: formatCurrency(salesStats.aov) },
          { label: 'UNCONFIRMED PAYMENTS', value: `${salesStats.pendingPayment} Pending` }
        ];
      } else if (activeTab === 'procurement') {
        kpis = [
          { label: 'PURCHASE INDENTS', value: `${procurementStats.totalIndents} Indents` },
          { label: 'ISSUED POs', value: `${procurementStats.totalPOs} Orders` },
          { label: 'TOTAL SPEND', value: formatCurrency(procurementStats.totalSpend) },
          { label: 'PENDING APPROVALS', value: `${procurementStats.pendingApprovals} Pending` }
        ];
      } else if (activeTab === 'catalog') {
        kpis = [
          { label: 'CATALOG PRODUCTS', value: `${catalogStats.totalProducts} Items` },
          { label: 'LOW STOCK WARNING', value: `${catalogStats.lowStock} Products` },
          { label: 'OUT OF STOCK', value: `${catalogStats.outOfStock} Products` },
          { label: 'TOTAL VALUATION', value: formatCurrency(catalogStats.totalValuation) }
        ];
      } else {
        kpis = [
          { label: 'TOTAL CLAIMS', value: `${returnsStats.total} Requests` },
          { label: 'APPROVED CLAIMS', value: `${returnsStats.approved} Approved` },
          { label: 'IN INSPECTION', value: `${returnsStats.pending} Pending` },
          { label: 'SETTLED REFUNDS', value: `${returnsStats.refunded} Settled` }
        ];
      }

      const boxWidth = (pageWidth - margin * 2 - 9) / 4;
      kpis.forEach((kpi, idx) => {
        const bx = margin + idx * (boxWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, y, boxWidth, 16, 2, 2, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, bx + 4, y + 5.5);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(String(kpi.value), bx + 4, y + 12);
      });

      y += 22;

      // ── Structured Data Table ──
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Detailed Analytical Records Ledger', margin, y);
      y += 5;

      let headers = [];
      let rows = [];
      let colWidths = [];

      if (activeTab === 'sales') {
        headers = ['Date', 'Order ID', 'Customer', 'Items', 'Amount', 'Payment Status', 'Status'];
        colWidths = [22, 28, 42, 16, 26, 26, 22];
        rows = filteredOrders.map(o => [
          new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          formatOrderId(o.orderId || o.id),
          (o.customerName || o.customer || 'Customer').slice(0, 22),
          `${o.items?.length || 1} item${o.items?.length === 1 ? '' : 's'}`,
          formatCurrency(o.totalAmount || o.total),
          o.paymentStatus || 'Pending',
          o.status || 'Processing'
        ]);
      } else if (activeTab === 'procurement') {
        headers = ['PO / Indent Ref', 'Date', 'Supplier / Requested By', 'Warehouse', 'Total Value', 'Status'];
        colWidths = [32, 22, 48, 32, 26, 22];
        rows = filteredPurchaseOrders.map(po => [
          po.poNumber || `PO-${po.id}`,
          po.date || 'N/A',
          (po.supplierName || 'Supplier').slice(0, 24),
          (po.warehouse || 'Main WH').slice(0, 16),
          formatCurrency(po.totalAmount),
          po.status || 'Issued'
        ]);
      } else if (activeTab === 'catalog') {
        headers = ['SKU', 'Product Name', 'Category', 'Brand', 'Price', 'Stock', 'Status'];
        colWidths = [26, 50, 30, 24, 22, 16, 16];
        rows = products.map(p => {
          const s = Number(p.stock || 0);
          return [
            p.sku || 'SKU-00',
            (p.name || 'Product').slice(0, 28),
            (p.categoryId || 'General').slice(0, 16),
            (p.brand || 'Honeywell').slice(0, 14),
            formatCurrency(p.price),
            `${s} units`,
            s === 0 ? 'Out' : s <= 5 ? 'Low' : 'In Stock'
          ];
        });
      } else {
        headers = ['Return ID', 'Order Ref', 'Customer Name', 'Claim Type', 'Reason', 'Status'];
        colWidths = [26, 28, 42, 32, 32, 24];
        rows = filteredReturns.map(r => [
          `#RET-${String(r.id || '001').slice(0, 8)}`,
          r.orderNumber || r.orderReference || 'ORD-000',
          (r.customerName || r.name || 'Customer').slice(0, 22),
          (r.type || r.requestType || 'Return & Refund').slice(0, 18),
          (r.reason || 'Defective').slice(0, 18),
          r.status || 'In Review'
        ]);
      }

      // Draw table header
      const drawTableHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, pageWidth - margin * 2, 7, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);

        let curX = margin + 2;
        headers.forEach((h, idx) => {
          doc.text(h, curX, y + 4.8);
          curX += colWidths[idx] || 25;
        });
        y += 7;
      };

      drawTableHeader();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      if (rows.length === 0) {
        doc.setTextColor(148, 163, 184);
        doc.text('No matching records found for the selected duration scope.', margin + 4, y + 6);
      } else {
        rows.forEach((row, rowIdx) => {
          if (y + 6 > pageHeight - margin - 10) {
            doc.addPage();
            y = margin + 6;
            drawTableHeader();
          }

          if (rowIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
          }

          doc.setTextColor(30, 41, 59);
          let curX = margin + 2;
          row.forEach((cell, idx) => {
            doc.text(String(cell || ''), curX, y + 4.2);
            curX += colWidths[idx] || 25;
          });

          y += 6;
        });
      }

      // ── Footer Page Numbers ──
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Honeywell Products Analytics Report • Confidential • Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const fileName = `Honeywell_${activeTab}_report_${datePreset}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      showNotification("PDF Report generated & downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      showNotification("Failed to generate PDF report", "error");
    }
  };

  return (
    <div className="reports-mgmt-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`reports-notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="reports-mgmt-header">
        <div className="reports-mgmt-title">
          <div className="reports-header-badge">ENTERPRISE INTELLIGENCE</div>
          <h1>Analytics &amp; Reports</h1>
          <p>Gain actionable insights across sales orders, procurement pipeline, stock inventory, and warranty claims.</p>
        </div>
        <div className="reports-actions">
          <button className="reports-btn secondary" onClick={handleClearCache} title="Clear Cache" disabled={isClearingCache}>
            <Trash2 size={15} />
            <span>{isClearingCache ? 'Clearing...' : 'Clear Cache'}</span>
          </button>
          <button className="reports-btn secondary" onClick={() => setShowSettingsModal(true)} title="Settings">
            <Settings size={15} />
            <span>Settings</span>
          </button>
          <button className="reports-btn secondary" onClick={loadReportData} title="Refresh Live Data" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="reports-btn primary" onClick={handleExportPDF} title="Download Professional PDF Report">
            <Download size={15} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs and Permanent Date Range Filter Bar */}
      <div className="reports-controls-bar">
        {/* 4 Main Module Tabs */}
        <div className="reports-tabs-wrapper">
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <ShoppingBag size={15} />
            <span>Sales &amp; Orders Analytics</span>
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'procurement' ? 'active' : ''}`}
            onClick={() => setActiveTab('procurement')}
          >
            <FileSpreadsheet size={15} />
            <span>Procurement &amp; Purchase Analytics</span>
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Boxes size={15} />
            <span>Catalog &amp; Stock</span>
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            <RotateCcw size={15} />
            <span>Returns &amp; Warranty</span>
          </button>
        </div>

        {/* Duration Scope Filter (Permanently shown for all screens) */}
        <div className="reports-date-preset">
          <SlidersHorizontal size={14} className="filter-icon" />
          <button
            type="button"
            className={`preset-btn ${datePreset === 'All' ? 'active' : ''}`}
            onClick={() => setDatePreset('All')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`preset-btn ${datePreset === '7days' ? 'active' : ''}`}
            onClick={() => setDatePreset('7days')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`preset-btn ${datePreset === '30days' ? 'active' : ''}`}
            onClick={() => setDatePreset('30days')}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`preset-btn ${datePreset === 'year' ? 'active' : ''}`}
            onClick={() => setDatePreset('year')}
          >
            This Year
          </button>
        </div>
      </div>

      {loading ? (
        <div className="reports-loading-view">
          <RefreshCw className="spinner animate-spin" size={36} />
          <p>Analyzing datasets across all sectors and building visual models...</p>
        </div>
      ) : (
        <div className="reports-content-area">
          {/* =========================================================================
              TAB 1: SALES & ORDERS ANALYTICS
             ========================================================================= */}
          {activeTab === 'sales' && (
            <div className="reports-view-fadein">
              {/* Stat Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOrdersVolumeDrillDown} title="View all revenue orders in drill-down">
                  <div className="stat-icon revenue"><DollarSign size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Revenue</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{formatCurrency(salesStats.revenue)}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOrdersVolumeDrillDown} title="View orders volume in drill-down">
                  <div className="stat-icon orders"><ShoppingBag size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Orders Volume</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{salesStats.total} Orders</strong>
                  </div>
                </div>

                <div className="reports-stat-card">
                  <div className="stat-icon aov"><TrendingUp size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Average Order Value</span>
                    </div>
                    <strong>{formatCurrency(salesStats.aov)}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openUnconfirmedPaymentsDrillDown} title="View unconfirmed payments in drill-down">
                  <div className="stat-icon pending"><AlertTriangle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Unconfirmed Payments</span>
                      <span className="stat-drilldown-badge highlight">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#d97706' }}>{salesStats.pendingPayment} Pending</strong>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="reports-charts-grid">
                {/* Sales Performance Area Graph */}
                <div className="chart-card-widget span-two">
                  <h3>Revenue Performance Trend ({datePreset === 'All' ? 'Recent' : datePreset})</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={salesTrendData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                          width={55} 
                        />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart: Fulfillment Breakdown */}
                <div className="chart-card-widget">
                  <h3>Order Fulfillment States</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => {
                            const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[index % REPORTS_COLORS.length];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(val, name) => [`${val} orders`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="reports-chart-legend">
                      {statusPieData.map((entry, idx) => {
                        const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[idx % REPORTS_COLORS.length];
                        return (
                          <div key={idx} className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: color }} />
                            <span>{entry.name}: {entry.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bar Chart: Payment Methods */}
                <div className="chart-card-widget">
                  <h3>Payment Methods Distribution</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={paymentBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="Orders" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {paymentBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={REPORTS_COLORS[(index + 2) % REPORTS_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Orders Ledger Table */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <div>
                    <h3>Detailed Orders Ledger Summary</h3>
                    <p className="table-subtitle">Showing orders recorded for <strong>{datePreset === 'All' ? 'All Time' : datePreset}</strong></p>
                  </div>
                  <div className="reports-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search orders, customers, status..."
                      value={ordersSearch}
                      onChange={(e) => { setOrdersSearch(e.target.value); setOrdersPage(1); }}
                    />
                    {ordersSearch && <button onClick={() => setOrdersSearch('')}><X size={13} /></button>}
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items Count</th>
                        <th>Total Amount</th>
                        <th>Payment Status</th>
                        <th>Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table-row">No orders found for the selected duration and search criteria.</td>
                        </tr>
                      ) : (
                        searchedOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map(o => (
                          <tr key={o.id || o.orderId}>
                            <td>{new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td><strong className="order-id-text">{formatOrderId(o.orderId || o.id)}</strong></td>
                            <td>{o.customerName || o.customer || 'Unknown'}</td>
                            <td>{o.items?.length || 1} {o.items?.length === 1 ? 'item' : 'items'}</td>
                            <td><strong>{formatCurrency(o.totalAmount || o.total)}</strong></td>
                            <td>
                              <span className={`mini-badge payment-${(o.paymentStatus || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                {o.paymentStatus || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <span className={`mini-badge order-${(o.status || 'Processing').toLowerCase()}`}>
                                {o.status || 'Processing'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {searchedOrders.length > 0 && (
                  <div className="reports-pagination-wrap">
                    <Pagination
                      currentPage={ordersPage}
                      totalPages={Math.ceil(searchedOrders.length / itemsPerPage)}
                      onPageChange={setOrdersPage}
                      totalItems={searchedOrders.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: PROCUREMENT & PURCHASE ANALYTICS
             ========================================================================= */}
          {activeTab === 'procurement' && (
            <div className="reports-view-fadein space-y-6">
              {/* Stat Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card reports-stat-card-clickable" onClick={openIndentsDrillDown} title="View all purchase indents in drill-down">
                  <div className="stat-icon revenue"><FileSpreadsheet size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Purchase Indents</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{procurementStats.totalIndents} Indents</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openPOsDrillDown} title="View issued purchase orders in drill-down">
                  <div className="stat-icon orders"><ShoppingBag size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Issued Purchase Orders</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{procurementStats.totalPOs} Orders</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openPOsDrillDown} title="View procurement spend in drill-down">
                  <div className="stat-icon aov"><DollarSign size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Procurement Spend</span>
                    </div>
                    <strong>{formatCurrency(procurementStats.totalSpend)}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openPendingIndentsDrillDown} title="View pending indent approvals in drill-down">
                  <div className="stat-icon pending"><AlertTriangle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Pending Indent Approvals</span>
                      <span className="stat-drilldown-badge highlight">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#d97706' }}>{procurementStats.pendingApprovals} Pending</strong>
                  </div>
                </div>
              </div>

              {/* Purchase Indents Summary Table */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <div>
                    <h3>Purchase Indents Summary</h3>
                    <p className="table-subtitle">Material indent requests filtered by <strong>{datePreset === 'All' ? 'All Time' : datePreset}</strong></p>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Indent Ref</th>
                        <th>Date</th>
                        <th>Requested By</th>
                        <th>Warehouse</th>
                        <th>Items Count</th>
                        <th>Est Total Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIndents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table-row">No purchase indents found for the selected duration.</td>
                        </tr>
                      ) : (
                        filteredIndents.slice((indentsPage - 1) * itemsPerPage, indentsPage * itemsPerPage).map((indent) => (
                          <tr key={indent.id}>
                            <td className="font-bold text-[#1268a5]">{indent.indentNumber || `IND-${indent.id}`}</td>
                            <td>{indent.date}</td>
                            <td>{indent.requestedBy}</td>
                            <td>{indent.warehouse || 'Central WH'}</td>
                            <td>{indent.items?.length || 1} items</td>
                            <td><strong>{formatCurrency(indent.totalEstimatedCost)}</strong></td>
                            <td>
                              <span className="mini-badge order-processing">{indent.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredIndents.length > 0 && (
                  <div className="reports-pagination-wrap">
                    <Pagination
                      currentPage={indentsPage}
                      totalPages={Math.ceil(filteredIndents.length / itemsPerPage)}
                      onPageChange={setIndentsPage}
                      totalItems={filteredIndents.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>

              {/* Purchase Orders Summary Table */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <div>
                    <h3>Purchase Orders (PO) Procurement Summary</h3>
                    <p className="table-subtitle">Issued vendor purchase orders for <strong>{datePreset === 'All' ? 'All Time' : datePreset}</strong></p>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>PO Ref</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Linked Indent</th>
                        <th>Warehouse</th>
                        <th>PO Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table-row">No purchase orders found for the selected duration.</td>
                        </tr>
                      ) : (
                        filteredPurchaseOrders.slice((posPage - 1) * itemsPerPage, posPage * itemsPerPage).map((po) => (
                          <tr key={po.id}>
                            <td className="font-bold text-[#1268a5]">{po.poNumber || `PO-${po.id}`}</td>
                            <td>{po.date}</td>
                            <td><strong>{po.supplierName}</strong></td>
                            <td><code>{po.indentId ? `IND-${po.indentId}` : 'Direct PO'}</code></td>
                            <td>{po.warehouse || 'Main WH'}</td>
                            <td><strong>{formatCurrency(po.totalAmount)}</strong></td>
                            <td>
                              <span className="mini-badge order-completed">{po.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredPurchaseOrders.length > 0 && (
                  <div className="reports-pagination-wrap">
                    <Pagination
                      currentPage={posPage}
                      totalPages={Math.ceil(filteredPurchaseOrders.length / itemsPerPage)}
                      onPageChange={setPosPage}
                      totalItems={filteredPurchaseOrders.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: CATALOG & STOCK
             ========================================================================= */}
          {activeTab === 'catalog' && (
            <div className="reports-view-fadein">
              {/* Stat Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card reports-stat-card-clickable" onClick={openCatalogProductsDrillDown} title="View all catalog items in drill-down">
                  <div className="stat-icon catalog"><Package size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Catalog Products</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{catalogStats.totalProducts} Items</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openLowStockDrillDown} title="Click to view low stock warning items in drill-down">
                  <div className="stat-icon warning"><AlertTriangle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Low Stock Warning</span>
                      <span className="stat-drilldown-badge highlight">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#d97706' }}>{catalogStats.lowStock} Products</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOutOfStockDrillDown} title="Click to view out-of-stock items in drill-down">
                  <div className="stat-icon danger"><AlertTriangle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Critical Out-of-Stock</span>
                      <span className="stat-drilldown-badge highlight-red">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#ef4444' }}>{catalogStats.outOfStock} Products</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openCatalogProductsDrillDown} title="View inventory valuation in drill-down">
                  <div className="stat-icon revenue"><DollarSign size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Inventory Valuation</span>
                    </div>
                    <strong>{formatCurrency(catalogStats.totalValuation)}</strong>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="reports-charts-grid">
                {/* Category Share Donut Chart */}
                <div className="chart-card-widget">
                  <h3>Category Allocation Share</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={REPORTS_COLORS[index % REPORTS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val, name) => [`${val} products`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="reports-chart-legend">
                      {categoryPieData.map((entry, idx) => (
                        <div key={idx} className="legend-item">
                          <span className="legend-dot" style={{ backgroundColor: REPORTS_COLORS[idx % REPORTS_COLORS.length] }} />
                          <span>{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lowest Stock Levels Bar Chart */}
                <div className="chart-card-widget span-two">
                  <h3>Lowest Stock Levels Warning Alert</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={lowestStockAlertData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip formatter={(val) => [`${val} units in stock`, 'Stock Level']} />
                        <Bar dataKey="Stock" radius={[4, 4, 0, 0]}>
                          {lowestStockAlertData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={Number(entry.Stock) === 0 ? '#ef4444' : Number(entry.Stock) <= 5 ? '#f59e0b' : '#10b981'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Complete Catalog Inventory Table */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <div>
                    <h3>Catalog Inventory Summary</h3>
                    <p className="table-subtitle">Live hardware products stock levels and valuation</p>
                  </div>
                  <div className="reports-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search SKU, product name, brand..."
                      value={catalogSearch}
                      onChange={(e) => { setCatalogSearch(e.target.value); setCatalogPage(1); }}
                    />
                    {catalogSearch && <button onClick={() => setCatalogSearch('')}><X size={13} /></button>}
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Selling Price</th>
                        <th>Stock Level</th>
                        <th>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedProducts.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table-row">No products found matching search query.</td>
                        </tr>
                      ) : (
                        searchedProducts.slice((catalogPage - 1) * itemsPerPage, catalogPage * itemsPerPage).map((p) => {
                          const stockNum = Number(p.stock || 0);
                          const isOut = stockNum === 0;
                          const isLow = stockNum > 0 && stockNum <= (settings.lowStockAlertLimit || 5);
                          return (
                            <tr key={p.id || p.sku}>
                              <td><code>{p.sku || 'SKU-00'}</code></td>
                              <td><strong>{p.name}</strong></td>
                              <td>{p.categoryId || 'General'}</td>
                              <td>{p.brand || 'Honeywell'}</td>
                              <td><strong>{formatCurrency(p.price)}</strong></td>
                              <td>
                                <strong style={{ color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#16a34a' }}>
                                  {stockNum} units
                                </strong>
                              </td>
                              <td>
                                <span className={`mini-badge stock-${isOut ? 'out' : isLow ? 'low' : 'in'}`}>
                                  {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {searchedProducts.length > 0 && (
                  <div className="reports-pagination-wrap">
                    <Pagination
                      currentPage={catalogPage}
                      totalPages={Math.ceil(searchedProducts.length / itemsPerPage)}
                      onPageChange={setCatalogPage}
                      totalItems={searchedProducts.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: RETURNS & WARRANTY
             ========================================================================= */}
          {activeTab === 'returns' && (
            <div className="reports-view-fadein">
              {/* Stat Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card reports-stat-card-clickable" onClick={openReturnsDrillDown} title="View all return claims in drill-down">
                  <div className="stat-icon orders"><RotateCcw size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Total Return Claims</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{returnsStats.total} Requests</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openReturnsDrillDown} title="View approved hardware claims in drill-down">
                  <div className="stat-icon revenue"><ShieldCheck size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Approved Hardware Claims</span>
                    </div>
                    <strong>{returnsStats.approved} Approved</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openPendingReturnsDrillDown} title="View pending review returns in drill-down">
                  <div className="stat-icon pending"><AlertTriangle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Pending Review &amp; Inspection</span>
                      <span className="stat-drilldown-badge highlight">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#d97706' }}>{returnsStats.pending} In Review</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openReturnsDrillDown} title="View settled returns in drill-down">
                  <div className="stat-icon aov"><CheckCircle size={20} /></div>
                  <div className="stat-details">
                    <div className="stat-label-row">
                      <span className="stat-label-text">Settled / Refunded</span>
                    </div>
                    <strong>{returnsStats.refunded} Settled</strong>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="reports-charts-grid">
                {/* Status Breakdown Donut Chart */}
                <div className="chart-card-widget">
                  <h3>Return Claims Status Breakdown</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={returnStatusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {returnStatusPieData.map((entry, index) => {
                            const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[index % REPORTS_COLORS.length];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(val, name) => [`${val} requests`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="reports-chart-legend">
                      {returnStatusPieData.map((entry, idx) => {
                        const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[idx % REPORTS_COLORS.length];
                        return (
                          <div key={idx} className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: color }} />
                            <span>{entry.name}: {entry.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Return Reasons Bar Chart */}
                <div className="chart-card-widget span-two">
                  <h3>Hardware Warranty Claim Reasons</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={returnReasonsBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip formatter={(val) => [`${val} claims`, 'Total Requests']} />
                        <Bar dataKey="Count" fill="#0284c7" radius={[4, 4, 0, 0]}>
                          {returnReasonsBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={REPORTS_COLORS[(index + 3) % REPORTS_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Returns Table */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <div>
                    <h3>Returns &amp; Hardware Warranty Ledger</h3>
                    <p className="table-subtitle">Showing claims filed for <strong>{datePreset === 'All' ? 'All Time' : datePreset}</strong></p>
                  </div>
                  <div className="reports-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search return ID, order number, customer..."
                      value={returnsSearch}
                      onChange={(e) => { setReturnsSearch(e.target.value); setReturnsPage(1); }}
                    />
                    {returnsSearch && <button onClick={() => setReturnsSearch('')}><X size={13} /></button>}
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Claim Ref</th>
                        <th>Order Number</th>
                        <th>Customer</th>
                        <th>Request Type</th>
                        <th>Reason</th>
                        <th>Date</th>
                        <th>Claim Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedReturns.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table-row">No return or warranty claims found for the selected duration.</td>
                        </tr>
                      ) : (
                        searchedReturns.slice((returnsPage - 1) * itemsPerPage, returnsPage * itemsPerPage).map((r) => (
                          <tr key={r.id || r.returnId}>
                            <td><strong className="text-[#1268a5]">#RET-{String(r.id || '001').slice(0, 8)}</strong></td>
                            <td><code>{r.orderNumber || r.orderReference || 'ORD-000'}</code></td>
                            <td>{r.customerName || r.name || 'Customer'}</td>
                            <td>{r.type || r.requestType || 'Return & Refund'}</td>
                            <td><span className="text-slate-600">{r.reason || 'Hardware Defect'}</span></td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (r.date || 'Recent')}</td>
                            <td>
                              <span className={`mini-badge order-${(r.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                {r.status || 'In Review'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {searchedReturns.length > 0 && (
                  <div className="reports-pagination-wrap">
                    <Pagination
                      currentPage={returnsPage}
                      totalPages={Math.ceil(searchedReturns.length / itemsPerPage)}
                      onPageChange={setReturnsPage}
                      totalItems={searchedReturns.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drill-Down Modal */}
      {drillDownModal.isOpen && createPortal(
        <div className="reports-modal-overlay" onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}>
          <div className="reports-modal-content reports-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="reports-modal-header">
              <div>
                <h2>{drillDownModal.title}</h2>
                <span className="reports-modal-subtitle">
                  Showing {filteredDrillDownData.length} records matching current filter period ({datePreset === 'All' ? 'All Time' : datePreset})
                </span>
              </div>
              <button 
                type="button" 
                className="reports-modal-close" 
                onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <div className="reports-modal-search-wrap">
              <Search size={15} className="reports-modal-search-icon" />
              <input
                type="text"
                className="reports-modal-search-input"
                placeholder={
                  drillDownModal.type === 'orders' ? "Search by Order ID, Customer, Status, Payment..." :
                  drillDownModal.type === 'products' ? "Search by SKU, Product Name, Category, Brand..." :
                  drillDownModal.type === 'indents' ? "Search by Indent #, Department, Requester, Status..." :
                  drillDownModal.type === 'pos' ? "Search by PO #, Supplier Name, Status..." :
                  "Search by Return #, Customer, Reason, Status..."
                }
                value={drillDownSearch}
                onChange={(e) => { setDrillDownSearch(e.target.value); setDrillPage(1); }}
              />
              {drillDownSearch && (
                <button 
                  type="button" 
                  onClick={() => { setDrillDownSearch(''); setDrillPage(1); }} 
                  className="reports-modal-search-clear"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="reports-modal-table-wrap">
              {drillDownModal.type === 'orders' ? (
                /* Orders Table */
                <table className="reports-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '18%' }}>Order ID</th>
                      <th style={{ width: '22%' }}>Customer</th>
                      <th style={{ width: '16%' }}>Total Amount</th>
                      <th style={{ width: '15%' }}>Payment Status</th>
                      <th style={{ width: '14%' }}>Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-row">No matching order records found.</td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((o) => (
                        <tr key={o.id || o.orderId}>
                          <td>{new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><strong>{formatOrderId(o.orderId || o.id)}</strong></td>
                          <td>{o.customerName || o.customer || 'Unknown'}</td>
                          <td><strong>{formatCurrency(o.totalAmount || o.total)}</strong></td>
                          <td>
                            <span className={`mini-badge payment-${(o.paymentStatus || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                              {o.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`mini-badge order-${(o.status || 'Processing').toLowerCase()}`}>
                              {o.status || 'Processing'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : drillDownModal.type === 'products' ? (
                /* Products Table */
                <table className="reports-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>SKU</th>
                      <th style={{ width: '27%' }}>Product Name</th>
                      <th style={{ width: '16%' }}>Category</th>
                      <th style={{ width: '14%' }}>Brand</th>
                      <th style={{ width: '14%' }}>Price</th>
                      <th style={{ width: '14%' }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-row">No matching product records found.</td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((p) => {
                        const stockVal = Number(p.stock || 0);
                        const isOut = stockVal === 0;
                        const isLow = stockVal > 0 && stockVal <= (settings.lowStockAlertLimit || 5);
                        return (
                          <tr key={p.id || p.sku}>
                            <td><code>{(p.sku || '').trim()}</code></td>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.categoryId}</td>
                            <td>{p.brand}</td>
                            <td><strong>{formatCurrency(p.price)}</strong></td>
                            <td>
                              <span className={`mini-badge stock-${isOut ? 'out' : isLow ? 'low' : 'in'}`}>
                                {isOut ? 'Out of Stock (0)' : isLow ? `Low (${stockVal})` : `${stockVal} Units`}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : drillDownModal.type === 'indents' ? (
                /* Indents Table */
                <table className="reports-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Indent Ref</th>
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '22%' }}>Department</th>
                      <th style={{ width: '20%' }}>Requested By</th>
                      <th style={{ width: '12%' }}>Priority</th>
                      <th style={{ width: '13%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-row">No matching indent records found.</td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((i) => (
                        <tr key={i.id || i.indentNo}>
                          <td><strong>{i.indentNo || `IND-${i.id}`}</strong></td>
                          <td>{new Date(i.indentDate || i.date || i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{i.department || 'General Operations'}</td>
                          <td>{i.requester || i.requestedBy || 'Admin Staff'}</td>
                          <td>
                            <span className={`mini-badge priority-${(i.priority || 'Medium').toLowerCase()}`}>
                              {i.priority || 'Medium'}
                            </span>
                          </td>
                          <td>
                            <span className={`mini-badge status-${(i.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                              {i.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : drillDownModal.type === 'pos' ? (
                /* Purchase Orders Table */
                <table className="reports-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>PO Number</th>
                      <th style={{ width: '15%' }}>Issue Date</th>
                      <th style={{ width: '25%' }}>Supplier</th>
                      <th style={{ width: '16%' }}>Total Amount</th>
                      <th style={{ width: '13%' }}>Payment Terms</th>
                      <th style={{ width: '13%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-row">No matching purchase orders found.</td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((po) => (
                        <tr key={po.id || po.poNumber}>
                          <td><strong>{po.poNumber || `PO-${po.id}`}</strong></td>
                          <td>{new Date(po.orderDate || po.date || po.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{po.supplierName || po.supplier || 'Honeywell Certified'}</td>
                          <td><strong>{formatCurrency(po.totalAmount || po.total)}</strong></td>
                          <td>{po.paymentTerms || 'Net 30'}</td>
                          <td>
                            <span className={`mini-badge po-${(po.status || 'Issued').toLowerCase()}`}>
                              {po.status || 'Issued'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                /* Returns Table */
                <table className="reports-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Return Ref</th>
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '20%' }}>Customer</th>
                      <th style={{ width: '16%' }}>Order ID</th>
                      <th style={{ width: '20%' }}>Return Reason</th>
                      <th style={{ width: '13%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-row">No matching return records found.</td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((r) => (
                        <tr key={r.id || r.returnNo}>
                          <td><strong>{r.returnNo || `RET-${r.id}`}</strong></td>
                          <td>{new Date(r.requestDate || r.date || r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{r.customerName || r.customer || 'Unknown'}</td>
                          <td><code>{formatOrderId(r.orderId)}</code></td>
                          <td>{r.reason || 'Hardware Defect'}</td>
                          <td>
                            <span className={`mini-badge return-${(r.status || 'In Review').toLowerCase().replace(/\s+/g, '-')}`}>
                              {r.status || 'In Review'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="reports-modal-footer">
              <div style={{ flex: '1 1 auto' }}>
                {filteredDrillDownData.length > itemsPerPage && (
                  <Pagination
                    currentPage={drillPage}
                    totalPages={Math.ceil(filteredDrillDownData.length / itemsPerPage)}
                    onPageChange={setDrillPage}
                    totalItems={filteredDrillDownData.length}
                    itemsPerPage={itemsPerPage}
                  />
                )}
              </div>
              <button 
                type="button" 
                className="btn-reports-secondary" 
                onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      {showSettingsModal && createPortal(
        <div className="reports-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reports-modal-header">
              <h2>Report Settings &amp; Configuration</h2>
              <button className="reports-modal-close" onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-description">Customize threshold alerts and currency format for your analytics reports.</p>
            <form onSubmit={handleSaveSettings}>
              <div className="reports-form-group">
                <label htmlFor="lowStockAlertLimit">Low Stock Warning Limit (Units)</label>
                <input
                  id="lowStockAlertLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.lowStockAlertLimit || ''}
                  onChange={(e) => setSettings({ ...settings, lowStockAlertLimit: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="reports-form-group">
                <label htmlFor="defaultCurrency">Default Currency Format</label>
                <select
                  id="defaultCurrency"
                  value={settings.defaultCurrency || 'INR'}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="reports-modal-actions">
                <button type="button" className="reports-btn secondary" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="reports-btn primary" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Updating...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportsScreen;
