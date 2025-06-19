import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';
import ModalDialog from '../../Components/ModalDialog';

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

  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true
  });

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
        setModal({
          show: true,
          title: 'Gagal Memuat',
          message: 'Gagal memuat data inventaris.',
          isSuccess: false
        });
        setLoading(false);
      }
    }
    fetchInventory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return showError('Nama barang wajib diisi.');
    }
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return showError('Jumlah harus berupa angka lebih besar dari 0.');
    }
    if (!location.trim()) {
      return showError('Lokasi wajib diisi.');
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

      setModal({
        show: true,
        title: 'Berhasil',
        message: '✅ Inventaris berhasil diperbarui.',
        isSuccess: true
      });

      setTimeout(() => {
        setModal((prev) => ({ ...prev, show: false }));
        navigate('/inventory');
      }, 1500);
    } catch (err) {
      console.error('Failed to update inventory:', err);
      showError('Gagal memperbarui inventaris. Silakan coba lagi.');
      setSaving(false);
    }
  };

  const showError = (msg) => {
    setModal({
      show: true,
      title: 'Gagal',
      message: msg,
      isSuccess: false
    });
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
