import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';

export default function EditInventory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState('baik');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', success: true });

  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await api.get(`/inventory/${id}`);
        const data = response.data;
        setName(data.name);
        setQuantity(data.quantity);
        setCondition(data.condition);
        setLocation(data.location);
        setDescription(data.description || '');
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        showSnackbar('Gagal memuat data inventaris.', false);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, [id]);

  const showSnackbar = (msg, success = true) => {
    setSnackbar({ show: true, message: msg, success });
    setTimeout(() => setSnackbar({ show: false, message: '', success: true }), 3000);
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nama barang wajib diisi.';
    if (!quantity || isNaN(quantity) || quantity <= 0)
      newErrors.quantity = 'Jumlah harus berupa angka lebih besar dari 0.';
    if (!location.trim()) newErrors.location = 'Lokasi wajib diisi.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await api.put(`/inventory/${id}`, {
        name: name.trim(),
        quantity: Number(quantity),
        condition,
        location: location.trim(),
        description: description.trim() || null,
      });

      showSnackbar('Inventaris berhasil diperbarui.');
      setEditing(false);
    } catch (err) {
      console.error('Failed to update inventory:', err);
      showSnackbar('Gagal memperbarui inventaris.', false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <div className="spinner-border" role="status" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-boxes-stacked me-2"></i> Edit Inventaris
          </h1>
          <div className="d-flex gap-2">
            {!editing ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                <i className="fas fa-edit me-1"></i> Ubah
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/inventory')}
            >
              <i className="fas fa-arrow-left me-1"></i> Kembali
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Nama Barang</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Jumlah</label>
                <input
                  type="number"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!editing}
                  min={1}
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Kondisi</label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={!editing}
                >
                  <option value="baik">Baik</option>
                  <option value="rusak">Rusak</option>
                  <option value="hilang">Hilang</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Lokasi</label>
                <input
                  type="text"
                  className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!editing}
                />
                {errors.location && <div className="invalid-feedback">{errors.location}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Deskripsi (opsional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
          {editing && (
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <i className="fas fa-save me-1"></i>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/inventory')}
                disabled={saving}
              >
                Batal
              </button>
            </div>
          )}
        </form>

        {/* Toast */}
        {snackbar.show && (
          <div
            className="position-fixed bottom-0 end-0 p-3"
            style={{ zIndex: 1060 }}
          >
            <div
              className={`toast show text-white border-0 shadow ${
                snackbar.success ? 'bg-success' : 'bg-danger'
              }`}
            >
              <div className="d-flex">
                <div className="toast-body">{snackbar.message}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setSnackbar({ show: false, message: '', success: true })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
