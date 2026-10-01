import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Printer, Trash2, CheckCircle2, AlertCircle, RefreshCw, 
  Plus, X, Filter, RotateCcw, FileText, CheckCircle, Clock, 
  DollarSign, TrendingUp, User, Calendar, CreditCard, Mail, Ban
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getInvoices, getInvoiceById, updateInvoice, deleteInvoice } from '../../services/invoicesApi';
import { Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './invoices.css';

const normalizeInvoiceId = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().replace(/^#+/, '');
  while (/^(INV-|ORD-|INV|ORD)/i.test(clean)) {
    clean = clean.replace(/^(INV-|ORD-)/i, '').replace(/^(INV|ORD)[-\s]*/i, '').trim();
  }
  if (!clean) return '';
  return `INV-${clean}`;
};

const formatDateToDMY = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatCurrency = (val) => {
  if (typeof val === 'number') return `₹${val.toLocaleString('en-IN')}`;
  if (!val) return '₹0';
  let str = String(val).trim().replace(/^(rs\.?|inr|₹)\s*/i, '').replace(/,/g, '');
  const num = Number(str) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

const getInitials = (name) => {
  if (!name) return 'IN';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 'Rs. 0',
    paidInvoices: 0,
    unpaidInvoices: 0,
    cancelledInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchInvoicesData = async (search = '', isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const data = await getInvoices(search);
      const normalizedList = (data.invoices || []).map(inv => ({
        ...inv,
        invoiceId: normalizeInvoiceId(inv.invoiceId)
      }));
      setInvoices(normalizedList);
      setMetrics({
        totalRevenue: data.totalRevenue || 'Rs. 0',
        paidInvoices: data.paidInvoices || 0,
        unpaidInvoices: data.unpaidInvoices || 0,
        cancelledInvoices: data.cancelledInvoices || 0
      });
    } catch (err) {
      if (!isBackground) {
        setError(err.message || 'Failed to fetch invoices.');
        showToast('Failed to load invoices data.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesData('', false);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoicesData(searchTerm, true);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleUpdateStatus = async (id, currentStatus, nextStatus) => {
    try {
      await updateInvoice(id, { status: nextStatus });
      showToast(`Invoice status updated to ${nextStatus}.`, 'success');
      fetchInvoicesData(searchTerm, true);
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'error');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await deleteInvoice(id);
      showToast('Invoice marked as cancelled.', 'success');
      fetchInvoicesData(searchTerm, true);
    } catch (err) {
      showToast(`Error cancelling invoice: ${err.message}`, 'error');
    }
  };

  const handlePrintInvoice = async (id) => {
    try {
      const order = await getInvoiceById(id);

      const parseCurrencyValue = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let str = String(val).trim();
        str = str.replace(/^(rs\.?|inr|₹)\s*/i, '');
        str = str.replace(/,/g, '');
        str = str.replace(/[^0-9.]/g, '');
        return Number(str) || 0;
      };

      const finalAmountNum = order.totalAmount !== undefined ? Number(order.totalAmount) : (order.finalAmount !== undefined ? Number(order.finalAmount) : parseCurrencyValue(order.billed));

      const itemsList = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      const computedItemsSubtotal = itemsList.reduce((acc, item) => {
        const itemPrice = item.priceNum !== undefined ? Number(item.priceNum) : parseCurrencyValue(item.price);
        const itemQty = Number(item.quantity || 1);
        return acc + (itemPrice * itemQty);
      }, 0);

      const subtotalNum = order.subTotal !== undefined ? Number(order.subTotal) : (order.subtotal !== undefined ? Number(order.subtotal) : (computedItemsSubtotal > 0 ? computedItemsSubtotal : (finalAmountNum / 1.18)));
      const discountNum = Number(order.discountAmount || order.discount || 0);
      const shippingNum = Number(order.shippingFee || order.shippingCharge || 0);
      const netTaxableNum = Math.max(0, subtotalNum - discountNum);
      const gstAmountNum = order.taxAmount !== undefined ? Number(order.taxAmount) : (order.gstAmount !== undefined ? Number(order.gstAmount) : (netTaxableNum * 0.18));
      const grandTotalNum = finalAmountNum > 0 ? finalAmountNum : (netTaxableNum + gstAmountNum + shippingNum);
      const cgstNum = gstAmountNum / 2;
      const sgstNum = gstAmountNum / 2;

      let printIframe = document.getElementById('invoice-print-iframe');
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'invoice-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }

      const itemsHtml = itemsList.map((item, idx) => {
        const itemPrice = item.priceNum !== undefined ? Number(item.priceNum) : parseCurrencyValue(item.price);
        const itemQty = Number(item.quantity || 1);
        const itemSubtotal = itemPrice * itemQty;
        const itemTax = itemSubtotal * 0.18;
        const itemTotal = itemSubtotal + itemTax;

        return `
          <tr>
            <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${item.productName || 'Product'}</div>
              ${item.productCode ? `<div style="font-size: 11px; color: #64748b;">SKU: ${item.productCode}</div>` : ''}
            </td>
            <td style="text-align: center; font-weight: 600;">${itemQty}</td>
            <td style="text-align: right;">₹${itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right;">₹${itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 700;">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');

      const docTitle = "TAX INVOICE";
      const docSubTitle = "ORIGINAL FOR RECIPIENT";
      const currentStatus = (order.status || 'Paid').toLowerCase();
      const isPaid = currentStatus === 'paid';
      const isCancelled = currentStatus === 'cancelled';
      const statusColor = isPaid ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b';

      const printWin = printIframe.contentWindow || printIframe;
      const doc = printWin.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle} - ${order.invoiceId}</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 0;
                font-size: 11.5px;
                line-height: 1.4;
              }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 16px; }
              .company-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
              .company-subtitle { font-size: 10.5px; font-weight: 700; color: #1268a5; letter-spacing: 0.5px; margin-bottom: 4px; }
              .company-meta { font-size: 10px; color: #475569; line-height: 1.35; }
              .badge-tax-invoice { text-align: right; }
              .tax-title { font-size: 18px; font-weight: 800; color: #1268a5; letter-spacing: 1px; }
              .tax-subtitle { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
              .info-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
              .info-block-title { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
              .info-label { color: #64748b; font-weight: 600; }
              .info-val { color: #0f172a; font-weight: 700; }
              .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
              .address-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
              .address-card-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1268a5; margin-bottom: 6px; }
              .address-card p { margin: 0; font-size: 11px; line-height: 1.4; color: #334155; }
              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
              .item-table th { background: #0f172a; color: #ffffff; font-weight: 700; font-size: 10.5px; text-transform: uppercase; padding: 8px 10px; border: 1px solid #0f172a; }
              .item-table td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
              .summary-flex { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
              .bank-box { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 10.5px; }
              .bank-box-title { font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px; }
              .bank-row { display: flex; margin-bottom: 2px; }
              .bank-label { width: 85px; color: #15803d; font-weight: 600; }
              .bank-val { font-weight: 700; color: #166534; }
              .financial-totals { width: 300px; font-size: 11.5px; }
              .total-line { display: flex; justify-content: space-between; padding: 4px 0; color: #475569; border-bottom: 1px solid #f1f5f9; }
              .grand-total-line { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #0f172a; padding: 6px 0; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-top: 4px; }
              .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; }
              .signatory-box { text-align: center; width: 160px; }
              .signatory-line { height: 30px; border-bottom: 1px dashed #94a3b8; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="invoice-header">
                <div style="display: flex; align-items: flex-start; gap: 14px;">
                  <img src="/honeywell-products-logo.png" style="height: 60px; width: auto; object-fit: contain;" alt="Honeywell Products" />
                  <div>
                    <div class="company-title">Honeywell</div>
                    <div class="company-subtitle">SECURITY & SURVEILLANCE SOLUTIONS</div>
                    <div class="company-meta">
                      101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081<br/>
                      GSTIN: <strong>24DYYPP1677P1Z6</strong> | Phone: 040 4855 5758
                    </div>
                  </div>
                </div>
                <div class="badge-tax-invoice">
                  <div class="tax-title">${docTitle}</div>
                  <div class="tax-subtitle">${docSubTitle}</div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <div class="info-block-title">Invoice & Order Details</div>
                  <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${order.invoiceId}</span></div>
                  <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${order.date || 'Recent'}</span></div>
                  <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${order.id}</span></div>
                </div>
                <div class="info-block">
                  <div class="info-block-title">Payment & Settlement Status</div>
                  <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${order.paymentMethod || 'UPI / Bank Transfer'}</span></div>
                  <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: ${statusColor}; font-weight: 800;">${currentStatus.toUpperCase()}</span></div>
                  <div class="info-row"><span class="info-label">Total Amount:</span><span class="info-val">₹${grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              <div class="address-grid">
                <div class="address-card">
                  <div class="address-card-title">Billed To (Customer Details)</div>
                  <p>
                    <strong>${order.client}</strong><br/>
                    ${order.phone ? `Phone: ${order.phone}<br/>` : ''}
                    ${order.email && !order.email.includes('N/A') ? `Email: ${order.email.toLowerCase()}` : ''}
                  </p>
                </div>
                <div class="address-card">
                  <div class="address-card-title">Delivery Location</div>
                  <p>
                    <strong>${order.client}</strong><br/>
                    ${(order.shippingAddress || order.address || 'Standard Delivery Location').replace(/\n/g, '<br/>')}
                  </p>
                </div>
              </div>

              <table class="item-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%; text-align: left;">Product Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 13%; text-align: right;">Price</th>
                    <th style="width: 12%; text-align: right;">GST (18%)</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="summary-flex">
                <div class="bank-box">
                  <div class="bank-box-title">Remittance / Bank Account Details</div>
                  <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-val">State Bank of India</span></div>
                  <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-val">Honeywell Products</span></div>
                  <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-val">50200012345678</span></div>
                  <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-val">SBIN0001234</span></div>
                </div>

                <div class="financial-totals">
                  <div class="total-line"><span>Subtotal</span><span>₹${subtotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div class="total-line"><span>CGST (9%)</span><span>₹${cgstNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div class="total-line"><span>SGST (9%)</span><span>₹${sgstNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div class="grand-total-line">
                    <span>Grand Total Due</span>
                    <span>₹${grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div class="invoice-footer">
                <div style="flex-grow: 1; max-width: 65%;">
                  <strong>Terms & Notes:</strong><br/>
                  <span>Official computer-generated tax invoice. Valid for commercial warranty and tax credit.</span>
                </div>
                <div class="signatory-box">
                  <div class="signatory-line"></div>
                  <strong>For Honeywell</strong><br/>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
      try {
        doc.title = `${docTitle} - ${order.invoiceId}`;
      } catch (e) {}
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 300);
    } catch (err) {
      showToast(`Failed to print invoice: ${err.message}`, 'error');
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        (item.invoiceId || '').toLowerCase().includes(searchLower) ||
        (item.client || '').toLowerCase().includes(searchLower) ||
        (item.email || '').toLowerCase().includes(searchLower) ||
        (item.billed || '').toLowerCase().includes(searchLower) ||
        (item.status || '').toLowerCase().includes(searchLower)
      );

      const matchesStatus = statusFilter === 'All'
        ? true
        : statusFilter === 'Paid'
          ? (item.status || '').toLowerCase() === 'paid'
          : statusFilter === 'Unpaid'
            ? (item.status || '').toLowerCase() === 'unpaid'
            : (item.status || '').toLowerCase() === 'cancelled';

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  // Paginated records
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  return (
    <div className="invoices-mgmt-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Card */}
      <div className="invoices-header-card">
        <div className="invoices-title-wrap">
          <div className="invoices-kicker">BILLING &amp; FINANCIAL LEDGER</div>
          <h1>Invoices Ledger</h1>
          <p>Generate, track, filter, and print customer tax invoices and commercial billing records</p>
        </div>
        <div className="invoices-header-actions">
          <button 
            type="button" 
            className="btn-invoices-secondary" 
            onClick={() => fetchInvoicesData(searchTerm, false)} 
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/invoice/add" className="btn-invoices-primary">
            <Plus size={16} />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="invoices-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => fetchInvoicesData(searchTerm, false)} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="invoices-stats-grid">
        <div 
          className={`invoices-stat-card ${statusFilter === 'All' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Click to view all invoices"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Total Revenue</span>
              <span className="stat-card-value">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div className="stat-card-icon icon-revenue">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge">All invoices</span>
          </div>
        </div>

        <div 
          className={`invoices-stat-card ${statusFilter === 'Paid' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Paid' ? 'All' : 'Paid')}
          title="Click to filter paid invoices"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Paid Invoices</span>
              <span className="stat-card-value">{metrics.paidInvoices}</span>
            </div>
            <div className="stat-card-icon icon-paid">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-paid">Settled</span>
          </div>
        </div>

        <div 
          className={`invoices-stat-card ${statusFilter === 'Unpaid' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Unpaid' ? 'All' : 'Unpaid')}
          title="Click to filter unpaid invoices"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Unpaid Invoices</span>
              <span className="stat-card-value">{metrics.unpaidInvoices}</span>
            </div>
            <div className="stat-card-icon icon-unpaid">
              <Clock size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-unpaid">Pending payment</span>
          </div>
        </div>

        <div 
          className={`invoices-stat-card ${statusFilter === 'Cancelled' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? 'All' : 'Cancelled')}
          title="Click to filter cancelled invoices"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Cancelled</span>
              <span className="stat-card-value">{metrics.cancelledInvoices}</span>
            </div>
            <div className="stat-card-icon icon-cancelled">
              <Ban size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-cancelled">Void / Refunded</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="invoices-toolbar-card">
        <div className="invoices-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Invoice ID, client name, email, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="clear-search-btn" 
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="invoices-filter-group">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="invoice-select"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn-reset-filters" 
              onClick={handleResetFilters}
              title="Reset all active filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <div className="invoices-count-tag">
            <span>{filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="invoices-table-card">
        {loading && invoices.length === 0 ? (
          <div className="invoices-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading invoice records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="invoices-empty-state">
            <div className="empty-icon-wrap">
              <FileText size={36} />
            </div>
            <h3>No invoices found</h3>
            <p>
              {hasActiveFilters 
                ? "No invoice records matched your search filters." 
                : "No billing invoices have been generated yet."}
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-invoices-secondary" onClick={handleResetFilters}>
                <RotateCcw size={14} /> Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="invoices-table-wrapper">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>INVOICE ID</th>
                  <th style={{ width: '25%' }}>CLIENT / BILLED TO</th>
                  <th style={{ width: '14%' }}>DATE</th>
                  <th style={{ width: '16%' }}>BILLED AMOUNT</th>
                  <th style={{ width: '12%' }}>STATUS</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => {
                  const statusLower = (inv.status || 'unpaid').toLowerCase();
                  const isPaid = statusLower === 'paid';
                  const isCancelled = statusLower === 'cancelled';
                  const isPaymentNotApplicable =
                    statusLower.includes('not applicable') ||
                    statusLower.includes('n/a') ||
                    statusLower.includes('not required') ||
                    statusLower === 'na';
                  const nextTarget = isPaid ? 'Unpaid' : 'Paid';
                  const initials = getInitials(inv.client);

                  return (
                    <tr key={inv.id} className="invoice-table-row">
                      {/* Invoice ID */}
                      <td>
                        <div className="invoice-id-cell">
                          <FileText size={14} className="invoice-id-icon" />
                          <span className="invoice-id-text">{inv.invoiceId || `INV-${inv.id}`}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar" title={inv.client || 'Client'}>
                            {initials}
                          </div>
                          <div className="customer-meta">
                            <span className="customer-name">{inv.client || 'General Customer'}</span>
                            {inv.email && <span className="contact-subtext">{inv.email}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div className="date-cell">
                          <span className="date-main">{inv.date || formatDateToDMY(inv.createdAt)}</span>
                        </div>
                      </td>

                      {/* Billed Amount */}
                      <td>
                        <div className="amount-cell">
                          <strong className="amount-text">{formatCurrency(inv.billed || inv.totalAmount || inv.finalAmount)}</strong>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill status-${isPaid ? 'resolved' : isCancelled ? 'closed' : 'pending'}`}>
                          {isPaid ? <CheckCircle size={12} /> : isCancelled ? <X size={12} /> : <Clock size={12} />}
                          <span>{inv.status || 'Unpaid'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(inv.id)}
                            className="action-icon-btn action-print"
                            title="Print / View Tax Invoice PDF"
                          >
                            <Printer size={15} />
                          </button>

                          {!isCancelled && !isPaymentNotApplicable && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(inv.id, inv.status, nextTarget)}
                              className={`action-icon-btn ${isPaid ? 'action-unpaid' : 'action-paid'}`}
                              title={`Mark as ${nextTarget}`}
                            >
                              {isPaid ? <Clock size={15} /> : <CheckCircle2 size={15} />}
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="action-icon-btn action-delete"
                              title="Cancel / Void Invoice"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="invoices-pagination-container">
            <Pagination
              page={currentPage}
              count={filteredInvoices.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;
