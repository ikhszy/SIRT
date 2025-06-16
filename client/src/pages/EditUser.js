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
  const [error, setError] = useState('');

  // Helper to get token
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
        if (err.response?.status === 404) {
          setError('Pengguna tidak ditemukan');
        } else if (err.response?.status === 401) {
          setError('Unauthorized. Silakan login kembali.');
        } else {
          setError('Gagal mengambil data pengguna');
        }
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
    setError('');

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
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperbarui pengguna');
    }
  };

  return (
    <AdminLayout>
      <div className="card p-4">
        <h3 className="mb-3">Edit Pengguna</h3>
        {error && <div className="alert alert-danger">{error}</div>}

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
    </AdminLayout>
  );
}
