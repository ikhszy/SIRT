import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import ModalDialog from '../Components/ModalDialog';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null, username: '' });
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/users', {
      headers: {
        Authorization: token
      }
    })
    .then(res => setUsers(res.data))
    .catch(err => {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      }
    });
  }, []);

  const confirmDelete = (userId, username) => {
    setConfirmModal({ show: true, userId, username });
  };

  const handleConfirmedDelete = async () => {
    try {
      await axios.delete(`/api/users/${confirmModal.userId}`, {
        headers: {
          Authorization: localStorage.getItem('token')
        }
      });
      setUsers(users.filter(u => u.userId !== confirmModal.userId));
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (err) {
      alert('Gagal menghapus pengguna');
      console.error(err);
    } finally {
      setConfirmModal({ show: false, userId: null, username: '' });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-users-cog me-2"></i> Daftar Pengguna
          </h1>
          <Link to="/users/add" className="btn btn-primary">
            <i className="fas fa-user-plus me-1"></i> Tambah Pengguna
          </Link>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-primary">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Waktu Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(user => (
                    <tr
                      key={user.userId}
                      className="table-row-hover cursor-pointer"
                      onClick={() => window.location.href = `/users/edit/${user.userId}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{user.userId}</td>
                      <td>{user.username}</td>
                      <td>{user.role || '-'}</td>
                      <td>{user.date_created}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => confirmDelete(user.userId, user.username)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center">Belum ada pengguna.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ModalDialog for confirmation */}
        <ModalDialog
          show={confirmModal.show}
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus pengguna "${confirmModal.username}"?`}
          onClose={() => setConfirmModal({ show: false, userId: null, username: '' })}
          isSuccess={false}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ show: false, userId: null, username: '' })}
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
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1060 }}>
            <div className="toast show align-items-center text-white bg-success border-0 shadow">
              <div className="d-flex">
                <div className="toast-body">
                  Pengguna berhasil dihapus
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
      </div>
    </AdminLayout>
  );
}
