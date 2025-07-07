import React from 'react';

export default function Pagination({ totalPages, currentPage, onPageChange }) {
  const getPaginationNumbers = () => {
    const pages = [];
    const delta = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <ul className="pagination mb-0">
      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>&laquo;</button>
      </li>

      {getPaginationNumbers().map((page, index) => (
        <li
          key={index}
          className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
        >
          {page === '...' ? (
            <span className="page-link">…</span>
          ) : (
            <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
          )}
        </li>
      ))}

      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>&raquo;</button>
      </li>
    </ul>
  );
}
