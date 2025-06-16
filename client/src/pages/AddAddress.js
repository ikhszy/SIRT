import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function AddAddress() {
  const [form, setForm] = useState({
    full_address: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/address', form);
      navigate('/addresses');
    } catch (err) {
      setError('Failed to add address');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-map-marker-alt me-2"></i> Tambah Alamat
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <input className="form-control" name="full_address" value={form.full_address} onChange={handleChange} placeholder='isikan nama jalan saja...' required />
              </div>

              {error && <div className="text-danger mb-3">{error}</div>}

              <button className="btn btn-primary" type="submit">
                <i className="fas fa-save me-1"></i> Save Address
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
