import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import Select from 'react-select';

export default function EditHousehold() {
  const { kk_number } = useParams();
  const [form, setForm] = useState({
    address_id: '',
    status_KK: '',
    status_kepemilikan_rumah: '',
    borrowed_from_kk: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [kkOptions, setKkOptions] = useState([]);
  const [error, setError] = useState('');
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
          status_kepemilikan_rumah: resHousehold.data.status_kepemilikan_rumah || '',
          borrowed_from_kk: resHousehold.data.borrowed_from_kk || ''
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
        setError('Gagal memuat data.');
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
    setError('');

    if (form.status_kepemilikan_rumah === 'borrowed' && !form.borrowed_from_kk) {
      setError('Silakan isi nomor KK pemilik rumah jika status adalah "Menumpang".');
      return;
    }

    try {
      const payload = {
        ...form,
        borrowed_from_kk: form.status_kepemilikan_rumah === 'borrowed' ? form.borrowed_from_kk : null
      };

      await api.put(`/households/${kk_number}`, payload);
      navigate('/households');
    } catch (err) {
      console.error(err);
      setError('Gagal memperbarui data KK.');
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
                  <option value="Lokal">Terdaftar disini</option>
                  <option value="Asing">Terdaftar diluar</option>
                </select>
              </div>

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
                  <option value="sewa">Kontrak / Sewa</option>
                  <option value="numpang_kk">Menumpang</option>
                </select>
              </div>

              {form.status_kepemilikan_rumah === 'borrowed' && (
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

              {error && <div className="text-danger mb-3">{error}</div>}

              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save me-1"></i> Simpan
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
