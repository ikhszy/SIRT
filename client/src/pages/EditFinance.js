import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

const EditFinance = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();

  let rawToken = localStorage.getItem('token');
  if (rawToken?.startsWith('Bearer ')) rawToken = rawToken.replace('Bearer ', '');
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

  const [fieldErrors, setFieldErrors] = useState({});
  const [perMonthAmount, setPerMonthAmount] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    api.get(`/finance/${type}/${id}`, { headers: { Authorization: token } })
      .then(res => {
        const data = res.data || {};
        let formattedMonths = '';
        if (Array.isArray(data.months) && data.months.length > 0) {
          formattedMonths = data.months[0]; // just the first one
        }

        setFormData({
          tanggal: data.transactionDate || '',
          kategori: type === 'income' ? 'Pendapatan' : 'Pengeluaran',
          nominal: data.transactionAmount || '',
          keterangan: data.remarks || '',
          jenisPendapatan: data.addressId ? 'Iuran' : 'Lainnya',
          bulan: formattedMonths,
          addressId: data.addressId || '',
        });
      })
      .catch(err => {
        console.error("❌ Error fetching finance data:", err?.response);
        navigate(err?.response?.status === 401 ? '/login' : '/dashboard');
      });

    api.get('/settings', { headers: { Authorization: token } })
      .then(res => {
        if (res.data.perMonthAmount) setPerMonthAmount(res.data.perMonthAmount);
      });

    api.get('/address', { headers: { Authorization: token } })
      .then(res => setAddresses(res.data))
      .finally(() => setLoading(false));
  }, [id, type, token, navigate]);

  useEffect(() => {
    if (formData.kategori === 'Pendapatan' && formData.jenisPendapatan === 'Iuran') {
      setFormData(prev => ({ ...prev, nominal: perMonthAmount }));
    }
  }, [formData.kategori, formData.jenisPendapatan, perMonthAmount]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.tanggal) errors.tanggal = 'Tanggal wajib diisi';
    if (!formData.kategori) errors.kategori = 'Kategori wajib diisi';
    if (!formData.nominal) errors.nominal = 'Nominal wajib diisi';

    if (formData.kategori === 'Pendapatan') {
      if (!formData.jenisPendapatan) errors.jenisPendapatan = 'Jenis pendapatan wajib diisi';
      if (formData.jenisPendapatan === 'Iuran') {
        if (!formData.bulan.trim()) errors.bulan = 'Bulan wajib diisi';
        if (!formData.addressId) errors.addressId = 'Alamat wajib diisi';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ show: true, message: 'Harap periksa kembali isian Anda.', isError: true });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        transactionDate: formData.tanggal,
        transactionAmount: Number(formData.nominal),
        remarks: formData.keterangan || '',
        addressId: formData.jenisPendapatan === 'Iuran' ? formData.addressId : null,
        residentId: null,
        months: formData.jenisPendapatan === 'Iuran' && formData.bulan ? [formData.bulan] : [],
      };

      await api.put(`/finance/${type}/${id}`, payload, { headers: { Authorization: token } });

      setToast({ show: true, message: '✅ Data berhasil diperbarui.', isError: false });
      setTimeout(() => navigate('/finance'), 1500);
    } catch (err) {
      console.error("❌ Error saving finance data:", err?.response);
      setToast({ show: true, message: '❌ Gagal memperbarui data.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-4">Memuat data...</div></AdminLayout>;

  const inputClass = (name) => `form-control${fieldErrors[name] ? ' is-invalid' : ''}`;

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-edit me-2"></i> Ubah Transaksi Keuangan
          </h1>
          <div className="d-flex gap-2">
            {!isEditable ? (
              <button className="btn btn-primary" onClick={() => setIsEditable(true)}>
                <i className="fas fa-pen-to-square me-1"></i> Ubah
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/finance')}>
              <i className="fas fa-arrow-left me-1"></i> Kembali
            </button>
          </div>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Tanggal</label>
                <input type="date" name="tanggal" className={inputClass('tanggal')} value={formData.tanggal} onChange={handleChange} />
                {fieldErrors.tanggal && <div className="invalid-feedback">{fieldErrors.tanggal}</div>}
              </div>

              <div className="mb-3">
                <label>Kategori</label>
                <select name="kategori" className={inputClass('kategori')} value={formData.kategori} onChange={handleChange} disabled={!isEditable}>
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
                    <select name="jenisPendapatan" className={inputClass('jenisPendapatan')} value={formData.jenisPendapatan} onChange={handleChange} disabled={!isEditable}>
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
                        <input name="bulan" type="text" className={inputClass('bulan')} placeholder="Contoh: 06-2025" value={formData.bulan} onChange={handleChange} disabled={!isEditable} />
                        {fieldErrors.bulan && <div className="invalid-feedback">{fieldErrors.bulan}</div>}
                      </div>
                      <div className="mb-3">
                        <label>Alamat</label>
                        <select name="addressId" className={inputClass('addressId')} value={formData.addressId} onChange={handleChange} disabled={!isEditable}>
                          <option value="">-- Pilih Alamat --</option>
                          {addresses.map((addr) => (
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
                <input type="number" name="nominal" className={inputClass('nominal')} value={formData.nominal} onChange={handleChange} disabled={formData.kategori === 'Pendapatan' && formData.jenisPendapatan === 'Iuran'} />
                {fieldErrors.nominal && <div className="invalid-feedback">{fieldErrors.nominal}</div>}
              </div>

              <div className="mb-3">
                <label>Keterangan</label>
                <input type="text" name="keterangan" className="form-control" value={formData.keterangan} onChange={handleChange} />
              </div>

              {isEditable && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className={`toast align-items-center text-white border-0 position-fixed bottom-0 end-0 m-4 show ${toast.isError ? 'bg-danger' : 'bg-success'}`} role="alert" style={{ zIndex: 9999 }}>
          <div className="d-flex">
            <div className="toast-body">{toast.message}</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default EditFinance;
