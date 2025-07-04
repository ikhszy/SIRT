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
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [fieldErrors, setFieldErrors] = useState({});
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
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (formData.kategori === 'Pendapatan' && formData.jenisPendapatan === 'Iuran') {
      setFormData(prev => ({ ...prev, nominal: perMonthAmount }));
    }
  }, [formData.kategori, formData.jenisPendapatan, perMonthAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.tanggal) errors.tanggal = 'Tanggal wajib diisi';
    if (!formData.kategori) errors.kategori = 'Kategori wajib dipilih';
    if (!formData.nominal || isNaN(formData.nominal)) errors.nominal = 'Nominal wajib diisi dan berupa angka';

    if (formData.kategori === 'Pendapatan') {
      if (!formData.jenisPendapatan) errors.jenisPendapatan = 'Jenis pendapatan wajib dipilih';
      if (formData.jenisPendapatan === 'Iuran') {
        if (!formData.bulan.trim()) errors.bulan = 'Bulan wajib diisi';
        if (!formData.addressId) errors.addressId = 'Alamat wajib dipilih';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({ show: true, message: 'Harap isi semua field yang wajib.', isError: true });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        transactionDate: formData.tanggal,
        transactionAmount: Number(formData.nominal),
        remarks: formData.keterangan,
        addressId: formData.jenisPendapatan === 'Iuran' ? formData.addressId : null,
        residentId: null,
        months: formData.jenisPendapatan === 'Iuran' && formData.bulan ? [formData.bulan] : [],
      };

      const endpoint = formData.kategori === 'Pendapatan'
        ? '/api/finance/income'
        : '/api/finance/expense';

      await axios.post(endpoint, payload, {
        headers: { Authorization: token },
      });

      setToast({
        show: true,
        message: 'Data transaksi berhasil ditambahkan!',
        isError: false
      });

      setTimeout(() => navigate('/finance'), 1500);
    } catch (err) {
      const customError = err.response?.data?.error;
      setToast({
        show: true,
        message: customError ? `❌ ${customError}` : '❌ Gagal menambahkan data.',
        isError: true
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) => `form-control ${fieldErrors[field] ? 'is-invalid' : ''}`;

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-plus me-2"></i> Tambah Transaksi Keuangan
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/finance')} // or your preferred url
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Tanggal</label>
                <input type="date" className={inputClass('tanggal')} name="tanggal" value={formData.tanggal} onChange={handleChange} />
                {fieldErrors.tanggal && <div className="invalid-feedback">{fieldErrors.tanggal}</div>}
              </div>

              <div className="mb-3">
                <label>Kategori</label>
                <select className={inputClass('kategori')} name="kategori" value={formData.kategori} onChange={handleChange}>
                  <option value="">-- Pilih --</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
                {fieldErrors.kategori && <div className="invalid-feedback">{fieldErrors.kategori}</div>}
              </div>

              {formData.kategori === 'Pendapatan' && (
                <>
                  <div className="mb-3">
                    <label>Jenis Pendapatan</label>
                    <select className={inputClass('jenisPendapatan')} name="jenisPendapatan" value={formData.jenisPendapatan} onChange={handleChange}>
                      <option value="">-- Pilih --</option>
                      <option value="Iuran">Iuran</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    {fieldErrors.jenisPendapatan && <div className="invalid-feedback">{fieldErrors.jenisPendapatan}</div>}
                  </div>

                  {formData.jenisPendapatan === 'Iuran' && (
                    <>
                      <div className="mb-3">
                        <label>Bulan (MM-YYYY)</label>
                        <input
                          type="text"
                          className={inputClass('bulan')}
                          name="bulan"
                          value={formData.bulan}
                          onChange={handleChange}
                          placeholder="Contoh: 06-2025"
                        />
                        {fieldErrors.bulan && <div className="invalid-feedback">{fieldErrors.bulan}</div>}
                      </div>

                      <div className="mb-3">
                        <label>Alamat</label>
                        <select className={inputClass('addressId')} name="addressId" value={formData.addressId} onChange={handleChange}>
                          <option value="">-- Pilih Alamat --</option>
                          {address.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.full_address}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.addressId && <div className="invalid-feedback">{fieldErrors.addressId}</div>}
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="mb-3">
                <label>Nominal</label>
                <input
                  type="number"
                  className={inputClass('nominal')}
                  name="nominal"
                  value={formData.nominal}
                  onChange={handleChange}
                />
                {fieldErrors.nominal && <div className="invalid-feedback">{fieldErrors.nominal}</div>}
              </div>

              <div className="mb-3">
                <label>Keterangan</label>
                <input
                  type="text"
                  className="form-control"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
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
};

export default AddFinance;
