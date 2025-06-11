import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function EditAddress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_address: '',
    rt: '',
    rw: '',
    village: '',
    district: '',
    city: '',
    postal_code: ''
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
                <label className="form-label">Alamat Lengkap</label>
                <input className="form-control" name="full_address" value={form.full_address} onChange={handleChange} required />
              </div>

              <div className="row mb-3">
                <div className="col-md-2">
                  <label>RT</label>
                  <input className="form-control" name="rt" value={form.rt} onChange={handleChange} />
                </div>
                <div className="col-md-2">
                  <label>RW</label>
                  <input className="form-control" name="rw" value={form.rw} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label>Kelurahan</label>
                  <input className="form-control" name="village" value={form.village} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label>Kecamatan</label>
                  <input className="form-control" name="district" value={form.district} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label>Kota</label>
                  <input className="form-control" name="city" value={form.city} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label>Kode Pos</label>
                  <input className="form-control" name="postal_code" value={form.postal_code} onChange={handleChange} />
                </div>
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
