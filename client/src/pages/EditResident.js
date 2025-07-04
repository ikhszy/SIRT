// ...imports unchanged...
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import countries from '../utils/countries';
import occupations from '../utils/occupations';

export default function EditResident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view/');
  const [error, setError] = useState('');
  const [isEditable, setIsEditable] = useState(!isViewMode);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const [form, setForm] = useState({
    full_name: '',
    nik: '',
    kk_number: '',
    gender: '',
    birthplace: '',
    birthdate: '',
    blood_type: '',
    age: '',
    religion: '',
    marital_status: '',
    relationship: '',
    education: '',
    occupation: '',
    citizenship: 'Indonesia',
    address_id: '',
    status: '',
    status_remarks:'',
  });

  const [households, setHouseholds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const selectedHousehold = households.find(h => h.kk_number === form.kk_number);
  const isStatusLocked = selectedHousehold?.status_kepemilikan_rumah === 'pemilik belum pindah';

  useEffect(() => {
  if (form.status !== 'tidak aktif - lainnya' && form.status_remarks) {
    setForm((prev) => ({ ...prev, status_remarks: '' }));
  }
}, [form.status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/households');
        setHouseholds(res.data);
      } catch (err) {
        console.error('Failed to fetch households:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const res = await api.get(`/residents/${id}`);
        setForm(res.data);
      } catch (err) {
        console.error('Failed to fetch resident:', err);
      }
    };
    fetchResident();
  }, [id]);

  useEffect(() => {
    if (form.birthdate) {
      const today = new Date();
      const birthDate = new Date(form.birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setForm((prev) => ({ ...prev, age }));
    }
  }, [form.birthdate]);

  useEffect(() => {
    const selectedHH = households.find(h => h.kk_number === form.kk_number);
    if (selectedHH) {
      setForm(prev => ({ ...prev, address_id: selectedHH.address_id }));
    }
  }, [form.kk_number, households]);

  useEffect(() => {
    const household = households.find(h => h.kk_number === form.kk_number);
    if (household?.status_kepemilikan_rumah === 'pemilik belum pindah') {
      setForm(prev => ({
        ...prev,
        status: 'tidak aktif - domisili diluar',
        status_remarks: ''
      }));
    }
  }, [form.kk_number, households]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = [
      'full_name', 'nik', 'kk_number', 'gender', 'birthplace', 'birthdate',
      'religion', 'marital_status', 'relationship', 'citizenship', 'address_id', 'status'
    ];

    const errors = {};
    required.forEach((field) => {
      if (!form[field] || form[field].toString().trim() === '') {
        errors[field] = 'Harus diisi';
      }
    });

    if (form.status === 'tidak aktif - lainnya' && (!form.status_remarks || form.status_remarks.trim() === '')) {
      errors.status_remarks = 'Harus diisi untuk status lainnya';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setToast({
        show: true,
        message: 'Harap isi bagian yang wajib!',
        isError: true,
      });
      return;
    }

    try {
      await api.put(`/residents/${id}`, form);
      setToast({
        show: true,
        message: 'Data warga berhasil diperbarui.',
        isError: false,
      });
      setTimeout(() => navigate('/residents'), 2000);
    } catch (err) {
      console.error('Update error:', err);

      // Check if backend sent duplicate NIK error
      const errMsg = err.response?.data?.error || err.message || '❌ Gagal memperbarui data.';

      if (errMsg === 'NIK sudah digunakan oleh warga lain') {
        setFieldErrors(prev => ({ ...prev, nik: errMsg }));
        setToast({
          show: true,
          message: errMsg,
          isError: true,
        });
      } else {
        setToast({
          show: true,
          message: errMsg,
          isError: true,
        });
      }
    }
  };

  const inputClass = (field) => `form-control${fieldErrors[field] ? ' is-invalid' : ''}`;

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-user-edit me-2"></i>
            {isViewMode && !isEditable ? 'Detail Warga' : 'Edit Warga'}
          </h1>
          <div className="d-flex gap-2">
            {!isEditable && (
              <button className="btn btn-primary" onClick={() => setIsEditable(true)}>
                <i className="fas fa-edit me-1"></i> Ubah
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/residents')}>
              <i className="fas fa-arrow-left me-1"></i> Kembali
            </button>
          </div>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* Name and NIK */}
              <div className="row">
                <div className="mb-3">
                  <label className="form-label">Nama Lengkap</label>
                  <input name="full_name" className={inputClass('full_name')} value={form.full_name} onChange={handleChange} disabled={!isEditable} />
                  {fieldErrors.full_name && <div className="invalid-feedback">{fieldErrors.full_name}</div>}
                </div>
                <div className="mb-3">
                  <label>NIK</label>
                  <input name="nik" className={inputClass('nik')} value={form.nik} onChange={handleChange} disabled={!isEditable} />
                  {fieldErrors.nik && <div className="invalid-feedback">{fieldErrors.nik}</div>}
                </div>
              </div>

              {/* KK and Alamat */}
              <div className="mb-3">
                <label>Nomor KK</label>
                <select name="kk_number" className={inputClass('kk_number')} value={form.kk_number} onChange={handleChange} disabled={!isEditable}>
                  <option value="">-- Pilih No. KK --</option>
                  {households.map(h => (
                    <option key={h.kk_number} value={h.kk_number}>
                      {h.kk_number} - {h.full_address}
                    </option>
                  ))}
                </select>
                {fieldErrors.kk_number && <div className="invalid-feedback">{fieldErrors.kk_number}</div>}
              </div>

              <div className="mb-3">
                <label>Alamat (otomatis dari KK)</label>
                <input className="form-control" value={households.find(h => h.kk_number === form.kk_number)?.full_address || ''} disabled />
              </div>

              {/* Gender, Birthplace, Birthdate */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Jenis Kelamin</label>
                  <select name="gender" className={inputClass('gender')} value={form.gender} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    <option value="Laki - Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  {fieldErrors.gender && <div className="invalid-feedback">{fieldErrors.gender}</div>}
                </div>
                <div className="col-md-3 mb-3">
                  <label>Tempat Lahir</label>
                  <input name="birthplace" className={inputClass('birthplace')} value={form.birthplace} onChange={handleChange} disabled={!isEditable} />
                  {fieldErrors.birthplace && <div className="invalid-feedback">{fieldErrors.birthplace}</div>}
                </div>
                <div className="col-md-3 mb-3">
                  <label>Tanggal Lahir</label>
                  <input type="date" name="birthdate" className={inputClass('birthdate')} value={form.birthdate} onChange={handleChange} disabled={!isEditable} />
                  {fieldErrors.birthdate && <div className="invalid-feedback">{fieldErrors.birthdate}</div>}
                </div>
              </div>

              {/* Age, Blood Type, Religion, Marital */}
              <div className="row">
                <div className="col-md-2 mb-3">
                  <label>Umur</label>
                  <input name="age" className="form-control" value={form.age} disabled />
                </div>
                <div className="col-md-2 mb-3">
                  <label>Golongan Darah</label>
                  <select name="blood_type" className="form-control" value={form.blood_type} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    {['A', 'B', 'O'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label>Agama</label>
                  <select name="religion" className={inputClass('religion')} value={form.religion} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    {['Islam', 'Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {fieldErrors.religion && <div className="invalid-feedback">{fieldErrors.religion}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label>Status Pernikahan</label>
                  <select name="marital_status" className={inputClass('marital_status')} value={form.marital_status} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    {['Belum Menikah', 'Menikah', 'Janda', 'Duda'].map(ms => <option key={ms} value={ms}>{ms}</option>)}
                  </select>
                  {fieldErrors.marital_status && <div className="invalid-feedback">{fieldErrors.marital_status}</div>}
                </div>
              </div>

              {/* Relationship, Education, Occupation */}
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label>Status dalam KK</label>
                  <select name="relationship" className={inputClass('relationship')} value={form.relationship} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    {['Kepala Keluarga', 'Istri', 'Anak'].map(rel => <option key={rel} value={rel}>{rel}</option>)}
                  </select>
                  {fieldErrors.relationship && <div className="invalid-feedback">{fieldErrors.relationship}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label>Pendidikan Terakhir</label>
                  <select
                  name="education"
                  className={inputClass('education')}
                  value={form.education}
                  onChange={handleChange}
                  disabled={!isEditable}
                >
                  <option value="">-- Pilih --</option>
                  <option value="tidak">Tidak/Belum Sekolah</option>
                  <option value="sd">SD/Setara SD</option>
                  <option value="sltp">SLTP/Setara SLTP</option>
                  <option value="sma">SLTA/Setara SLTA</option>
                  <option value="d3">D-III</option>
                  <option value="s1">D-IV / S1</option>
                  <option value="s2">S2</option>
                  <option value="s3">S3</option>
                </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label>Pekerjaan</label>
                  <select name="occupation" className="form-control" value={form.occupation} onChange={handleChange} disabled={!isEditable}>
                    <option value="">-- Pilih --</option>
                    {occupations.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Citizenship & Status */}
              <div className="mb-3">
                <label>Kewarganegaraan</label>
                <select name="citizenship" className={inputClass('citizenship')} value={form.citizenship} onChange={handleChange} disabled={!isEditable}>
                  <option value="">-- Pilih --</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {fieldErrors.citizenship && <div className="invalid-feedback">{fieldErrors.citizenship}</div>}
              </div>

              <div className="mb-3">
                <label>Status NIK</label>
                <select
                  name="status"
                  className={inputClass('status')}
                  value={form.status}
                  onChange={handleChange}
                  disabled={!isEditable || isStatusLocked}
                >
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif - meninggal">Tidak Aktif - Meninggal</option>
                  <option value="tidak aktif - pindah">Tidak Aktif - Pindah</option>
                  <option value="tidak aktif - lainnya">Tidak Aktif - Lainnya</option>
                  <option value="tidak aktif - domisili diluar">Tidak Aktif - Domisili Diluar</option>
                </select>
                {fieldErrors.status && <div className="invalid-feedback">{fieldErrors.status}</div>}
              </div>

              {form.status === 'tidak aktif - lainnya' && !isStatusLocked && (
                <div className="mb-3">
                  <label>Alasan Tidak Aktif</label>
                  <input
                    name="status_remarks"
                    className={inputClass('status_remarks')}
                    value={form.status_remarks}
                    onChange={handleChange}
                    disabled={!isEditable}
                  />
                  {fieldErrors.status_remarks && <div className="invalid-feedback">{fieldErrors.status_remarks}</div>}
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