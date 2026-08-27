import React from 'react';
import { Link } from 'react-router-dom';

export const OutlookDeleteButton = ({ onClick, title = "Delete", disabled = false, className = "" }) => {
  return (
    <button
      type="button"
      className={`outlook-delete-btn ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled}
      title={title}
    >
      <svg className="outlook-trash-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          className="trash-lid" 
          d="M7 6H17V5C17 4.44772 16.5523 4 16 4H8C7.44772 4 7 4.44772 7 5V6ZM6 6V7H18V6H6Z" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          className="trash-can" 
          d="M8 8V18C8 18.5523 8.44772 19 9 19H15C15.5523 19 16 18.5523 16 18V8H8ZM10 11H11V16H10V11ZM13 11H14V16H13V11Z" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </button>
  );
};

export const AnimatedEditButton = ({ onClick, to, title = "Edit", className = "" }) => {
  const content = (
    <svg className="animated-edit-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        className="pencil-body"
        d="M14 4L18 8L7 19H3V15L14 4Z" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        className="pencil-tip"
        d="M14 4L16 2L20 6L18 8L14 4Z" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );

  if (to) {
    return (
      <Link to={to} className={`animated-edit-btn ${className}`} title={title} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(e); }} className={`animated-edit-btn ${className}`} title={title}>
      {content}
    </button>
  );
};

export const AnimatedViewButton = ({ onClick, to, title = "View", className = "" }) => {
  const content = (
    <svg className="animated-view-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8Z" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );

  const btnClass = `animated-view-btn ${className}`;

  if (to) {
    return (
      <Link to={to} className={btnClass} title={title} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(e); }} className={btnClass} title={title}>
      {content}
    </button>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const page = Number(currentPage) || 1;
  const maxPages = Number(totalPages) || 12;

  const isFirstPage = page <= 1;
  const isLastPage = page >= maxPages;

  const countTotal = Number(totalItems) || 15;
  const countPerPage = Number(itemsPerPage) || 10;

  const startItem = countTotal > 0 ? (page - 1) * countPerPage + 1 : 1;
  const endItem = Math.min(page * countPerPage, countTotal);

  const getPageNumbers = () => {
    const pages = [];
    if (maxPages <= 5) {
      for (let i = 1; i <= maxPages; i++) pages.push(i);
    } else {
      if (page <= 2) {
        pages.push(1, 2, '...', maxPages);
      } else if (page >= maxPages - 1) {
        pages.push(1, '...', maxPages - 1, maxPages);
      } else {
        pages.push(1, '...', page, '...', maxPages);
      }
    }
    return pages;
  };

  return (
    <div className="admin-pagination">
      <div className="admin-pagination__info">
        Showing {startItem}–{endItem} of {countTotal} entries
      </div>
      <div className="admin-pagination__buttons">
        {!isFirstPage && (
          <button 
            className="admin-pagination__btn" 
            type="button"
            onClick={() => onPageChange(page - 1)} 
          >
            ‹ Prev
          </button>
        )}
        <div className="admin-pagination__pages">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="admin-pagination__ellipsis">...</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`admin-pagination__page ${page === p ? 'admin-pagination__page--active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        </div>
        {!isLastPage && (
          <button 
            className="admin-pagination__btn" 
            type="button"
            onClick={() => onPageChange(page + 1)} 
          >
            Next ›
          </button>
        )}
      </div>
    </div>
  );
};

