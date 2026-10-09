import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, FileText, CheckCircle, Clock, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { fetchPurchaseIndents, updatePurchaseIndentStatus } from '../api/purchase';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const PurchaseIndentList = () => {
  const navigate = useNavigate();
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadIndents = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseIndents();
      setIndents(data);
    } catch (err) {
      console.error("Failed to load Purchase Indents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndents();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    await updatePurchaseIndentStatus(id, newStatus);
    loadIndents();
  };

  const filteredIndents = indents.filter(indent => {
    const matchesSearch = 
      String(indent.indentNumber || indent.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(indent.requestedBy || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(indent.warehouse || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || indent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalIndents = indents.length;
  const pendingIndents = indents.filter(i => i.status === 'Pending Approval').length;
  const approvedIndents = indents.filter(i => i.status === 'Approved' || i.status === 'PO Created').length;
  const totalEstValue = indents.reduce((sum, i) => sum + Number(i.totalEstimatedCost || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
            padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800'
          }}>
            <CheckCircle size={12}/> Approved
          </span>
        );
      case 'PO Created':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd',
            padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800'
          }}>
            <FileText size={12}/> PO Created
          </span>
        );
      case 'Rejected':
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800'
          }}>
            <AlertCircle size={12}/> Rejected
          </span>
        );
      default:
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800'
          }}>
            <Clock size={12}/> Pending Approval
          </span>
        );
    }
  };

  return (
    <div style={{ background: '#f2f8f5', minHeight: '100vh', padding: '24px 32px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#1e293b' }}>
      
      {/* Top Header Card */}
      <section style={{ 
        background: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        padding: '24px 32px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '800', 
            color: '#2563eb', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            display: 'block',
            marginBottom: '6px'
          }}>
            PROCUREMENT & REQUISITION
          </span>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            color: '#0f172a', 
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            Purchase Indents Manager
          </h1>
          <p style={{ 
            fontSize: '13.5px', 
            color: '#64748b', 
            margin: 0 
          }}>
            Manage stock requisition indents and internal purchase requests.
          </p>
        </div>

        <div>
          <Link 
            to="/admin/purchase-indent/add"
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#ffffff', 
              fontSize: '13px', 
              fontWeight: '600', 
              padding: '9px 18px', 
              borderRadius: '10px', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Plus size={16} /> Create Purchase Indent
          </Link>
        </div>
      </section>

      {/* KPI Cards (4 Columns) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        {/* Card 1: Total Indents */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#ecfdf5', 
            color: '#16a34a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
            }}>
              TOTAL INDENTS
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
              {totalIndents}
            </strong>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#fffbeb', 
            color: '#d97706', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
            }}>
              PENDING APPROVAL
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#d97706', lineHeight: 1.2 }}>
              {pendingIndents}
            </strong>
          </div>
        </div>

        {/* Card 3: Approved & PO Created */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#f3e8ff', 
            color: '#7e22ce', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
            }}>
              APPROVED & PO CREATED
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
              {approvedIndents}
            </strong>
          </div>
        </div>

        {/* Card 4: Total Est. Value */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#e0f2fe', 
            color: '#0284c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
            }}>
              TOTAL EST. VALUE
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', lineHeight: 1.2 }}>
              {formatCurrency(totalEstValue)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Indents Container Card */}
      <section style={{ 
        background: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        {/* Search & Filter Toolbar */}
        <div style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Indent No, Requested By, Warehouse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  fontSize: '12.5px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e293b'
                }}
              />
            </div>

            {/* Status Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '9px 34px 9px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '140px'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="PO Created">PO Created</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          </div>

          {/* Refresh Button */}
          <button 
            type="button"
            onClick={loadIndents} 
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '600',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>INDENT REF</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DATE</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>REQUESTED BY</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WAREHOUSE</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ITEMS COUNT</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EST. TOTAL VALUE</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin inline-block mr-2 text-emerald-600" /> Loading Purchase Indents...
                  </td>
                </tr>
              ) : filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No purchase indents found.
                  </td>
                </tr>
              ) : (
                filteredIndents.map((indent) => (
                  <tr key={indent.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '13.5px' }}>
                        {indent.indentNumber || `IND-${indent.id}`}
                      </strong>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', color: '#334155' }}>
                      {indent.date}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{indent.requestedBy}</strong>
                        <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Priority: {indent.priority || 'Medium'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', color: '#334155' }}>
                      {indent.warehouse || 'Central Warehouse'}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {indent.items?.length || 0} items
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                      {formatCurrency(indent.totalEstimatedCost)}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      {getStatusBadge(indent.status)}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {indent.status === 'Pending Approval' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(indent.id, 'Approved')}
                              style={{ 
                                backgroundColor: '#10b981', color: 'white', border: 'none', 
                                padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' 
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusChange(indent.id, 'Rejected')}
                              style={{ 
                                backgroundColor: '#ef4444', color: 'white', border: 'none', 
                                padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' 
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(indent.status === 'Approved' || indent.status === 'Pending Approval') && (
                          <button 
                            onClick={() => navigate(`/admin/purchase-orders/create?indentId=${indent.id}`)}
                            style={{ 
                              backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', 
                              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                            title="Generate Purchase Order from this Indent"
                          >
                            Create PO <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PurchaseIndentList;

