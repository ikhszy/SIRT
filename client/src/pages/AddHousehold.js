import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function AddHousehold() {
  const [form, setForm] = useState({
    kk_number: '',
    address_id: '',
    status_KK: '',
    status_KK_remarks: '',
    status_kepemilikan_rumah: '',
    borrowed_from_kk: '',
    kepemilikan_remarks: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [kkOptions, setKKOptions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/address').then((res) => setAddresses(res.data));
    api.get('/households').then((res) => {
      const options = res.data.map(h => ({
        label: h.kk_number,
        value: h.kk_number
      }));
      setKKOptions(options);
    });
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.kk_number.trim()) newErrors.kk_number = 'Nomor KK wajib diisi';
    if (!form.address_id) newErrors.address_id = 'Alamat wajib dipilih';
    if (!form.status_KK) newErrors.status_KK = 'Status KK wajib dipilih';

    if (form.status_KK === 'tidak aktif' && !form.status_KK_remarks.trim()) {
      newErrors.status_KK_remarks = 'Harap isi keterangan tidak aktif';
    }

    if (!form.status_kepemilikan_rumah) {
      newErrors.status_kepemilikan_rumah = 'Status kepemilikan rumah wajib dipilih';
    }

    if (form.status_kepemilikan_rumah !== 'pemilik' && !form.kepemilikan_remarks.trim()) {
      newErrors.kepemilikan_remarks = 'Harus diisi jika bukan pemilik';
    }

    if (form.status_kepemilikan_rumah === 'numpang alamat' && !form.borrowed_from_kk) {
      newErrors.borrowed_from_kk = 'Harap pilih nomor KK tempat menumpang';
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setToast({ show: true, message: 'Harap periksa kembali isian Anda.', isError: true });
      return;
    }

    // Try submit
    try {
      const payload = {
        ...form,
        borrowed_from_kk: form.status_kepemilikan_rumah === 'numpang alamat' ? form.borrowed_from_kk : null,
        kepemilikan_remarks: form.status_kepemilikan_rumah !== 'pemilik' ? form.kepemilikan_remarks : null
      };

      await api.post('/households', payload);
      setToast({ show: true, message: 'Kartu Keluarga berhasil ditambahkan!', isError: false });

      setTimeout(() => navigate('/households'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error === "Nomor KK sudah digunakan. Harap periksa kembali."
        ? "Nomor KK sudah digunakan. Harap periksa kembali."
        : "Gagal menambahkan kartu keluarga.";
      setToast({ show: true, message: msg, isError: true });

      if (msg.toLowerCase().includes('nomor kk')) {
        setFieldErrors(prev => ({ ...prev, kk_number: msg }));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-plus me-2"></i> Tambah Kartu Keluarga
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/households')} // or your preferred url
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nomor Kartu Keluarga</label>
                <input
                  className={`form-control ${fieldErrors.kk_number ? 'is-invalid' : ''}`}
                  name="kk_number"
                  value={form.kk_number}
                  onChange={handleChange}
                />
                {fieldErrors.kk_number && (
                  <div className="invalid-feedback">{fieldErrors.kk_number}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <select
                  name="address_id"
                  className={`form-control ${fieldErrors.address_id ? 'is-invalid' : ''}`}
                  value={form.address_id}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Alamat --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_address}
                    </option>
                  ))}
                </select>
                {fieldErrors.address_id && (
                  <div className="invalid-feedback">{fieldErrors.address_id}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Status KK</label>
                <select
                  className={`form-control ${fieldErrors.status_KK ? 'is-invalid' : ''}`}
                  name="status_KK"
                  value={form.status_KK}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Status KK --</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif">Tidak Aktif</option>
                </select>
                {fieldErrors.status_KK && (
                  <div className="invalid-feedback">{fieldErrors.status_KK}</div>
                )}
              </div>

              {form.status_KK === 'tidak aktif' && (
                <div className="mb-3">
                  <label className="form-label">Keterangan Tidak Aktif</label>
                  <input
                    type="text"
                    className="form-control"
                    name="status_KK_remarks"
                    value={form.status_KK_remarks}
                    onChange={handleChange}
                    required={form.status_KK === 'tidak aktif'}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Status Kepemilikan Rumah</label>
                <select
                  className={`form-control ${fieldErrors.status_kepemilikan_rumah ? 'is-invalid' : ''}`}
                  name="status_kepemilikan_rumah"
                  value={form.status_kepemilikan_rumah}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Status Kepemilikan --</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="pemilik belum pindah">Pemilik (Belum pindah alamat)</option>
                  <option value="sewa">Kontrak / Sewa</option>
                  <option value="numpang alamat">Numpang Alamat</option>
                </select>
                {fieldErrors.status_kepemilikan_rumah && (
                  <div className="invalid-feedback">{fieldErrors.status_kepemilikan_rumah}</div>
                )}
              </div>

              {form.status_kepemilikan_rumah && form.status_kepemilikan_rumah !== 'pemilik' && (
                <div className="mb-3">
                  <label className="form-label">Keterangan (Alamat Domisili Asal / Lainnya)</label>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.kepemilikan_remarks ? 'is-invalid' : ''}`}
                    name="kepemilikan_remarks"
                    value={form.kepemilikan_remarks}
                    onChange={handleChange}
                  />
                  {fieldErrors.kepemilikan_remarks && (
                    <div className="invalid-feedback">{fieldErrors.kepemilikan_remarks}</div>
                  )}
                </div>
              )}

              {form.status_kepemilikan_rumah === 'numpang alamat' && (
                <div className="mb-3">
                  <label className="form-label">Menumpang pada KK Nomor</label>
                  <Select
                    className={`form-control ${fieldErrors.borrowed_from_kk ? 'is-invalid' : ''}`}
                    isClearable
                    placeholder="Cari nomor KK..."
                    options={kkOptions}
                    onChange={(selected) =>
                      setForm((prev) => ({
                        ...prev,
                        borrowed_from_kk: selected?.value || ''
                      }))
                    }
                    value={
                      kkOptions.find((opt) => opt.value === form.borrowed_from_kk) || null
                    }
                  />
                  {fieldErrors.borrowed_from_kk && (
                    <div className="invalid-feedback">{fieldErrors.borrowed_from_kk}</div>
                  )}
                </div>
              )}

              <button className="btn btn-primary" type="submit">
                <i className="fas fa-save me-1"></i> Simpan Kartu Keluarga
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast.show && (
        <div
          className={`toast align-items-center text-white border-0 position-fixed bottom-0 end-0 m-4 show ${toast.isError ? 'bg-danger' : 'bg-success'}`}
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
