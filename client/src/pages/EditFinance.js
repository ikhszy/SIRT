import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

const EditFinance = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  let rawToken = localStorage.getItem('token');
  if (rawToken?.startsWith('Bearer ')) {
    rawToken = rawToken.replace('Bearer ', '');
  }
  const token = `Bearer ${rawToken}`;

  const [formData, setFormData] = useState({
    tanggal: '',
    kategori: '',
    nominal: '',
    keterangan: '',
    jenisPendapatan: '',
    bulan: '',
    addressId: '',
  });

  const [perMonthAmount, setPerMonthAmount] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch finance record by ID
    axios.get(`/api/finance/${type}/${id}`, { headers: { Authorization: token } })
      .then(res => {
        if (res.data) {
          const data = res.data;
          setFormData({
            tanggal: data.transactionDate || '',
            kategori: type === 'income' ? 'Pendapatan' : 'Pengeluaran',
            nominal: data.transactionAmount || '',
            keterangan: data.remarks || '',
            jenisPendapatan: data.addressId ? 'Iuran' : 'Lainnya',
            bulan: '', // Optional: set if needed from donation history
            addressId: data.addressId || '',
          });
        }
      })
      .catch(err => {
        console.error("❌ Error fetching finance data:", err?.response);
        if (err.response?.status === 401) navigate('/login');
        else navigate('/dashboard'); // fallback redirect
      });

    // Fetch settings (perMonthAmount)
    axios.get('/api/settings', { headers: { Authorization: token } })
      .then(res => {
        if (res.data.perMonthAmount) {
          setPerMonthAmount(res.data.perMonthAmount);
        }
      });

    // Fetch addresses
    axios.get('/api/address', { headers: { Authorization: token } })
      .then(res => {
        setAddresses(res.data);
      })
      .finally(() => setLoading(false));
  }, [id, type, token, navigate]);

  useEffect(() => {
    if (formData.kategori === 'Pendapatan' && formData.jenisPendapatan === 'Iuran') {
      setFormData(prev => ({ ...prev, nominal: perMonthAmount }));
    }
  }, [formData.kategori, formData.jenisPendapatan, perMonthAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/finance/${type}/${id}`, formData, {
        headers: { Authorization: token },
      });
      navigate('/keuangan');
    } catch (err) {
      console.error("❌ Error saving finance data:", err?.response);
      setMessage('❌ Gagal memperbarui data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-4">Memuat data...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4">Edit Transaksi Keuangan</h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Tanggal</label>
                <input type="date" className="form-control" name="tanggal" value={formData.tanggal} onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label>Kategori</label>
                <select className="form-control" name="kategori" value={formData.kategori} onChange={handleChange} required>
                  <option value="">-- Pilih --</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
              </div>

              {formData.kategori === 'Pendapatan' && (
                <>
                  <div className="mb-3">
                    <label>Jenis Pendapatan</label>
                    <select className="form-control" name="jenisPendapatan" value={formData.jenisPendapatan} onChange={handleChange} required>
                      <option value="">-- Pilih --</option>
                      <option value="Iuran">Iuran</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {formData.jenisPendapatan === 'Iuran' && (
                    <>
                      <div className="mb-3">
                        <label>Bulan (MM-YYYY)</label>
                        <input type="text" className="form-control" name="bulan" value={formData.bulan} onChange={handleChange} placeholder="Contoh: 06-2025" required />
                      </div>
                      <div className="mb-3">
                        <label>Alamat</label>
                        <select className="form-control" name="addressId" value={formData.addressId} onChange={handleChange} required>
                          <option value="">-- Pilih Alamat --</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.full_address}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="mb-3">
                <label>Nominal</label>
                <input
                  type="number"
                  className="form-control"
                  name="nominal"
                  value={formData.nominal}
                  onChange={handleChange}
                  disabled={formData.kategori === 'Pendapatan' && formData.jenisPendapatan === 'Iuran'}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Keterangan</label>
                <input type="text" className="form-control" name="keterangan" value={formData.keterangan} onChange={handleChange} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              {message && <p className="mt-3 text-muted">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditFinance;
