import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import ModalDialog from '../Components/ModalDialog';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });

  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true
  });

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

    const payload = {
      username: formData.username,
      role: formData.role
    };

    if (formData.password && formData.password.trim() !== '') {
      payload.password = formData.password;
    }

    try {
      await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: token }
      });

      setModal({
        show: true,
        title: 'Berhasil',
        message: '✅ Data pengguna berhasil diperbarui.',
        isSuccess: true
      });

      setTimeout(() => {
        setModal(prev => ({ ...prev, show: false }));
        navigate('/users');
      }, 1500);
    } catch (err) {
      setModal({
        show: true,
        title: 'Gagal',
        message: err.response?.data?.error || '❌ Gagal memperbarui pengguna',
        isSuccess: false
      });
    }
  };

  return (
    <AdminLayout>
      <div className="card p-4">
        <h3 className="mb-3">Edit Pengguna</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label>Password (Kosongkan jika tidak diubah)</label>
            <input
              type="password"
              name="password"
              className="form-control"
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label>Role</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              className="form-control"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">Update</button>
        </form>
      </div>

      <ModalDialog
        show={modal.show}
        title={modal.title}
        message={modal.message}
        isSuccess={modal.isSuccess}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}
