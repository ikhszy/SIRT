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
  const [modal, setModal] = useState({ show: false, title: '', message: '', isSuccess: true });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users', formData, {
        headers: {
          Authorization: token
        }
      });

      setModal({
        show: true,
        title: 'Sukses',
        message: 'Pengguna berhasil ditambahkan!',
        isSuccess: true
      });

      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (err) {
      setModal({
        show: true,
        title: 'Gagal',
        message: err.response?.data?.error || 'Terjadi kesalahan saat menambahkan pengguna',
        isSuccess: false
      });
    }
  };

  return (
    <AdminLayout>
      <div className="card p-4">
        <h3 className="mb-3">Tambah Pengguna</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label>Role (Opsional)</label>
            <input
              type="text"
              name="role"
              className="form-control"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">Simpan</button>
        </form>
      </div>

      <ModalDialog
        show={modal.show}
        title={modal.title}
        message={modal.message}
        isSuccess={modal.isSuccess}
        onClose={() => setModal((prev) => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}
