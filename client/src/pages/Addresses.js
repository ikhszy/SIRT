import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import ModalDialog from '../Components/ModalDialog';
import Pagination from '../Components/Pagination';


export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state for delete confirmation
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    id: null,
  });

  // Snackbar state
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addrRes, settingsRes] = await Promise.all([
          api.get('/address'),
          api.get('/settings'),
        ]);
        setAddresses(addrRes.data);
        setSettings(settingsRes.data);
      } catch (err) {
        console.error("Failed to fetch address/settings:", err);
        alert("Gagal memuat data alamat. Coba login ulang jika masalah terus berlanjut.");
        navigate("/dashboard");
      }
    };

    fetchData();
  }, []);

  // Show confirmation modal instead of window.confirm
  const confirmDelete = (id) => {
    setConfirmModal({ show: true, id });
  };

  // Handle confirmed delete
  const handleConfirmedDelete = async () => {
    try {
      await api.delete(`/address/${confirmModal.id}`);
      setAddresses(addresses.filter((a) => a.id !== confirmModal.id));
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (err) {
      alert("Gagal menghapus alamat");
      console.error(err);
    } finally {
      setConfirmModal({ show: false, id: null });
    }
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
                    <tr
                      key={a.id}
                      className="table-row-hover"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/addresses/edit/${a.id}`)}
                    >
                      <td>{a.full_address}</td>
                      <td>
                        {/* Delete button should not trigger row navigation */}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent tr onClick
                            confirmDelete(a.id);
                          }}
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
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <nav>
                <Pagination
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </nav>
            </div>
          </div>
        </div>

        {/* ModalDialog for confirmation */}
        <ModalDialog
          show={confirmModal.show}
          title="Konfirmasi Hapus"
          message="Apakah Anda yakin ingin menghapus alamat ini?"
          onClose={() => setConfirmModal({ show: false, id: null })}
          isSuccess={false}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ show: false, id: null })}
              >
                Batal
              </button>
              <button className="btn btn-danger" onClick={handleConfirmedDelete}>
                Hapus
              </button>
            </>
          }
        />

        {/* Snackbar notification */}
        {showSnackbar && (
          <div
            className="position-fixed bottom-0 end-0 p-3"
            style={{ zIndex: 1060 }}
          >
            <div className="toast show align-items-center text-white bg-success border-0 shadow">
              <div className="d-flex">
                <div className="toast-body">Data alamat berhasil dihapus</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setShowSnackbar(false)}
                ></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
