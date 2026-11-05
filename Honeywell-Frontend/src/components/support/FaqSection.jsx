import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, Search, X, ChevronDown, ChevronsUpDown,
  PhoneCall, Wrench, ShieldCheck, AlertCircle,
  FileQuestion, RotateCcw
} from 'lucide-react';
import { FAQ_CATEGORIES, faqsData } from '../../data/faqsData';
import './FaqSection.css';

/**
 * Enhanced answer parser that converts internal route references (e.g. "Warranty Lookup (/warranty)")
 * into React Router Links, and highlights "[Requires Business Confirmation: ...]" clauses with badges.
 */
function renderParsedAnswer(answerText) {
  if (!answerText) return '';

  // Step 1: Split by [Requires Business Confirmation: ...] to wrap in business flag pills
  const businessFlagRegex = /\[Requires Business Confirmation:\s*([^\]]+)\]/g;
  const segments = [];
  let lastIdx = 0;
  let flagMatch;

  while ((flagMatch = businessFlagRegex.exec(answerText)) !== null) {
    if (flagMatch.index > lastIdx) {
      segments.push({
        type: 'text',
        content: answerText.substring(lastIdx, flagMatch.index),
      });
    }
    segments.push({
      type: 'flag',
      content: flagMatch[1],
    });
    lastIdx = businessFlagRegex.lastIndex;
  }
  if (lastIdx < answerText.length) {
    segments.push({
      type: 'text',
      content: answerText.substring(lastIdx),
    });
  }

  // Step 2: Helper to parse parenthesis routes like "Warranty Page (/warranty)"
  const parseLinks = (textChunk, keyPrefix) => {
    const routeRegex = /([A-Za-z0-9\s&'/]+?)\s*\(((\/[a-zA-Z0-9?=&_-]+)+)\)/g;
    const parts = [];
    let prevIndex = 0;
    let match;

    while ((match = routeRegex.exec(textChunk)) !== null) {
      if (match.index > prevIndex) {
        parts.push(textChunk.substring(prevIndex, match.index));
      }
      const label = match[1].trim();
      const linkPath = match[2].trim();
      parts.push(
        <Link
          key={`${keyPrefix}-link-${match.index}`}
          to={linkPath}
          className="faq-answer-link"
        >
          {label}
        </Link>
      );
      prevIndex = routeRegex.lastIndex;
    }
    if (prevIndex < textChunk.length) {
      parts.push(textChunk.substring(prevIndex));
    }
    return parts.length > 0 ? parts : textChunk;
  };

  return segments.map((seg, idx) => {
    if (seg.type === 'flag') {
      return (
        <span
          key={`flag-${idx}`}
          className="faq-business-flag"
          title="This term awaits formal business or operational confirmation."
        >
          <AlertCircle size={13} aria-hidden="true" />
          <span>Requires Business Confirmation: {seg.content}</span>
        </span>
      );
    }
    return <React.Fragment key={`seg-${idx}`}>{parseLinks(seg.content, `seg-${idx}`)}</React.Fragment>;
  });
}

export default function FaqSection({
  initialCategory = 'All',
  onCategoryChange,
  faqsOverride = null,
  supportConfig = null,
}) {
  // Use backend faqs if provided and valid, otherwise use complete 34-item faqsData
  const sourceFaqs = useMemo(() => {
    if (Array.isArray(faqsOverride) && faqsOverride.length > 0) {
      return faqsOverride;
    }
    return faqsData;
  }, [faqsOverride]);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemIds, setOpenItemIds] = useState(() => new Set([1])); // Open first FAQ by default

  // Calculate question count per category
  const categoryCounts = useMemo(() => {
    const counts = { All: sourceFaqs.length };
    FAQ_CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = sourceFaqs.filter(
          (item) => (item.category || '').toLowerCase() === cat.toLowerCase()
        ).length;
      }
    });
    return counts;
  }, [sourceFaqs]);

  // Filter FAQs based on active category and live search query
  const filteredFaqs = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return sourceFaqs.filter((item) => {
      // Category filter
      const matchesCategory =
        activeCategory === 'All' ||
        (item.category || '').toLowerCase() === activeCategory.toLowerCase();

      if (!matchesCategory) return false;

      // Search filter across question, answer, category, and code/tag
      if (!cleanSearch) return true;

      const q = (item.question || '').toLowerCase();
      const a = (item.answer || '').toLowerCase();
      const c = (item.category || '').toLowerCase();
      const code = (item.code || '').toLowerCase();

      return q.includes(cleanSearch) || a.includes(cleanSearch) || c.includes(cleanSearch) || code.includes(cleanSearch);
    });
  }, [sourceFaqs, activeCategory, searchQuery]);

  // Handle category selection
  const handleSelectCategory = useCallback((category) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  }, [onCategoryChange]);

  // Toggle single item
  const handleToggleItem = useCallback((id) => {
    setOpenItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all / Collapse all toggle
  const allFilteredOpen = useMemo(() => {
    if (filteredFaqs.length === 0) return false;
    return filteredFaqs.every((item) => openItemIds.has(item.id));
  }, [filteredFaqs, openItemIds]);

  const handleToggleAll = useCallback(() => {
    if (allFilteredOpen) {
      // Collapse all
      setOpenItemIds(new Set());
    } else {
      // Expand all currently filtered
      const allIds = new Set(filteredFaqs.map((item) => item.id));
      setOpenItemIds(allIds);
    }
  }, [allFilteredOpen, filteredFaqs]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    handleSelectCategory('All');
  }, [handleSelectCategory]);

  return (
    <section className="faq-container" aria-label="Frequently Asked Questions Section">
      {/* ── Section Header ── */}
      <div className="faq-header">
        <div className="faq-badge">
          <HelpCircle size={14} aria-hidden="true" />
          <span>Knowledge Base &amp; FAQ</span>
        </div>
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">
          Find answers regarding Honeywell security cameras, NVRs, software downloads, warranty terms, orders, and commercial support.
        </p>
      </div>

      {/* ── Search Input ── */}
      <div className="faq-search-wrapper">
        <div className="faq-search-box">
          <Search size={18} className="faq-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="faq-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question, answer, category, or code (e.g. CCTV, warranty, NVR, firmware)..."
            aria-label="Search frequently asked questions"
          />
          {searchQuery && (
            <button
              type="button"
              className="faq-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="faq-categories-wrapper" role="toolbar" aria-label="FAQ Category Filters">
        <div className="faq-categories-list">
          {FAQ_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                className={`faq-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectCategory(cat)}
                aria-pressed={isActive}
              >
                <span>{cat === 'All' ? 'All Questions' : cat}</span>
                <span className="faq-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Controls Bar: Count & Expand/Collapse All ── */}
      <div className="faq-controls-bar">
        <div className="faq-results-count">
          <span>
            Showing <strong>{filteredFaqs.length}</strong> of {sourceFaqs.length} questions
            {activeCategory !== 'All' && <> in <strong>{activeCategory}</strong></>}
            {searchQuery && <> matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</>}
          </span>
          {(activeCategory !== 'All' || searchQuery) && (
            <button
              type="button"
              className="faq-reset-link"
              onClick={handleResetFilters}
            >
              (Reset Filters)
            </button>
          )}
        </div>

        {filteredFaqs.length > 0 && (
          <button
            type="button"
            className="faq-toggle-all-btn"
            onClick={handleToggleAll}
            aria-label={allFilteredOpen ? 'Collapse all visible questions' : 'Expand all visible questions'}
          >
            <ChevronsUpDown size={14} aria-hidden="true" />
            <span>{allFilteredOpen ? 'Collapse All' : 'Expand All'}</span>
          </button>
        )}
      </div>

      {/* ── Accordion List or Empty State ── */}
      {filteredFaqs.length === 0 ? (
        <div className="faq-empty-state" role="status" aria-live="polite">
          <div className="faq-empty-icon">
            <FileQuestion size={28} />
          </div>
          <h3 className="faq-empty-title">No matching questions found</h3>
          <p className="faq-empty-desc">
            We couldn&apos;t find any FAQs matching your search query &ldquo;{searchQuery}&rdquo; in the selected category.
            Try searching with broader terms or reset your filters.
          </p>
          <button
            type="button"
            className="faq-empty-reset-btn"
            onClick={handleResetFilters}
          >
            <RotateCcw size={15} />
            <span>Clear Search &amp; Show All FAQs</span>
          </button>
        </div>
      ) : (
        <div className="faq-accordion-list" role="region" aria-label="FAQ Questions List">
          {filteredFaqs.map((item) => {
            const isOpen = openItemIds.has(item.id);
            const headerId = `faq-header-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div
                key={item.id || item.code}
                className={`faq-accordion-item ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  id={headerId}
                  className="faq-accordion-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => handleToggleItem(item.id)}
                >
                  <div className="faq-trigger-content">
                    <h3 className="faq-question-text">{item.question}</h3>
                    <div className="faq-item-meta">
                      {item.category && (
                        <span className="faq-category-tag">{item.category}</span>
                      )}
                      {item.code && (
                        <span className="faq-code-tag">#{item.code}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={20} className="faq-chevron-icon" aria-hidden="true" />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`faq-accordion-panel ${isOpen ? 'is-open' : ''}`}
                >
                  <div className="faq-panel-inner">
                    <div className="faq-answer-body">
                      <p>{renderParsedAnswer(item.answer)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Still Need Help? Section ── */}
      <div className="faq-still-need-help">
        <div className="faq-help-header">
          <h3 className="faq-help-title">Still Have Questions?</h3>
          <p className="faq-help-subtitle">
            Can&apos;t find the answers you&apos;re looking for? Our dedicated technical engineers and product specialists are ready to assist.
          </p>
        </div>

        <div className="faq-help-cards-grid">
          <Link to="/contact" className="faq-help-card">
            <div>
              <div className="faq-help-card-icon blue">
                <PhoneCall size={22} />
              </div>
              <h4 className="faq-help-card-title">Contact Support Desk</h4>
              <p className="faq-help-card-desc">
                {supportConfig?.supportPhoneNumber
                  ? `Speak directly with our team at ${supportConfig.supportPhoneNumber}.`
                  : 'Get in touch with customer assistance for product questions and enterprise inquiries.'}
              </p>
            </div>
            <span className="faq-help-card-action">Contact Us &rarr;</span>
          </Link>

          <Link to="/service-request" className="faq-help-card">
            <div>
              <div className="faq-help-card-icon red">
                <Wrench size={22} />
              </div>
              <h4 className="faq-help-card-title">Service &amp; Repair Request</h4>
              <p className="faq-help-card-desc">
                Submit an RMA ticket for hardware diagnostics, physical repair, or firmware troubleshooting.
              </p>
            </div>
            <span className="faq-help-card-action">Submit Ticket &rarr;</span>
          </Link>

          <Link to="/warranty" className="faq-help-card">
            <div>
              <div className="faq-help-card-icon green">
                <ShieldCheck size={22} />
              </div>
              <h4 className="faq-help-card-title">Warranty Verification</h4>
              <p className="faq-help-card-desc">
                Verify hardware warranty status and coverage limits by serial number or order reference.
              </p>
            </div>
            <span className="faq-help-card-action">Check Coverage &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
