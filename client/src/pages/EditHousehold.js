import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import Select from 'react-select';

export default function EditHousehold() {
  const { kk_number } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isViewMode = location.pathname.includes('/view/');
  const [isEditable, setIsEditable] = useState(!isViewMode);

  const [form, setForm] = useState({
    address_id: '',
    status_KK: '',
    status_KK_remarks: '',
    status_kepemilikan_rumah: '',
    borrowed_from_kk: '',
    kepemilikan_remarks: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [kkOptions, setKkOptions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resHousehold, resAddresses, resAllKk] = await Promise.all([
          api.get(`/households/${kk_number}`),
          api.get('/address'),
          api.get('/households')
        ]);

        setForm({
          address_id: resHousehold.data.address_id || '',
          status_KK: resHousehold.data.status_KK || '',
          status_KK_remarks: resHousehold.data.status_KK_remarks || '',
          status_kepemilikan_rumah: resHousehold.data.status_kepemilikan_rumah || '',
          borrowed_from_kk: resHousehold.data.borrowed_from_kk || '',
          kepemilikan_remarks: resHousehold.data.kepemilikan_remarks || ''
        });

        setAddresses(resAddresses.data);

        const options = resAllKk.data
          .filter((h) => h.kk_number !== kk_number)
          .map((h) => ({
            label: `${h.kk_number} - ${h.full_address}`,
            value: h.kk_number
          }));

        setKkOptions(options);
      } catch (err) {
        console.error('Failed to load data:', err);
        setToast({ show: true, message: 'Gagal memuat data.', isError: true });
      }
    };

    fetchData();
  }, [kk_number]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const inputClass = (field) => `form-control${fieldErrors[field] ? ' is-invalid' : ''}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!form.address_id) errors.address_id = 'Alamat wajib diisi';
    if (!form.status_KK) errors.status_KK = 'Status KK wajib dipilih';
    if (!form.status_kepemilikan_rumah) errors.status_kepemilikan_rumah = 'Status kepemilikan rumah wajib dipilih';

    if (form.status_KK === 'tidak aktif' && !form.status_KK_remarks.trim()) {
      errors.status_KK_remarks = 'Harap isi keterangan tidak aktif';
    }

    if (form.status_kepemilikan_rumah !== 'pemilik' && !form.kepemilikan_remarks.trim()) {
      errors.kepemilikan_remarks = 'Harap isi keterangan kepemilikan';
    }

    if (form.status_kepemilikan_rumah === 'numpang alamat' && !form.borrowed_from_kk) {
      errors.borrowed_from_kk = 'Harap pilih KK tempat menumpang';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({ show: true, message: 'Harap periksa kembali isian Anda.', isError: true });
      return;
    }

    try {
      const payload = {
        ...form,
        borrowed_from_kk: form.status_kepemilikan_rumah === 'numpang alamat' ? form.borrowed_from_kk : null,
        kepemilikan_remarks: form.status_kepemilikan_rumah !== 'pemilik' ? form.kepemilikan_remarks : null,
        status_KK_remarks: form.status_KK === 'tidak aktif' ? form.status_KK_remarks : null
      };

      await api.put(`/households/${kk_number}`, payload);

      setToast({ show: true, message: '✅ Data KK berhasil diperbarui.', isError: false });
      setTimeout(() => navigate('/households'), 2000);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: '❌ Gagal memperbarui data KK.', isError: true });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-edit me-2"></i>
            {isViewMode && !isEditable ? 'Detail Kartu Keluarga' : 'Edit Kartu Keluarga'}
          </h1>
          <div className="d-flex gap-2">
            {!isEditable && (
              <button className="btn btn-primary" onClick={() => setIsEditable(true)}>
                <i className="fas fa-edit me-1"></i> Ubah
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/households')}>
              <i className="fas fa-arrow-left me-1"></i> Kembali
            </button>
          </div>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nomor KK</label>
                <input className="form-control" value={kk_number} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <select
                  name="address_id"
                  className={inputClass('address_id')}
                  value={form.address_id}
                  onChange={handleChange}
                  disabled={!isEditable}
                >
                  <option value="">-- Pilih Alamat --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_address}
                    </option>
                  ))}
                </select>
                {fieldErrors.address_id && <div className="invalid-feedback">{fieldErrors.address_id}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Status KK</label>
                <select
                  name="status_KK"
                  className={inputClass('status_KK')}
                  value={form.status_KK}
                  onChange={handleChange}
                  disabled={!isEditable}
                >
                  <option value="">-- Pilih Status KK --</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif">Tidak Aktif</option>
                </select>
                {fieldErrors.status_KK && <div className="invalid-feedback">{fieldErrors.status_KK}</div>}
              </div>

              {form.status_KK === 'tidak aktif' && (
                <div className="mb-3">
                  <label className="form-label">Keterangan Tidak Aktif</label>
                  <input
                    name="status_KK_remarks"
                    className={inputClass('status_KK_remarks')}
                    value={form.status_KK_remarks}
                    onChange={handleChange}
                    disabled={!isEditable}
                  />
                  {fieldErrors.status_KK_remarks && <div className="invalid-feedback">{fieldErrors.status_KK_remarks}</div>}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Status Kepemilikan Rumah</label>
                <select
                  name="status_kepemilikan_rumah"
                  className={inputClass('status_kepemilikan_rumah')}
                  value={form.status_kepemilikan_rumah}
                  onChange={handleChange}
                  disabled={!isEditable}
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="pemilik belum pindah">Pemilik (Belum pindah alamat)</option>
                  <option value="numpang alamat">Numpang Alamat</option>
                  <option value="sewa">Kontrak / Sewa</option>
                </select>
                {fieldErrors.status_kepemilikan_rumah && <div className="invalid-feedback">{fieldErrors.status_kepemilikan_rumah}</div>}
              </div>

              {form.status_kepemilikan_rumah && form.status_kepemilikan_rumah !== 'pemilik' && (
                <div className="mb-3">
                  <label className="form-label">Keterangan (Alamat Asal / Lainnya)</label>
                  <input
                    name="kepemilikan_remarks"
                    className={inputClass('kepemilikan_remarks')}
                    value={form.kepemilikan_remarks}
                    onChange={handleChange}
                    disabled={!isEditable}
                  />
                  {fieldErrors.kepemilikan_remarks && <div className="invalid-feedback">{fieldErrors.kepemilikan_remarks}</div>}
                </div>
              )}

              {form.status_kepemilikan_rumah === 'numpang alamat' && (
                <div className="mb-3">
                  <label className="form-label">Menumpang pada KK Nomor</label>
                  <Select
                    isClearable
                    isDisabled={!isEditable}
                    placeholder="Pilih KK pemilik rumah..."
                    options={kkOptions}
                    onChange={(selected) =>
                      setForm((prev) => ({
                        ...prev,
                        borrowed_from_kk: selected?.value || ''
                      }))
                    }
                    value={kkOptions.find((opt) => opt.value === form.borrowed_from_kk) || null}
                  />
                  {fieldErrors.borrowed_from_kk && (
                    <div className="text-danger mt-1">{fieldErrors.borrowed_from_kk}</div>
                  )}
                </div>
              )}

              {isEditable && (
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-1"></i> Simpan Perubahan
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {toast.show && (
        <div
          className={`toast align-items-center text-white border-0 position-fixed bottom-0 end-0 m-4 show ${
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
