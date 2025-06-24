import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Households() {
  const [households, setHouseholds] = useState([]);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    kk_number: '',
    full_address: '',
    status_KK: '',
    status_kepemilikan_rumah: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get('/households');
      setHouseholds(res.data);
    };
    fetchData();
  }, []);

  const ownershipLabels = {
    'pemilik': 'Pemilik',
    'sewa': 'Kontrak / Sewa',
    'numpang alamat': 'Numpang Alamat',
    'kost': 'Kost',
    null: '-',
    undefined: '-',
  };

  const handleDelete = async (kk_number) => {
    if (!window.confirm("Are you sure you want to delete this household?")) return;
    await api.delete(`/households/${kk_number}`);
    setHouseholds(households.filter(h => h.kk_number !== kk_number));
  };

  const filtered = households.filter(h => {
    const matchKK = h.kk_number.toLowerCase().includes(filters.kk_number.toLowerCase());
    const matchAddress = (h.full_address?.toLowerCase() || '').includes(filters.full_address.toLowerCase());
    const matchStatusKK = filters.status_KK === '' || h.status_KK === filters.status_KK;
    const matchOwnership = filters.status_kepemilikan_rumah === '' || h.status_kepemilikan_rumah === filters.status_kepemilikan_rumah;
    return matchKK && matchAddress && matchStatusKK && matchOwnership;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-home me-2"></i> Kartu Keluarga
          </h1>
          <div>
            <a href="/households/add" className="btn btn-success mb-3">
              <i className="fas fa-plus"></i> Tambah Kartu Keluarga
            </a>
            <button
              className="btn btn-primary mb-3 ms-2"
              onClick={() => navigate("/households/import")}
            >
              <i className="fas fa-file-import"></i> Import Kartu Keluarga
            </button>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nomor KK"
              value={filters.kk_number}
              onChange={(e) => setFilters(f => ({ ...f, kk_number: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Alamat"
              value={filters.full_address}
              onChange={(e) => setFilters(f => ({ ...f, full_address: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-control"
              value={filters.status_KK}
              onChange={(e) => setFilters(f => ({ ...f, status_KK: e.target.value }))}
            >
              <option value="">-- Status KK --</option>
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-control"
              value={filters.status_kepemilikan_rumah}
              onChange={(e) => setFilters(f => ({ ...f, status_kepemilikan_rumah: e.target.value }))}
            >
              <option value="">-- Kepemilikan Rumah --</option>
              <option value="pemilik">Pemilik</option>
              <option value="sewa">Kontrak / Sewa</option>
              <option value="numpang alamat">Menumpang KK</option>
              <option value="kost">Kost</option>
            </select>
          </div>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-primary">
                  <tr>
                    <th>Nomor Kartu Keluarga</th>
                    <th>Alamat</th>
                    <th>Status KK</th>
                    <th>Status Kepemilikan Rumah</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">Tidak ada data Kartu Keluarga</td>
                    </tr>
                  ) : (
                    paginated.map((h) => (
                      <tr key={h.kk_number}>
                        <td>{h.kk_number}</td>
                        <td>{h.full_address || '-'}</td>
                        <td>{h.status_KK === 'tidak aktif' ? 'Tidak Aktif' : 'Aktif'}</td>
                        <td>{ownershipLabels[h.status_kepemilikan_rumah] || '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => navigate(`/households/edit/${h.kk_number}`)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(h.kk_number)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                </div>

                <div className="d-flex align-items-center">
                  <label className="me-2">Data per halaman:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                  >
                    {[5, 10, 25, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                        &laquo;
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
