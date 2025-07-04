import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';

export default function AddInventory() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState('baik');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const navigate = useNavigate();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Nama barang wajib diisi';
    if (!quantity || isNaN(quantity) || quantity <= 0) errors.quantity = 'Jumlah harus angka > 0';
    if (!location.trim()) errors.location = 'Lokasi wajib diisi';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ show: true, message: 'Harap periksa kembali isian Anda.', isError: true });
      return;
    }

    setSaving(true);

    try {
      await api.post('/inventory', {
        name: name.trim(),
        quantity: Number(quantity),
        condition,
        location: location.trim(),
        description: description.trim() || null,
      });

      setToast({ show: true, message: '✅ Inventaris berhasil ditambahkan!', isError: false });
      setTimeout(() => navigate('/inventory'), 1500);
    } catch (err) {
      console.error('❌ Gagal menambahkan inventaris:', err);
      setToast({ show: true, message: '❌ Gagal menambahkan inventaris.', isError: true });
      setSaving(false);
    }
  };

  const inputClass = (field) => `form-control${fieldErrors[field] ? ' is-invalid' : ''}`;

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-plus me-2"></i> Tambah Inventaris
          </h1>
          <button className="btn btn-warning" onClick={() => navigate('/inventory')}>
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Nama Barang</label>
                <input
                  type="text"
                  className={inputClass('name')}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  disabled={saving}
                />
                {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
              </div>

              <div className="mb-3">
                <label>Jumlah</label>
                <input
                  type="number"
                  className={inputClass('quantity')}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, quantity: undefined }));
                  }}
                  disabled={saving}
                  min={1}
                />
                {fieldErrors.quantity && <div className="invalid-feedback">{fieldErrors.quantity}</div>}
              </div>

              <div className="mb-3">
                <label>Kondisi</label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={saving}
                >
                  <option value="baik">Baik</option>
                  <option value="rusak">Rusak</option>
                  <option value="hilang">Hilang</option>
                </select>
              </div>

              <div className="mb-3">
                <label>Lokasi</label>
                <input
                  type="text"
                  className={inputClass('location')}
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                  disabled={saving}
                />
                {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
              </div>

              <div className="mb-3">
                <label>Deskripsi (opsional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <i className="fas fa-save me-1"></i> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>{' '}
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => navigate('/inventory')}
                disabled={saving}
              >
                Batal
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast.show && (
        <div
          className={`toast position-fixed bottom-0 end-0 m-4 show text-white border-0 ${
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
