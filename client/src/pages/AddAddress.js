import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function AddAddress() {
  const [form, setForm] = useState({ full_address: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [commonSettings, setCommonSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await api.get("/settings/");
      setCommonSettings(res.data);
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  function normalizeAddress(text) {
    return text
      .toLowerCase()
      .replace(/\./g, '') // remove dots
      .replace(/\s+/g, ' ') // collapse spaces
      .trim();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_address.trim()) {
      setFieldErrors({ full_address: 'Alamat wajib diisi' });
      setToast({ show: true, message: 'Alamat wajib diisi.', isError: true });
      return;
    }

    try {
      if (!commonSettings) return;

      const finalFullAddress = `${form.full_address} RT ${commonSettings.rt} RW ${commonSettings.rw} Kelurahan ${commonSettings.kelurahan}, Kecamatan ${commonSettings.kecamatan}, ${commonSettings.kota} ${commonSettings.kodepos}`;
      const normalizedNewAddress = normalizeAddress(finalFullAddress);

      const duplicateCheck = await api.get('/address/check-duplicate', {
        params: { normalized_address: normalizedNewAddress }
      });

      if (duplicateCheck.data.exists) {
        setToast({ show: true, message: 'Alamat sudah ada di database.', isError: true });
        return;
      }

      await api.post('/address', { full_address: finalFullAddress });
      setToast({ show: true, message: 'Alamat berhasil ditambahkan!', isError: false });

      // Delay redirect by 2s
      setTimeout(() => navigate('/addresses'), 2000);

    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Gagal menambahkan alamat.', isError: true });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-map-marker-alt me-2"></i> Tambah Alamat
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/addresses')} // or your preferred url
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <input
                  className={`form-control ${fieldErrors.full_address ? 'is-invalid' : ''}`}
                  name="full_address"
                  value={form.full_address}
                  onChange={handleChange}
                  placeholder="Contoh: Jl. Sukma No. 1..."
                />
                {fieldErrors.full_address && (
                  <div className="invalid-feedback">{fieldErrors.full_address}</div>
                )}
              </div>

              <button className="btn btn-primary" type="submit">
                <i className="fas fa-save me-1"></i> Simpan Alamat
              </button>
            </form>
          </div>
        </div>
      </div>
      {toast.show && (
        <div
          className={`toast align-items-center text-white border-0 position-fixed bottom-0 end-0 m-4 fade show ${
            toast.isError ? 'bg-danger' : 'bg-success'
          }`}
          role="alert"
          style={{ zIndex: 9999 }}
        >
          <div className="d-flex">
            <div className="toast-body">{toast.message}</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
