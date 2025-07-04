import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function EditAddress() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isViewMode = location.pathname.includes('/view/');
  const [isEditable, setIsEditable] = useState(!isViewMode);

  const [form, setForm] = useState({ full_address: '' });
  const [originalNormalizedAddress, setOriginalNormalizedAddress] = useState('');
  const [commonSettings, setCommonSettings] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => {
        setToast({ show: false, message: '', isError: false });
        if (!toast.isError) navigate('/addresses');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function extractMainAddress(fullAddress) {
    if (!fullAddress) return "";
    const idx = fullAddress.indexOf(" RT ");
    return idx === -1 ? fullAddress : fullAddress.substring(0, idx);
  }

  function normalizeAddress(text) {
    return text.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings/");
        setCommonSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
        setToast({ show: true, message: 'Gagal memuat pengaturan wilayah.', isError: true });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    api.get(`/address/${id}`)
      .then(res => {
        const fullAddress = res.data.full_address || "";
        const mainAddress = extractMainAddress(fullAddress);
        setForm({ full_address: mainAddress });
        setOriginalNormalizedAddress(normalizeAddress(fullAddress));
      })
      .catch(err => {
        console.error('Failed to load address', err);
        setToast({ show: true, message: 'Gagal memuat data alamat.', isError: true });
      });
  }, [id]);

  const handleChange = async (e) => {
    if (!isEditable) return;
    const newMainAddress = e.target.value;
    setForm((prev) => ({ ...prev, full_address: newMainAddress }));

    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.full_address;
      return newErrors;
    });

    if (!newMainAddress.trim() || !commonSettings) {
      setIsDuplicate(false);
      return;
    }

    const fullCombinedAddress = `${newMainAddress} RT ${commonSettings.rt} RW ${commonSettings.rw} Kelurahan ${commonSettings.kelurahan}, Kecamatan ${commonSettings.kecamatan}, ${commonSettings.kota} ${commonSettings.kodepos}`;
    const normalizedNew = normalizeAddress(fullCombinedAddress);

    if (normalizedNew === originalNormalizedAddress) {
      setIsDuplicate(false);
      return;
    }

    try {
      const res = await api.get('/address/check-duplicate', {
        params: { normalized_address: normalizedNew }
      });
      setIsDuplicate(res.data.exists);
    } catch (err) {
      console.error('Duplicate check error', err);
      setIsDuplicate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_address.trim()) {
      setFieldErrors({ full_address: 'Alamat wajib diisi' });
      setToast({ show: true, message: 'Alamat tidak boleh kosong.', isError: true });
      return;
    }

    if (!commonSettings) {
      setToast({ show: true, message: 'Pengaturan wilayah belum dimuat.', isError: true });
      return;
    }

    if (isDuplicate) {
      setToast({ show: true, message: 'Alamat sudah ada di database.', isError: true });
      return;
    }

    try {
      const finalAddress = `${form.full_address} RT ${commonSettings.rt} RW ${commonSettings.rw} Kelurahan ${commonSettings.kelurahan}, Kecamatan ${commonSettings.kecamatan}, ${commonSettings.kota} ${commonSettings.kodepos}`;
      await api.put(`/address/${id}`, { full_address: finalAddress });
      setToast({ show: true, message: '✅ Alamat berhasil diperbarui!', isError: false });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: '❌ Gagal memperbarui alamat.', isError: true });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-edit me-2"></i>
            {isViewMode && !isEditable ? 'Detail Alamat' : 'Edit Alamat'}
          </h1>
          {isViewMode && !isEditable && (
            <button className="btn btn-primary" onClick={() => setIsEditable(true)}>
              <i className="fas fa-edit me-1"></i> Ubah
            </button>
          )}
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Alamat</label>
                <input
                  name="full_address"
                  className={`form-control ${isDuplicate || fieldErrors.full_address ? 'is-invalid' : ''}`}
                  value={form.full_address}
                  onChange={handleChange}
                  placeholder="Isikan nama jalan saja..."
                  disabled={!isEditable}
                />
                {isDuplicate && <div className="invalid-feedback">Alamat sudah ada di database.</div>}
                {fieldErrors.full_address && <div className="invalid-feedback">{fieldErrors.full_address}</div>}
              </div>

              {isEditable && (
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isDuplicate || !form.full_address.trim()}
                >
                  <i className="fas fa-save me-1"></i> Simpan Perubahan
                </button>
              )}
              <button
                className="btn btn-secondary ms-2"
                type="button"
                onClick={() => navigate('/addresses')}
              >
                Kembali
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
