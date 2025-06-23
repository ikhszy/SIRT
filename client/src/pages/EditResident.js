// ...imports unchanged...
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import countries from '../utils/countries';
import occupations from '../utils/occupations';
import ModalDialog from '../Components/ModalDialog';

export default function EditResident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view/');
  const [isEditable, setIsEditable] = useState(!isViewMode);
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true
  });

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
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
    const required = ['full_name', 'nik', 'kk_number', 'gender', 'birthplace', 'birthdate', 'religion', 'marital_status', 'relationship', 'citizenship', 'address_id', 'status'];
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
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Harap isi bagian yang wajib!',
        isSuccess: false
      });
      return;
    }

    try {
      await api.put(`/residents/${id}`, form);
      setModal({
        show: true,
        title: 'Berhasil',
        message: '✅ Data warga berhasil diperbarui.',
        isSuccess: true
      });
      setTimeout(() => {
        setModal(prev => ({ ...prev, show: false }));
        navigate('/residents');
      }, 1500);
    } catch (err) {
      console.error('Update error:', err);
      setModal({
        show: true,
        title: 'Gagal',
        message: '❌ Gagal memperbarui data.',
        isSuccess: false
      });
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
          {isViewMode && !isEditable && (
            <button className="btn btn-primary" onClick={() => setIsEditable(true)}>
              <i className="fas fa-edit me-1"></i> Ubah
            </button>
          )}
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            {showSuccess && <div className="alert alert-success">Data berhasil diperbarui!</div>}
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
                    <option value="Laki-Laki">Laki-Laki</option>
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
                  <input name="education" className="form-control" value={form.education} onChange={handleChange} disabled={!isEditable} />
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
                <label>Domisili</label>
                <select name="status" className={inputClass('status')} value={form.status} onChange={handleChange} disabled={!isEditable}>
                  <option value="Lokal">Aktif</option>
                  <option value="tidak aktif - meninggal">Tidak Aktif - Meninggal</option>
                  <option value="tidak aktif - pindah">Tidak Aktif - Pindah</option>
                  <option value="tidak aktif - lainnya">Tidak Aktif - Lainnya</option>
                </select>
                {fieldErrors.status && <div className="invalid-feedback">{fieldErrors.status}</div>}
              </div>

              {form.status === 'tidak aktif - lainnya' && (
                <div className="mb-3">
                  <label>Alasan Tidak Aktif</label>
                  <input
                    name="status_remarks"
                    className={inputClass('status_remarks')}
                    value={form.status_remarks}
                    onChange={handleChange}
                    disabled={!isEditable}
                  />
                  {fieldErrors.status_remarks && (
                    <div className="invalid-feedback">{fieldErrors.status_remarks}</div>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={!isEditable}>Simpan Perubahan</button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/residents')}>Kembali</button>
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
