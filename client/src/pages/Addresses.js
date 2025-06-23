import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  console.log("✅ Addresses component mounted");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addrRes, settingsRes] = await Promise.all([
          api.get('/address'),
          api.get('/settings')
        ]);
        setAddresses(addrRes.data);
        setSettings(settingsRes.data);
      } catch (err) {
        console.error("Failed to fetch address/settings:", err);
        alert("Gagal memuat data alamat. Coba login ulang jika masalah terus berlanjut.");
        // Optional: redirect to dashboard instead of crashing
        navigate("/dashboard");
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    await api.delete(`/address/${id}`);
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const filtered = addresses.filter((a) =>
    a.full_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAddresses = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-map-marker-alt me-2"></i> Data Alamat
          </h1>
          <div>
            <a href="/addresses/add" className="btn btn-success mb-3">
              <i className="fas fa-plus me-1"></i> Tambah Alamat
            </a>
            <a href="/address/import" className="btn btn-primary mb-3 ms-2">
              <i className="fas fa-file-import"></i> Import Alamat
            </a>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari menggunakan alamat..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="card shadow">
          <div className="card-body table-responsive">
            <table className="table table-bordered">
              <thead className="table-primary">
                <tr>
                  <th>Alamat Lengkap</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAddresses.length > 0 && settings ? (
                  paginatedAddresses.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.full_address}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => navigate(`/addresses/edit/${a.id}`)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(a.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center">
                      Tidak ada data alamat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
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
                  {[5, 10, 25, 50, 100].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
 
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
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
                    <button className="page-link" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
