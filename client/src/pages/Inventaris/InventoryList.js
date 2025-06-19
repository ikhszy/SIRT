import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function InventoryList() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventories();
  }, []);

  async function fetchInventories() {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setInventories(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    setLoading(false);
  }

  const filteredInventories = inventories.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.condition?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const totalItems = filteredInventories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedInventories = filteredInventories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function confirmDelete(id) {
    setDeleteId(id);
    setShowConfirm(true);
  }

  async function handleDelete() {
    try {
      await api.delete(`/inventory/${deleteId}`);
      setShowConfirm(false);
      setDeleteId(null);
      fetchInventories();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

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
            <a href="/import-inventory" className="btn btn-warning mb-3">
              <i className="fas fa-file-import me-1"></i> Import Inventaris
            </a>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari nama, kondisi, lokasi, deskripsi..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

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

                {/* Pagination & Page Size */}
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
                        <option key={num} value={num}>
                          {num}
                        </option>
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
                      <li
                        className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
                      >
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
          aria-labelledby="confirmDeleteModalLabel"
          aria-hidden={!showConfirm}
          style={showConfirm ? { backgroundColor: 'rgba(0,0,0,0.5)' } : {}}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="confirmDeleteModalLabel">
                  Konfirmasi Hapus
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                Apakah Anda yakin ingin menghapus data inventaris ini?
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirm(false)}
                >
                  Batal
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
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
