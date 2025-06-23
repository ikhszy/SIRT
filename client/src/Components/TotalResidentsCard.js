import React from 'react';

export default function TotalResidentsCard({ residents }) {
  const total = residents.length;

  return (
    <div className="card text-white bg-primary p-3 h-100">
      <div>
        <div className="fs-5">Total Warga</div>
        <div className="display-6 fw-bold">{total}</div>
      </div>
    </div>
  );
}
