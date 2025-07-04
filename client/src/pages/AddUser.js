import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import ModalDialog from '../Components/ModalDialog';

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users', formData, {
        headers: {
          Authorization: token
        }
      });

      setToast({
        show: true,
        message: 'Pengguna berhasil ditambahkan!',
        isSuccess: true
      });

      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Terjadi kesalahan saat menambahkan pengguna';

      setToast({
        show: true,
        message: msg,
        isSuccess: false
      });

      // Optional: handle server-side validation structure
      if (err.response?.data?.fields) {
        setErrors(err.response.data.fields); // if backend sends field-level errors
      }
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-user-shield me-2"></i> Tambah Pengguna
          </h1>
          <a href="/users" className="btn btn-warning">
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </a>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  required
                  onChange={handleChange}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  required
                  onChange={handleChange}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Role (Opsional)</label>
                <input
                  type="text"
                  name="role"
                  className="form-control"
                  onChange={handleChange}
                />
                {errors.role && <div className="invalid-feedback">{errors.role}</div>}
              </div>

              <div className="text-end mt-4">
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-2"></i> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1060 }}>
          <div className={`toast show align-items-center text-white ${toast.isSuccess ? 'bg-success' : 'bg-danger'} border-0`}>
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
              ></button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
