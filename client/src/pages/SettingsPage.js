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
    perMonthAmount: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });
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
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Inline validation
    const newErrors = {};
    if (!formData.rt) newErrors.rt = 'RT wajib diisi';
    if (!formData.rw) newErrors.rw = 'RW wajib diisi';
    if (!formData.kecamatan) newErrors.kecamatan = 'Kecamatan wajib diisi';
    if (!formData.kelurahan) newErrors.kelurahan = 'Kelurahan wajib diisi';
    if (!formData.kota) newErrors.kota = 'Kota wajib diisi';
    if (!formData.kodepos) newErrors.kodepos = 'Kode Pos wajib diisi';
    if (!formData.perMonthAmount) newErrors.perMonthAmount = 'Iuran per Bulan wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      await axios.put('/api/settings', formData, {
        headers: { Authorization: token },
      });
      setToast({ show: true, message: '✅ Pengaturan berhasil disimpan.', isSuccess: true });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate('/login');
      setToast({ show: true, message: '❌ Gagal menyimpan pengaturan.', isSuccess: false });
    } finally {
      setSaving(false);
    }
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
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-cogs me-2"></i> Pengaturan Umum
          </h1>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali ke dashboard
          </button>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {fields.map(({ name, label, type = 'text' }) => (
                <div className="mb-3" key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                  />
                  {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
                </div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>

        {toast.show && (
          <div
            className={`toast show position-fixed bottom-0 end-0 m-4 align-items-center text-white ${
              toast.isSuccess ? 'bg-success' : 'bg-danger'
            }`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast({ ...toast, show: false })}
              ></button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
