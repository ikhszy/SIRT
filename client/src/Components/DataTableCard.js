import React from 'react';

export default function DataTableCard({
  title = '',
  children,
  minHeight = '400px',
  className = '',
}) {
  return (
    <div className={`card shadow mb-4 ${className}`}>
      {title && (
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
        </div>
      )}
      <div className="card-body" style={{ minHeight }}>
        <div className="table-responsive">
          {children}
        </div>
      </div>
    </div>
  );
}
