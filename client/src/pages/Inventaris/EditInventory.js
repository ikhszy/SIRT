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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await api.get(`/inventory-transactions/${id}`);
        const data = response.data;
        setName(data.name);
        setQuantity(data.quantity);
        setCondition(data.condition);
        setLocation(data.location);
        setDescription(data.description || '');
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Gagal memuat data inventaris.');
        setLoading(false);
      }
    }
    fetchInventory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      setError('Jumlah harus berupa angka lebih besar dari 0.');
      return;
    }
    if (!location.trim()) {
      setError('Lokasi wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/inventory/${id}`, {
        name: name.trim(),
        quantity: Number(quantity),
        condition,
        location: location.trim(),
        description: description.trim() || null,
      });
      navigate('/inventory');
    } catch (err) {
      console.error('Failed to update inventory:', err);
      setError('Gagal memperbarui inventaris. Silakan coba lagi.');
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
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-edit me-2"></i> Edit Inventaris
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nama Barang</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan nama barang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Jumlah</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Masukkan jumlah"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={saving}
                  min={1}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Kondisi</label>
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
                <label className="form-label">Lokasi</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan lokasi barang"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Deskripsi (opsional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tambahkan deskripsi (opsional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <i className="fas fa-save me-1"></i>{' '}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>{' '}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/inventory')}
                disabled={saving}
              >
                Batal
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
