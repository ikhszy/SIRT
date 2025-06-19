import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import ModalDialog from '../Components/ModalDialog';

export default function AddAddress() {
  const [form, setForm] = useState({ full_address: '' });
  const [modal, setModal] = useState({ show: false, message: '', title: '', isSuccess: true });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_address.trim()) {
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Alamat tidak boleh kosong.',
        isSuccess: false
      });
      return;
    }

    try {
      await api.post('/address', form);
      setModal({
        show: true,
        title: 'Sukses',
        message: 'Alamat berhasil ditambahkan!',
        isSuccess: true
      });

      setTimeout(() => {
        navigate('/addresses');
      }, 1500);
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Gagal menambahkan alamat.',
        isSuccess: false
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-map-marker-alt me-2"></i> Tambah Alamat
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <input
                  className="form-control"
                  name="full_address"
                  value={form.full_address}
                  onChange={handleChange}
                  placeholder="Isikan nama jalan saja..."
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit">
                <i className="fas fa-save me-1"></i> Simpan Alamat
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
