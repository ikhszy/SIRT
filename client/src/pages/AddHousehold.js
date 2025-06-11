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
    status_kepemilikan_rumah: '',
    borrowed_from_kk: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [kkOptions, setKKOptions] = useState([]);
  const [error, setError] = useState('');
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

      await api.post('/households', payload);
      navigate('/households');
    } catch (err) {
      setError('Gagal menambahkan kartu keluarga.');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-plus me-2"></i> Tambah Kartu Keluarga
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nomor Kartu Keluarga</label>
                <input
                  className="form-control"
                  name="kk_number"
                  value={form.kk_number}
                  onChange={handleChange}
                  required
                />
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
                  <option value="numpang_kk">Menumpang KK</option>
                </select>
              </div>

              {form.status_kepemilikan_rumah === 'borrowed' && (
                <div className="mb-3">
                  <label className="form-label">Menumpang pada KK Nomor</label>
                  <Select
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
                </div>
              )}

              {error && <div className="text-danger mb-3">{error}</div>}

              <button className="btn btn-primary" type="submit">
                <i className="fas fa-save me-1"></i> Simpan Kartu Keluarga
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// add comment
