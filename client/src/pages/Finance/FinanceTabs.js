import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import KeuanganTab from './KeuanganTab';
import RiwayatIuranTab from './RiwayatIuranTab';

export default function FinanceTabs() {
  const [currentTab, setCurrentTab] = useState('keuangan');

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-wallet me-2"></i> Keuangan RT
          </h1>
          <div>
            <a href="/finance/add" className="btn btn-success me-2">
              <i className="fas fa-plus me-1"></i> Tambah Transaksi
            </a>
            <a href="/finance/import" className="btn btn-primary">
              <i className="fas fa-file-import me-1"></i> Import Excel
            </a>
          </div>
        </div>

        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${currentTab === 'keuangan' ? 'active' : ''}`}
              onClick={() => setCurrentTab('keuangan')}
            >
              Keuangan
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${currentTab === 'riwayat' ? 'active' : ''}`}
              onClick={() => setCurrentTab('riwayat')}
            >
              Riwayat Iuran
            </button>
          </li>
        </ul>

        <div>
          {currentTab === 'keuangan' && <KeuanganTab />}
          {currentTab === 'riwayat' && <RiwayatIuranTab />}
        </div>
      </div>
    </AdminLayout>
  );
}
