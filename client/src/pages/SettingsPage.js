import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const [formData, setFormData] = useState({
    rt: '',
    rw: '',
    kecamatan: '',
    kelurahan: '',
    kota: '',
    kodepos: '',
    perMonthAmount: '', // New field
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get('/api/settings', {
        headers: {
          Authorization: token,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      .then((res) => {
        if (res.data) setFormData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      });
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/settings', formData, {
        headers: {
          Authorization: token,
        },
      });
      setMessage('✅ Pengaturan berhasil disimpan.');
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setMessage('❌ Gagal menyimpan pengaturan.');
    }
    setSaving(false);
  };

  const fields = [
    { name: 'rt', label: 'RT' },
    { name: 'rw', label: 'RW' },
    { name: 'kecamatan', label: 'Kecamatan' },
    { name: 'kelurahan', label: 'Kelurahan' },
    { name: 'kota', label: 'Kota' },
    { name: 'kodepos', label: 'Kode Pos' },
    { name: 'perMonthAmount', label: 'Iuran per Bulan (Rp)', type: 'number' },
  ];

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-cogs me-2"></i> Pengaturan Umum
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {fields.map(({ name, label, type = 'text' }) => (
                <div className="mb-3" key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className="form-control"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              {message && <p className="mt-3 text-muted">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
