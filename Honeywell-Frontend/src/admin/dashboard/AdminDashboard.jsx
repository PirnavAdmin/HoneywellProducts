import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Truck,
  Boxes,
  Users,
  Clock3,
  CreditCard,
  FileText,
  Package,
  Shield,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { getOrders } from '../api/orders';
import { fetchProducts, fetchCategories } from '../catalog/productsApi';
import { fetchSuppliers } from '../suppliers/suppliersApi';
import { getStaffStats } from '../../services/staffApi';
import './AdminDashboard.css';

const numberFormatter = new Intl.NumberFormat('en-IN');
const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'INR 0';
  let numericValue = value;
  if (typeof value === 'string') {
    const cleanStr = value.replace(/[^0-9.-]+/g, '');
    numericValue = cleanStr ? parseFloat(cleanStr) : 0;
  }
  const num = Number(numericValue);
  return `INR ${isNaN(num) ? '0' : numberFormatter.format(num)}`;
};


const statusIconMap = {
  Pending: Clock3,
  Processing: CheckCircle2,
  Confirmed: CheckCircle2,
  'On Hold': Clock3,
  Completed: CheckCircle2,
  Canceled: XCircle,
  Cancelled: XCircle,
  Packed: Package,
  Dispatched: Truck,
  Shipped: Truck,
};

const PaymentStatusBadge = ({ paymentStatus, isCancelled }) => {
  const rawPs = paymentStatus || 'Pending';
  const rawUpper = String(rawPs).trim().toUpperCase();
  let ps = isCancelled && (rawUpper === 'PENDING' || rawUpper === 'UNPAID') ? 'Payment Not Applicable' : rawPs;
  if (ps === 'Verified Paid' || ps === 'Paid' || ps === 'Success' || ps === 'Paid Verified') {
    ps = 'Verified';
  }

  let Icon = Clock3;
  let statusClass = 'pay-status--pending';

  const normalizedPs = ps.toUpperCase();

  if (normalizedPs === 'VERIFIED' || normalizedPs === 'VERIFIED PAID' || normalizedPs === 'PAID' || normalizedPs === 'SUCCESS' || normalizedPs === 'PAID VERIFIED') {
    Icon = ShieldCheck;
    statusClass = 'pay-status--verified';
  } else if (normalizedPs === 'PENDING VERIFICATION' || normalizedPs === 'PENDINGVERIFICATION' || normalizedPs === 'PENDING') {
    Icon = Clock3;
    statusClass = 'pay-status--pending';
  } else if (normalizedPs === 'REFUNDED') {
    Icon = AlertCircle;
    statusClass = 'pay-status--refunded';
  } else if (normalizedPs === 'PAYMENT NOT APPLICABLE' || normalizedPs === 'N/A') {
    Icon = AlertCircle;
    statusClass = 'pay-status--na';
  } else if (normalizedPs === 'CANCELLED' || normalizedPs === 'CANCELED') {
    Icon = XCircle;
    statusClass = 'pay-status--cancelled';
  }

  return (
    <span className={`pay-status-pill ${statusClass}`}>
      <Icon size={12} aria-hidden="true" />
      <span>{ps}</span>
    </span>
  );
};

const statusClassName = (status) => {
  const s = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  if (s === 'cancelled' || s === 'canceled') return 'canceled';
  return s;
};

/* Custom Chart Tooltip */
const CustomChartTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const displayVal = isCurrency ? formatCurrency(data.value) : `${data.value} ${data.name ? `(${data.name})` : ''}`;
    return (
      <div className="custom-chart-tooltip">
        <span className="tooltip-label">{label || data.name}</span>
        <strong className="tooltip-value">{displayVal}</strong>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, categoriesData, suppliersData, staffStats] = await Promise.all([
        getOrders().catch(() => []),
        fetchProducts().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => []),
        getStaffStats().catch(() => null)
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);

      const count = staffStats?.totalStaff ?? staffStats?.totalCount ?? 0;
      setStaffCount(count);
    } catch (error) {
      console.error("Dashboard loading error", error);
      setOrders([]);
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
      setStaffCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute key summary statistics
  const metrics = useMemo(() => {
    const isCancelled = (st) => {
      const s = String(st || '').trim().toUpperCase();
      return s === 'CANCELLED' || s === 'CANCELED';
    };

    const isActive = (st) => {
      const s = String(st || '').trim().toUpperCase();
      return s === 'PROCESSING' || s === 'PACKED' || s === 'DISPATCHED' || s === 'SHIPPED' || s === 'CONFIRMED' || s === 'PLACED';
    };

    const isCompleted = (st) => {
      const s = String(st || '').trim().toUpperCase();
      return s === 'COMPLETED' || s === 'DELIVERED';
    };

    const totalSalesVal = orders
      .filter(o => !isCancelled(o.status))
      .reduce((sum, o) => {
        const cleanAmount = o.totalAmount ? Number(String(o.totalAmount).replace(/[^0-9.-]+/g, "")) : 0;
        return sum + cleanAmount;
      }, 0);

    const activeOrdersCount = orders.filter(o => isActive(o.status)).length;
    const lowStockCount = products.filter(p => {
      const s = String(p.status || '').trim().toLowerCase();
      return s === 'low stock' || s === 'out of stock';
    }).length;
    const newSuppliersCount = suppliers.filter(s => {
      const st = String(s.status || '').trim().toLowerCase();
      return st === 'pending' || st === 'new' || st === 'review';
    }).length;

    const completedOrders = orders.filter(o => isCompleted(o.status)).length;
    const totalNonCanceled = orders.filter(o => !isCancelled(o.status)).length;
    const fulfillmentRate = totalNonCanceled > 0 ? Math.round((completedOrders / totalNonCanceled) * 100) : 0;

    return {
      totalSales: totalSalesVal,
      totalOrders: orders.length,
      productsCount: products.length,
      suppliersCount: suppliers.length,
      activeOrdersCount,
      lowStockCount,
      newSuppliersCount,
      fulfillmentRate
    };
  }, [orders, products, suppliers]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const s = String(p.status || '').trim().toLowerCase();
      return s === 'low stock' || s === 'out of stock';
    });
  }, [products]);

  // Sales series data for chart
  const salesSeriesData = useMemo(() => {
    if (orders.length === 0) {
      return [{ name: 'Today', value: 0 }];
    }
    const dailySalesMap = {};
    orders.forEach(o => {
      const s = String(o.status || '').trim().toUpperCase();
      if (s === 'CANCELLED' || s === 'CANCELED') return;
      const date = o.orderDate ? new Date(o.orderDate) : new Date();
      const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const cleanAmount = o.totalAmount ? Number(String(o.totalAmount).replace(/[^0-9.-]+/g, "")) : 0;
      dailySalesMap[label] = (dailySalesMap[label] || 0) + cleanAmount;
    });

    const series = Object.entries(dailySalesMap).map(([name, value]) => ({ name, value }));
    return series.length > 0 ? series : [{ name: 'Today', value: metrics.totalSales }];
  }, [orders, metrics.totalSales]);

  // Order status series data
  const orderStatusSeriesData = useMemo(() => {
    if (orders.length === 0) {
      return [];
    }
    const counts = { Pending: 0, Processing: 0, Dispatched: 0, Completed: 0, Canceled: 0 };
    orders.forEach(o => {
      const s = String(o.status || 'Pending').trim().toUpperCase();
      if (s === 'CANCELLED' || s === 'CANCELED') counts.Canceled++;
      else if (s === 'COMPLETED' || s === 'DELIVERED') counts.Completed++;
      else if (s === 'DISPATCHED' || s === 'SHIPPED') counts.Dispatched++;
      else if (s === 'PROCESSING' || s === 'PACKED' || s === 'CONFIRMED' || s === 'PLACED') counts.Processing++;
      else counts.Pending++;
    });

    const colors = { Pending: '#f59e0b', Processing: '#0284c7', Dispatched: '#6366f1', Completed: '#10b981', Canceled: '#ef4444' };
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: colors[name] }))
      .filter(item => item.value > 0);
  }, [orders]);

  // Category series data
  const categorySeriesData = useMemo(() => {
    if (products.length === 0) {
      return [];
    }
    const counts = {};
    products.forEach(p => {
      const cat = categories.find(c => String(c.id) === String(p.categoryId));
      const name = cat ? cat.name : 'General';
      counts[name] = (counts[name] || 0) + 1;
    });

    const colors = ['#1268a5', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [categories, products]);

  // Activity list for audit trail
  const recentActivitiesList = useMemo(() => {
    const list = [];
    if (orders.length > 0) {
      const firstOrder = orders[0];
      list.push({
        time: 'Recently',
        title: 'Order Placed',
        detail: `${firstOrder.customerName || 'Customer'} placed order #${firstOrder.id || firstOrder.orderId || 1} of ${formatCurrency(firstOrder.totalAmount || 0)}`
      });
    }

    if (products.length > 0) {
      const firstProd = products[0];
      list.push({
        time: 'Catalog',
        title: 'Product In Inventory',
        detail: `${firstProd.name} (SKU: ${firstProd.sku || 'N/A'}) is recorded in catalog.`
      });
    }

    if (suppliers.length > 0) {
      const firstSup = suppliers[0];
      list.push({
        time: 'Suppliers',
        title: 'Supplier Registered',
        detail: `${firstSup.name} category: ${firstSup.category || 'General'}.`
      });
    }

    if (list.length === 0) {
      list.push({
        time: 'Live State',
        title: 'No Live Activities Recorded',
        detail: 'Connect backend server or place transactions to view real-time events.'
      });
    }

    return list;
  }, [orders, products, suppliers]);

  // System insights list
  const systemInsights = useMemo(() => {
    const list = [];
    if (metrics.lowStockCount > 0) {
      list.push({ type: 'warning', text: `${metrics.lowStockCount} products are below reorder stock levels` });
    }
    if (metrics.newSuppliersCount > 0) {
      list.push({ type: 'info', text: `${metrics.newSuppliersCount} supplier applications are pending verification review` });
    }
    const pendingVerificationOrders = orders.filter(o => 
      ['PENDING VERIFICATION', 'PENDINGVERIFICATION'].includes(String(o.paymentStatus || '').trim().toUpperCase())
    ).length;
    if (pendingVerificationOrders > 0) {
      list.push({ type: 'warning', text: `${pendingVerificationOrders} orders require manual payment receipt UTR verification` });
    }
    if (list.length === 0) {
      return [{ type: 'info', text: 'All operations running normally across all Honeywell modules' }];
    }
    return list;
  }, [metrics, orders]);

  // PDF Exporter (Generates Comprehensive Dashboard Executive Report)
  const handleExportPDF = () => {
    try {
      setExporting(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // ── Header Banner (Honeywell Brand Blue) ──
      doc.setFillColor(18, 104, 165);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('HONEYWELL STOREFRONT MANAGEMENT CONSOLE', margin + 6, y + 8);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('EXECUTIVE DASHBOARD SUMMARY & OPERATIONS REPORT', margin + 6, y + 14.5);

      doc.setFontSize(7.5);
      const genDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Live Storefront Snapshot  |  Generated: ${genDateStr}  |  Confidential`, margin + 6, y + 20);

      y += 30;

      // ── Section 1: Executive KPI Cards Grid (2 Rows x 4 Columns) ──
      const kpis = [
        { label: 'TOTAL REVENUE', value: formatCurrency(metrics.totalSales) },
        { label: 'TOTAL ORDERS', value: `${metrics.totalOrders} Orders` },
        { label: 'ACTIVE ORDERS', value: `${metrics.activeOrdersCount} Active` },
        { label: 'FULFILLMENT RATE', value: `${metrics.fulfillmentRate}%` },
        { label: 'CATALOG PRODUCTS', value: `${metrics.productsCount} Items` },
        { label: 'STOCK ALERTS', value: `${metrics.lowStockCount} Products` },
        { label: 'SUPPLIERS', value: `${metrics.suppliersCount} Accounts` },
        { label: 'STAFF MEMBERS', value: `${staffCount} Users` }
      ];

      const cardGap = 3;
      const cardWidth = (contentWidth - 3 * cardGap) / 4;
      const cardHeight = 15;

      kpis.forEach((kpi, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const cx = margin + col * (cardWidth + cardGap);
        const cy = y + row * (cardHeight + cardGap);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, cy, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, cx + 3.5, cy + 5);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(String(kpi.value), cx + 3.5, cy + 11.5);
      });

      y += 2 * cardHeight + cardGap + 8;

      // ── Section 2: Recent Orders Ledger ──
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Recent Orders Fulfillment Pipeline', margin, y);
      y += 5;

      const orderHeaders = ['Order ID', 'Status', 'Customer', 'Payment Status', 'Date', 'Amount'];
      const orderColWidths = [26, 26, 46, 34, 25, 25];

      const drawOrdersHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 7, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);

        let curX = margin + 2;
        orderHeaders.forEach((h, idx) => {
          doc.text(h, curX, y + 4.8);
          curX += orderColWidths[idx];
        });
        y += 7;
      };

      drawOrdersHeader();

      const ordersToDisplay = orders.slice(0, 8);
      if (ordersToDisplay.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('No orders registered in the system.', margin + 4, y + 5);
        y += 9;
      } else {
        ordersToDisplay.forEach((o, rowIdx) => {
          if (y + 6 > pageHeight - margin - 12) {
            doc.addPage();
            y = margin + 6;
            drawOrdersHeader();
          }

          if (rowIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, 6, 'F');
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);

          const rawDate = o.dateBooked || o.orderDate || o.date;
          const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          const rowData = [
            `#${o.id || o.orderId || 'N/A'}`,
            String(o.status || 'Pending').slice(0, 16),
            String(o.customerName || 'Customer').slice(0, 24),
            String(o.paymentStatus || 'Pending').slice(0, 20),
            dateStr,
            formatCurrency(o.totalAmount || 0)
          ];

          let curX = margin + 2;
          rowData.forEach((val, idx) => {
            doc.text(String(val), curX, y + 4.2);
            curX += orderColWidths[idx];
          });
          y += 6;
        });
        y += 6;
      }

      // ── Section 3: Stock Inventory Alerts ──
      if (y + 25 > pageHeight - margin - 12) {
        doc.addPage();
        y = margin + 6;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Inventory Alerts & Low Stock Items', margin, y);
      y += 5;

      const stockHeaders = ['Product Name', 'SKU', 'Supplier', 'Stock', 'Reorder', 'Deficit', 'Severity'];
      const stockColWidths = [52, 26, 38, 18, 18, 15, 15];

      const drawStockHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 7, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);

        let curX = margin + 2;
        stockHeaders.forEach((h, idx) => {
          doc.text(h, curX, y + 4.8);
          curX += stockColWidths[idx];
        });
        y += 7;
      };

      drawStockHeader();

      if (lowStockProducts.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('All products are well-stocked. No active stock alerts.', margin + 4, y + 5);
        y += 9;
      } else {
        lowStockProducts.slice(0, 8).forEach((prod, rowIdx) => {
          if (y + 6 > pageHeight - margin - 12) {
            doc.addPage();
            y = margin + 6;
            drawStockHeader();
          }

          if (rowIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, 6, 'F');
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);

          const stock = Number(prod.stock) || 0;
          const reorder = Number(prod.reorderLevel) || 0;
          const deficit = Math.max(0, reorder - stock);
          let severity = 'Medium';
          if (stock === 0) severity = 'Critical';
          else if (stock <= reorder * 0.3) severity = 'High';

          const rowData = [
            String(prod.name || 'Product').slice(0, 30),
            String(prod.sku || 'N/A').slice(0, 14),
            String(prod.supplier || 'Honeywell Supplies').slice(0, 22),
            `${stock}`,
            `${reorder}`,
            `${deficit}`,
            severity
          ];

          let curX = margin + 2;
          rowData.forEach((val, idx) => {
            doc.text(String(val), curX, y + 4.2);
            curX += stockColWidths[idx];
          });
          y += 6;
        });
        y += 6;
      }

      // ── Section 4: Operational System Insights ──
      if (y + 20 > pageHeight - margin - 12) {
        doc.addPage();
        y = margin + 6;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Operational System Insights', margin, y);
      y += 5;

      systemInsights.slice(0, 4).forEach((insight) => {
        if (y + 5 > pageHeight - margin - 12) {
          doc.addPage();
          y = margin + 6;
        }
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`* ${insight.text}`, margin + 3, y + 3.8);
        y += 5;
      });

      // ── Running Footers with Page Numbers ──
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Honeywell Storefront Management Console • Executive Dashboard Report • Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const fileName = `honeywell-dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <RefreshCw size={28} className="loading-spinner" />
        <span>Loading Dashboard Insights...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* TIER 1: Modern Header Banner */}
      <section className="dashboard-hero">
        <div className="dashboard-heading">
          <div className="dashboard-eyebrow-container">
            <span className="dashboard-eyebrow">STOREFRONT MANAGEMENT CONSOLE</span>
            <span className="system-status-indicator">
              <span className="status-live-dot"></span>
              Live Sync
            </span>
          </div>
          <h1>Admin Overview</h1>
          <p>Real-time orders metrics, product catalog stats, supplier statuses, and employee operations for Honeywell.</p>
        </div>

        <div className="dashboard-controls">
          <button type="button" className="refresh-btn" onClick={loadDashboardData} title="Refresh Dashboard Data">
            <RefreshCw size={14} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="export-button"
            onClick={handleExportPDF}
            disabled={exporting}
            title="Export PDF Report"
          >
            <Download size={14} aria-hidden="true" />
            <span>{exporting ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>
        </div>
      </section>

      {/* TIER 2: KPI Summary Cards (Row 1 - Operations Snapshot) */}
      <section className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/admin/orders/list')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-blue">
              <Truck size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">ACTIVE ORDERS</span>
            <strong className="kpi-value">{metrics.activeOrdersCount}</strong>
            <span className="kpi-subtext">Awaiting fulfillment pack</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/stock-updates')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-amber">
              <Boxes size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">STOCK ALERTS</span>
            <strong className="kpi-value">{metrics.lowStockCount}</strong>
            <span className="kpi-subtext">Items below reorder levels</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/suppliers/list')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-purple">
              <Users size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">NEW SUPPLIERS</span>
            <strong className="kpi-value">{metrics.newSuppliersCount}</strong>
            <span className="kpi-subtext">Applications in verification</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/reports')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-emerald">
              <Clock3 size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">FULFILLMENT RATE</span>
            <strong className="kpi-value">{metrics.fulfillmentRate}%</strong>
            <span className="kpi-subtext">Orders successfully completed</span>
          </div>
        </div>
      </section>

      {/* TIER 2: KPI Summary Cards (Row 2 - Business & Catalog Metrics) */}
      <section className="kpi-grid">
        <div className="kpi-card kpi-card-featured" onClick={() => navigate('/admin/orders/list')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-blue">
              <CreditCard size={18} />
            </div>
            <span className="live-badge">
              <span className="live-dot" /> Live
            </span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">TOTAL REVENUE</span>
            <strong className="kpi-value">{formatCurrency(metrics.totalSales)}</strong>
            <span className="kpi-subtext">Excluding canceled orders</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/orders/list')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-indigo">
              <FileText size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">TOTAL ORDERS</span>
            <strong className="kpi-value">{metrics.totalOrders}</strong>
            <span className="kpi-subtext">Total logged purchases</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/catalog/products')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-teal">
              <Package size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">CATALOG PRODUCTS</span>
            <strong className="kpi-value">{metrics.productsCount}</strong>
            <span className="kpi-subtext">Across {categories.length || 1} categories</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/admin/staff')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <div className="kpi-icon-box kpi-icon-slate">
              <Shield size={18} />
            </div>
            <span className="kpi-arrow-link"><ArrowUpRight size={15} /></span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">STAFF DIRECTORY</span>
            <strong className="kpi-value">{staffCount}</strong>
            <span className="kpi-subtext">Authorized console users</span>
          </div>
        </div>
      </section>

      {/* TIER 3: Income Overview + Fulfillment Mix Charts */}
      <section className="dashboard-grid-row grid-main-charts">
        <article className="dash-panel revenue-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">INCOME OVERVIEW</span>
              <h2>Revenue Distribution</h2>
            </div>
            <button type="button" className="sales-value-badge" onClick={() => navigate('/admin/reports')}>
              <TrendingUp size={13} />
              <span>Sales Reports</span>
            </button>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={salesSeriesData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1268a5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1268a5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <Tooltip content={<CustomChartTooltip isCurrency={true} />} />
                <Area type="monotone" dataKey="value" stroke="#1268a5" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dash-panel orders-status-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">FULFILLMENT MIX</span>
              <h2>Orders Status</h2>
            </div>
          </div>

          <div className="donut-center-container">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={orderStatusSeriesData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={74}
                  paddingAngle={4}
                  stroke="none"
                >
                  {orderStatusSeriesData.map((item, idx) => (
                    <Cell key={`cell-${idx}`} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center-label">
              <span className="donut-center-title">Total</span>
              <strong className="donut-center-num">{metrics.totalOrders}</strong>
            </div>
          </div>

          <div className="donut-legend-bottom">
            {orderStatusSeriesData.map((item, idx) => (
              <div key={idx} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: item.color }} />
                <span className="legend-text">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* TIER 4: Catalog Spread + Audit Trail Panels */}
      <section className="dashboard-grid-row grid-bottom-panels">
        <article className="dash-panel products-category-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">CATALOG SPREAD</span>
              <h2>Products by Category</h2>
            </div>
          </div>

          <div className="catalog-spread-content">
            <div className="donut-center-container catalog-donut">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={categorySeriesData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {categorySeriesData.map((item, idx) => (
                      <Cell key={`cell-${idx}`} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-center-title">Total</span>
                <strong className="donut-center-num">{metrics.productsCount}</strong>
              </div>
            </div>

            <div className="category-legend-list">
              {categorySeriesData.map((item, idx) => (
                <div key={idx} className="category-legend-card">
                  <div className="cat-legend-left">
                    <span className="cat-legend-dot" style={{ backgroundColor: item.color }} />
                    <strong className="cat-legend-name">{item.name}</strong>
                  </div>
                  <div className="cat-legend-right">
                    <strong className="cat-legend-count">{item.value} Items</strong>
                    <span className="cat-legend-pct">
                      {metrics.productsCount > 0 ? Math.round((item.value / metrics.productsCount) * 100) : 100}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="dash-panel audit-trail-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">AUDIT TRAIL</span>
              <h2>Recent Activities</h2>
            </div>
          </div>

          <div className="audit-activities-list">
            {recentActivitiesList.map((act, idx) => (
              <div key={idx} className="audit-activity-row">
                <div className="audit-time-col">
                  <span className="audit-time-pill">{act.time}</span>
                </div>
                <div className="audit-detail-col">
                  <strong className="audit-title">{act.title}</strong>
                  <p className="audit-text">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* TIER 5: Detailed Operational Tables */}
      <section className="dash-panel orders-panel">
        <div className="dash-panel-header">
          <div>
            <span className="dash-kicker">FULFILLMENT PIPELINE</span>
            <h2>Recent Orders</h2>
          </div>
          <button type="button" className="table-action-btn" onClick={() => navigate('/admin/orders/list')}>
            <span>View All Orders</span>
            <ExternalLink size={13} aria-hidden="true" />
          </button>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Payment Status</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 5).map((order) => {
                  const statusKey = String(order.status || 'Pending').trim();
                  const StatusIcon = statusIconMap[statusKey] || statusIconMap[statusKey.charAt(0).toUpperCase() + statusKey.slice(1).toLowerCase()] || Clock3;
                  const rawDate = order.dateBooked || order.orderDate || order.date;
                  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                  const customerInitials = order.customerName ? order.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA';
                  const isOrderCancelled = ['CANCELLED', 'CANCELED'].includes(String(order.status || '').trim().toUpperCase());

                  return (
                    <tr key={order.id || order.orderId} onClick={() => navigate('/admin/orders/list', { state: { selectedOrderId: order.id || order.orderId } })}>
                      <td className="order-id">#{order.id || order.orderId}</td>
                      <td>
                        <span className={`status-tag status-tag--${statusClassName(order.status)}`}>
                          <StatusIcon size={12} aria-hidden="true" />
                          <span>{order.status || 'Pending'}</span>
                        </span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="avatar-circle">{customerInitials}</span>
                          <strong className="customer-name">{order.customerName}</strong>
                        </div>
                      </td>
                      <td>
                        <PaymentStatusBadge paymentStatus={order.paymentStatus} isCancelled={isOrderCancelled} />
                      </td>
                      <td className="date-cell">{dateStr}</td>
                      <td className="amount-cell">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty-table-cell">
                    No orders registered in the system. Go to storefront to place an order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-panel stock-alerts-card">
        <div className="dash-panel-header">
          <div>
            <span className="dash-kicker">INVENTORY ALERTS</span>
            <h2>Stock Alert Details</h2>
          </div>
          <button 
            type="button" 
            className="table-action-btn"
            onClick={() => navigate('/admin/stock-updates')}
          >
            <span>Manage Inventory</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="stock-alerts-table-wrapper">
          <table className="stock-alerts-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Supplier</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Deficit</th>
                <th>Severity</th>
                <th>Restock Cost</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => {
                  const stock = Number(product.stock) || 0;
                  const reorderLevel = Number(product.reorderLevel) || 0;
                  const deficit = Math.max(0, reorderLevel - stock);
                  const isOutOfStock = stock === 0;
                  const costPrice = Number(product.costPrice) || 0;
                  const restockValuation = deficit * costPrice;

                  let severity = "Medium";
                  let severityClass = "severity-medium";

                  if (stock === 0) {
                    severity = "Critical";
                    severityClass = "severity-critical";
                  } else if (stock <= reorderLevel * 0.3) {
                    severity = "High";
                    severityClass = "severity-high";
                  }

                  return (
                    <tr key={product.id} onClick={() => navigate('/admin/stock-updates')}>
                      <td className="product-name-cell">
                        <strong>{product.name}</strong>
                      </td>
                      <td className="sku-cell">
                        <span className="sku-badge">{product.sku}</span>
                      </td>
                      <td className="supplier-cell">
                        {product.supplier || 'Honeywell Supplies'}
                      </td>
                      <td className={`stock-cell ${isOutOfStock ? 'is-critical' : ''}`}>
                        {stock}
                      </td>
                      <td className="reorder-cell">
                        {reorderLevel}
                      </td>
                      <td className={`deficit-cell ${deficit > 0 ? 'is-critical' : ''}`}>
                        {deficit}
                      </td>
                      <td className="severity-cell">
                        <span className={`severity-badge ${severityClass}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="restock-cell">
                        {formatCurrency(restockValuation)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    All products are well-stocked. No active stock alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TIER 5: Registered Suppliers & Fulfillment System Alerts */}
      <section className="dashboard-grid-row grid-bottom-panels">
        <article className="dash-panel review-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">CATALOG STATS</span>
              <h2>Registered Suppliers</h2>
            </div>
            <button type="button" className="table-action-btn" onClick={() => navigate('/admin/suppliers/list')}>
              <span>View Suppliers</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="reviews-list">
            {suppliers.length > 0 ? (
              suppliers.slice(0, 4).map((s, idx) => (
                <div className="review-row-item" key={idx}>
                  <div className="supplier-info">
                    <strong className="supplier-name-title">{s.name}</strong>
                    <span className="supplier-meta-text">Contact: {s.contactPerson || 'N/A'} | {s.phone || 'N/A'}</span>
                  </div>
                  <span className={`status-tag status-tag--${s.status === 'Verified' ? 'completed' : 'pending'}`}>
                    {s.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-roster-text">
                No suppliers registered.
              </div>
            )}
          </div>
        </article>

        <article className="dash-panel insight-panel">
          <div className="dash-panel-header">
            <div>
              <span className="dash-kicker">SYSTEM ALERTS</span>
              <h2>Fulfillment Insights</h2>
            </div>
          </div>

          <div className="insight-list">
            {systemInsights.map((insight, idx) => (
              <div className="insight-item-row" key={idx}>
                <span className="insight-dot-marker" style={{
                  backgroundColor: insight.type === 'warning' ? '#f59e0b' : insight.type === 'error' ? '#ef4444' : '#1268a5'
                }} />
                <strong className="insight-text-label">{insight.text}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
