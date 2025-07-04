import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });
  const [isEditable, setIsEditable] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`/api/users/${id}`, {
      headers: { Authorization: token }
    })
      .then(res => setFormData(prev => ({
        ...prev,
        username: res.data.username,
        role: res.data.role || ''
      })))
      .catch(err => {
        let msg = 'Gagal mengambil data pengguna';
        if (err.response?.status === 404) msg = 'Pengguna tidak ditemukan';
        else if (err.response?.status === 401) msg = 'Unauthorized. Silakan login kembali.';

        setModal({
          show: true,
          title: 'Error',
          message: msg,
          isSuccess: false
        });
      });
  }, [id, token]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      username: formData.username,
      role: formData.role
    };

    if (formData.password?.trim()) {
      payload.password = formData.password;
    }

    try {
      await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: token }
      });

      setToast({
        show: true,
        message: '✅ Data pengguna berhasil diperbarui.',
        isSuccess: true
      });

      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.error || '❌ Gagal memperbarui pengguna',
        isSuccess: false
      });

      if (err.response?.data?.fields) {
        setErrors(err.response.data.fields);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-user-edit me-2"></i> Edit Pengguna
          </h1>
          <div className="d-flex gap-2">
            {!isEditable && (
              <button
                onClick={() => setIsEditable(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-edit me-1"></i> Ubah
              </button>
            )}
            <button
              onClick={() => navigate('/users')}
              className="btn btn-secondary"
            >
              <i className="fas fa-arrow-left me-1"></i> Kembali
            </button>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  className="form-control"
                  required
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Password (Kosongkan jika tidak diubah)</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  className="form-control"
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.role && <div className="invalid-feedback">{errors.role}</div>}
              </div>

              {isEditable ? (
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-1"></i> Simpan Perubahan
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditable(true)}>
                  <i className="fas fa-edit me-1"></i> Ubah
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1060 }}>
          <div className={`toast show text-white ${toast.isSuccess ? 'bg-success' : 'bg-danger'} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
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
