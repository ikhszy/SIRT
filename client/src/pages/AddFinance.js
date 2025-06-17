import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';

const AddFinance = () => {
  const [formData, setFormData] = useState({
    tanggal: '',
    kategori: '',
    nominal: '',
    keterangan: '',
    jenisPendapatan: '',
    bulan: '',
    addressId: ''
  });

  const [address, setAddress] = useState([]);
  const [perMonthAmount, setPerMonthAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('/api/settings', { headers: { Authorization: token } })
      .then(res => {
        if (res.data.perMonthAmount) {
          setPerMonthAmount(res.data.perMonthAmount);
        }
      });

    axios.get('/api/address', { headers: { Authorization: token } })
      .then(res => {
        setAddress(res.data);
      });
  }, [token]);

  useEffect(() => {
    // Auto-fill nominal if 'Iuran' is selected
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
      const payload = {
        transactionDate: formData.tanggal,
        transactionAmount: Number(formData.nominal),
        remarks: formData.keterangan,
        addressId: formData.jenisPendapatan === 'Iuran' ? formData.addressId : null,
        residentId: null, // or get from somewhere if needed
        months: formData.jenisPendapatan === 'Iuran' && formData.bulan ? [formData.bulan] : [],
      };

      await axios.post('/api/finance/income', payload, {
        headers: {
          Authorization: token,
        },
      });

      navigate('/finance');
    } catch (err) {
      console.error(err);
      setMessage('❌ Gagal menambahkan data.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4">Tambah Transaksi Keuangan</h1>

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
                          {address.map((addr) => (
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
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              {message && <p className="mt-3 text-muted">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddFinance;
