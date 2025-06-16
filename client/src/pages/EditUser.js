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

  useEffect(() => {
    axios.get(`/api/users/${id}`)
      .then(res => setFormData(res.data))
      .catch(err => setError('Gagal mengambil data pengguna'));
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(`/api/users/${id}`, formData);
      navigate('/pengguna');
    } catch (err) {
      setError('Gagal memperbarui pengguna');
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
              value={formData.role || ''}
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
