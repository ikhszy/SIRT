import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import Select from 'react-select';
import ModalDialog from '../Components/ModalDialog';

export default function EditHousehold() {
  const { kk_number } = useParams();
  const [form, setForm] = useState({
    address_id: '',
    status_KK: '',
    status_kepemilikan_rumah: '',
    borrowed_from_kk: '',
    kepemilikan_remarks: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [kkOptions, setKkOptions] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true
  });

  const navigate = useNavigate();

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
            label: h.kk_number,
            value: h.kk_number
          }));

        setKkOptions(options);
      } catch (err) {
        console.error('Failed to load data:', err);
        setModal({
          show: true,
          title: 'Gagal',
          message: 'Gagal memuat data.',
          isSuccess: false
        });
      }
    };

    fetchData();
  }, [kk_number]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.status_kepemilikan_rumah === 'numpang alamat' && !form.borrowed_from_kk) {
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Silakan isi nomor KK pemilik rumah jika status adalah "Numpang Alamat".',
        isSuccess: false
      });
      return;
    }

    try {
      const payload = {
        ...form,
        borrowed_from_kk: form.status_kepemilikan_rumah === 'numpang alamat' ? form.borrowed_from_kk : null,
        kepemilikan_remarks: form.status_kepemilikan_rumah !== 'pemilik' ? form.kepemilikan_remarks : null
      };

      await api.put(`/households/${kk_number}`, payload);

      setModal({
        show: true,
        title: 'Berhasil',
        message: '✅ Data KK berhasil diperbarui.',
        isSuccess: true
      });

      setTimeout(() => navigate('/households'), 1200);
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        title: 'Gagal',
        message: '❌ Gagal memperbarui data KK.',
        isSuccess: false
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-edit me-2"></i> Ubah Kartu Keluarga
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nomor Kartu Keluarga (tidak bisa diubah)</label>
                <input className="form-control" value={kk_number} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <select
                  name="address_id"
                  className="form-control"
                  value={form.address_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Alamat --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Status KK</label>
                <select
                  className="form-control"
                  name="status_KK"
                  value={form.status_KK}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Status KK --</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif">Tidak Aktif</option>
                </select>
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
                  required
                />
              </div>
            )}

              <div className="mb-3">
                <label className="form-label">Status Kepemilikan Rumah</label>
                <select
                  className="form-control"
                  name="status_kepemilikan_rumah"
                  value={form.status_kepemilikan_rumah}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Status Kepemilikan --</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="pemilik belum pindah">Pemilik (Belum pindah alamat)</option>
                  <option value="numpang alamat">Numpang Alamat</option>
                  <option value="sewa">Kontrak / Sewa</option>
                </select>
              </div>

              {form.status_kepemilikan_rumah && form.status_kepemilikan_rumah !== 'pemilik' && (
              <div className="mb-3">
                <label className="form-label">Keterangan (Alamat Domisili Asal / Lainnya)</label>
                <input
                  type="text"
                  className="form-control"
                  name="kepemilikan_remarks"
                  value={form.kepemilikan_remarks}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

              {form.status_kepemilikan_rumah === 'numpang alamat' && (
                <div className="mb-3">
                  <label className="form-label">Menumpang pada KK Nomor</label>
                  <Select
                    isClearable
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
                </div>
              )}

              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save me-1"></i> Simpan
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
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}
