import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import ModalDialog from '../Components/ModalDialog';
import Pagination from '../Components/Pagination';

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // filters state
  const [filterName, setFilterName] = useState('');
  const [filterNIK, setFilterNIK] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    residentId: null,
    residentName: ''
  });
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort by name ascending
        const sorted = res.data.sort((a, b) => a.full_name.localeCompare(b.full_name));
        setResidents(sorted);
      } catch (err) {
        console.error('Failed to fetch residents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const filteredResidents = residents.filter((res) => {
    return (
      res.full_name?.toLowerCase().includes(filterName.toLowerCase()) &&
      res.nik?.toLowerCase().includes(filterNIK.toLowerCase()) &&
      (filterGender === '' || res.gender?.toLowerCase() === filterGender.toLowerCase()) &&
      (filterStatus === '' || res.status?.toLowerCase() === filterStatus.toLowerCase())
    );
  });

  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmDelete = (residentId, fullName) => {
    setConfirmModal({
      show: true,
      residentId,
      residentName: fullName
    });
  };

  const handleConfirmedDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/residents/${confirmModal.residentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents(residents.filter((r) => r.id !== confirmModal.residentId));
      setShowSnackbar({ show: true, message: 'Data warga berhasil dihapus' });
    } catch (err) {
      alert('Gagal menghapus data');
      console.error(err);
    } finally {
      setConfirmModal({ show: false, residentId: null, residentName: '' });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-users me-2"></i> Data Warga
          </h1>
            <div>
              <a href="/residents/add" className="btn btn-success mb-3">
                <i className="fas fa-plus"></i> Tambah Data Warga
              </a>
              <a href="/residents/import" className="btn btn-primary mb-3 ms-2">
                <i className="fas fa-file-import"></i> Import Data Warga
              </a>
            </div>
        </div>

        <div className="mb-3 row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Cari Nama"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Cari NIK"
              value={filterNIK}
              onChange={(e) => {
                setFilterNIK(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Status NIK</option>
              <option value="aktif">Aktif</option>
              <option value="tidak aktif - meninggal">Tidak Aktif - Meninggal</option>
              <option value="tidak aktif - pindah">Tidak Aktif - Pindah</option>
              <option value="tidak aktif - lainnya">Tidak Aktif - Lainnya</option>
            </select>
          </div>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-primary">
                  <tr>
                    <th>Name</th>
                    <th>NIK</th>
                    <th>Alamat</th>
                    <th>Jenis Kelamin</th>
                    <th>Status NIK</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">Tidak ada Data Warga</td>
                    </tr>
                  ) : (
                    paginatedResidents.map((res) => (
                      <tr key={res.id} onClick={() => navigate(`/residents/view/${res.id}`)} style={{ cursor: 'pointer' }}>
                        <td>{res.full_name}</td>
                        <td>{res.nik}</td>
                        <td>{res.full_address}</td>
                        <td>{res.gender}</td>
                        <td>{res.status}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => confirmDelete(res.id, res.full_name)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}
                  {' - '}
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
                  <Pagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalDialog
        show={confirmModal.show}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus warga "${confirmModal.residentName}"?`}
        onClose={() => setConfirmModal({ show: false, residentId: null, residentName: '' })}
        isSuccess={false}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmModal({ show: false, residentId: null, residentName: '' })}
            >
              Batal
            </button>
            <button className="btn btn-danger" onClick={handleConfirmedDelete}>
              Hapus
            </button>
          </>
        }
      />
      {showSnackbar && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1060 }}
        >
          <div className="toast show align-items-center text-white bg-success border-0 shadow">
            <div className="d-flex">
              <div className="toast-body">
                Data warga berhasil dihapus
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowSnackbar(false)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
