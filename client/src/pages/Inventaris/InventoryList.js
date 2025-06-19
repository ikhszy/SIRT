import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function InventoryList() {
  const [inventories, setInventories] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    condition: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/inventory?${params.toString()}`);
      setInventories(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInventories();
  };

  const totalItems = inventories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedInventories = inventories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/${deleteId}`);
      setShowConfirm(false);
      setDeleteId(null);
      fetchInventories();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-boxes me-2"></i> Data Inventaris
          </h1>
          <div>
            <a href="/inventory/add" className="btn btn-success mb-3">
              <i className="fas fa-plus me-1"></i> Tambah Inventaris
            </a>
            <a href="/import-inventory" className="btn btn-primary mb-3 ms-2">
              <i className="fas fa-file-import me-1"></i> Import Inventaris
            </a>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilterSubmit} className="row g-3 mb-4">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nama Barang"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="condition"
              value={filters.condition}
              onChange={handleFilterChange}
            >
              <option value="">-- Kondisi --</option>
              <option value="baik">Baik</option>
              <option value="rusak">Rusak</option>
              <option value="hilang">Hilang</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Lokasi"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Deskripsi"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-1">
            <button type="submit" className="btn btn-primary w-100">Filter</button>
          </div>
        </form>

        {/* Table */}
        <div className="card shadow mb-4">
          <div className="card-body">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead className="table-primary">
                      <tr>
                        <th>Nama Barang</th>
                        <th>Jumlah</th>
                        <th>Kondisi</th>
                        <th>Lokasi</th>
                        <th>Deskripsi</th>
                        <th>Terakhir Diperbarui</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInventories.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">
                            Tidak ada data inventaris
                          </td>
                        </tr>
                      ) : (
                        paginatedInventories.map(item => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.condition}</td>
                            <td>{item.location}</td>
                            <td>{item.description || '-'}</td>
                            <td>{new Date(item.updated_at).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => navigate(`/inventory/edit/${item.id}`)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => confirmDelete(item.id)}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                  </div>
                  <div className="d-flex align-items-center">
                    <label className="me-2">Data per halaman:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {[5, 10, 25, 50, 100].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          &laquo;
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li
                          key={i + 1}
                          className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Confirm Delete Modal */}
        <div
          className={`modal fade ${showConfirm ? 'show d-block' : ''}`}
          tabIndex="-1"
          role="dialog"
          aria-hidden={!showConfirm}
          style={showConfirm ? { backgroundColor: 'rgba(0,0,0,0.5)' } : {}}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                Apakah Anda yakin ingin menghapus data inventaris ini?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                  Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
