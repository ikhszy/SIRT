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
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/settings', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
      .then((res) => {
        if (res.data) setFormData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
      });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/settings', formData);
      setMessage('✅ Pengaturan berhasil disimpan.');
    } catch (error) {
      console.error(error);
      setMessage('❌ Gagal menyimpan pengaturan.');
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-cogs me-2"></i> Pengaturan Umum
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {['rt', 'rw', 'kecamatan', 'kelurahan', 'kota', 'kodepos'].map((field) => (
                <div className="mb-3" key={field}>
                  <label className="form-label text-capitalize">{field}</label>
                  <input
                    type="text"
                    className="form-control"
                    name={field}
                    value={formData[field]}
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
