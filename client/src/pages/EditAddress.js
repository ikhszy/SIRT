import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function EditAddress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_address: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/address/${id}`);
        setForm(res.data);
      } catch (err) {
        console.error('Failed to load address', err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/address/${id}`, form);
      navigate('/addresses');
    } catch (err) {
      setError('Failed to update address');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-edit me-2"></i> Ubah Alamat
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
                <i className="fas fa-save me-1"></i> Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
