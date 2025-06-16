import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');

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
      const token = localStorage.getItem('token');
      await axios.post('/api/users', formData, {
        headers: {
          Authorization: token
        }
      });
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  return (
    <AdminLayout>
      <div className="card p-4">
        <h3 className="mb-3">Tambah Pengguna</h3>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Username</label>
            <input type="text" name="username" className="form-control" required onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input type="password" name="password" className="form-control" required onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label>Role (Opsional)</label>
            <input type="text" name="role" className="form-control" onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary">Simpan</button>
        </form>
      </div>
    </AdminLayout>
  );
}
