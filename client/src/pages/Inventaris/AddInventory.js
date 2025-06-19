import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';
import ModalDialog from '../../Components/ModalDialog';

export default function AddInventory() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState('baik');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return setModal({
        show: true,
        title: 'Validasi Gagal',
        message: 'Nama barang wajib diisi.',
        isSuccess: false
      });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return setModal({
        show: true,
        title: 'Validasi Gagal',
        message: 'Jumlah harus berupa angka lebih besar dari 0.',
        isSuccess: false
      });
    }

    if (!location.trim()) {
      return setModal({
        show: true,
        title: 'Validasi Gagal',
        message: 'Lokasi wajib diisi.',
        isSuccess: false
      });
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

      setModal({
        show: true,
        title: 'Sukses',
        message: 'Inventaris berhasil ditambahkan!',
        isSuccess: true
      });

      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
    } catch (err) {
      console.error('Failed to add inventory:', err);
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Gagal menambahkan inventaris. Silakan coba lagi.',
        isSuccess: false
      });
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-plus me-2"></i> Tambah Inventaris
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
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

              <button className="btn btn-primary" type="submit" disabled={saving}>
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

      <ModalDialog
        show={modal.show}
        title={modal.title}
        message={modal.message}
        isSuccess={modal.isSuccess}
        onClose={() => setModal((prev) => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}
