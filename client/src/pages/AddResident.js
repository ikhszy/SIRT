import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import countries from '../utils/countries';
import occupations from '../utils/occupations';

export default function AddResident() {
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
    relationship_remarks: '',
    education: '',
    occupation: '',
    citizenship: 'Indonesia',
    address_id: '',
    address_text: '',
    status: '',
  });

  const [kkSearch, setKkSearch] = useState('');
  const [showKkDropdown, setShowKkDropdown] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [selectedKKOwnership, setSelectedKKOwnership] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const navigate = useNavigate();
  

  // New: Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, householdData] = await Promise.all([
          api.get('/address'),
          api.get('/households'),
        ]);
        setAddresses(res.data);
        setHouseholds(householdData.data);
      } catch (err) {
        console.error('Failed to fetch addresses or households:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (form.birthdate) {
      const today = new Date();
      const birthDate = new Date(form.birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setForm((prev) => ({ ...prev, age }));
    }
  }, [form.birthdate]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error on user input for that field
    setFieldErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  };

  const filteredHouseholds = households.filter(h =>
    `${h.kk_number} - ${h.full_address}`.toLowerCase().includes(kkSearch.toLowerCase())
  );

  const handleKKChange = (kkNumber) => {
    const household = households.find((h) => h.kk_number === kkNumber);
    if (household) {
      const address = addresses.find((a) => a.id === household.address_id);
      setForm((prev) => ({
        ...prev,
        kk_number: household.kk_number,
        address_id: household.address_id,
        address_text: address ? address.full_address : '',
        status: household.status_kepemilikan_rumah === 'pemilik belum pindah'
          ? 'tidak aktif - domisili diluar'
          : prev.status,
      }));
      setSelectedKKOwnership(household.status_kepemilikan_rumah);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'full_name',
      'nik',
      'kk_number',
      'gender',
      'birthplace',
      'birthdate',
      'religion',
      'marital_status',
      'relationship',
      'citizenship',
      'address_id',
      'status',
    ];

    const newFieldErrors = {};

    requiredFields.forEach((field) => {
      const value = form[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newFieldErrors[field] = 'Harus diisi';
      }
    });

    if (
      form.status === 'tidak aktif - lainnya' &&
      (!form.status_remarks || form.status_remarks.trim() === '')
    ) {
      newFieldErrors.status_remarks = 'Harus diisi untuk status lainnya';
    };

    if (
      form.relationship === 'Lainnya' &&
      (!form.relationship_remarks || form.relationship_remarks.trim() === '')
    ) {
      newFieldErrors.relationship_remarks = 'Harus diisi untuk status Lainnya';
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setToast({
        show: true,
        message: 'Harap isi semua bagian yang wajib diisi!',
        isError: true,
      });
      return;
    }

    // New: Check if NIK already exists
    try {
      const checkNikRes = await api.get(`/residents/check-nik?nik=${encodeURIComponent(form.nik)}`);
      if (checkNikRes.data.exists) {
        setFieldErrors((prev) => ({ ...prev, nik: 'NIK sudah digunakan' }));
        setToast({
          show: true,
          message: 'NIK sudah digunakan, periksa kembali.',
          isError: true,
        });
        return;
      }
    } catch (err) {
      console.error('Error checking NIK:', err);
      setToast({
        show: true,
        message: 'Gagal memeriksa NIK, coba lagi nanti.',
        isError: true,
      });
      return;
    }

    // Proceed to create resident if no duplicate
    try {
      const payload = {
      ...form,
      relationship:
        form.relationship === 'Lainnya'
          ? `Lainnya - ${form.relationship_remarks}`
          : form.relationship,
    };

    await api.post('/residents', payload);
      setToast({
        show: true,
        message: 'Data Warga berhasil ditambahkan!',
        isError: false,
      });
      setTimeout(() => navigate('/residents'), 2000);
    } catch (err) {
      // FIX HERE: Get backend error message from err.response.data.error (your backend uses "error" key)
      const errMsg =
        err.response?.data?.error ||  // <-- use this, because your backend sends { error: "message" }
        err.response?.data?.message ||  // fallback if you ever use 'message' key
        err.message ||
        'Gagal menambahkan warga karena kesalahan tidak diketahui';

      setToast({
        show: true,
        message: errMsg,
        isError: true,
      });

      // Highlight NIK error field if error mentions NIK uniqueness
      if (errMsg.toLowerCase().includes('nik sudah digunakan')) {
        setFieldErrors((prev) => ({ ...prev, nik: 'NIK sudah digunakan' }));
      }
    }
  };

  // Helper to add error class for invalid fields
  const inputClass = (field) =>
    fieldErrors[field] ? 'form-control is-invalid' : 'form-control';

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-user-plus me-2"></i> Tambah Warga
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/residents')}
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name, NIK */}
              <div className="row">
                <div className="mb-3">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    name="full_name"
                    className={inputClass('full_name')}
                    value={form.full_name}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {fieldErrors.full_name && (
                    <div className="invalid-feedback">{fieldErrors.full_name}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">NIK</label>
                  <input
                    name="nik"
                    className={inputClass('nik')}
                    value={form.nik}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {fieldErrors.nik && (
                    <div className="invalid-feedback">{fieldErrors.nik}</div>
                  )}
                </div>
              </div>

              {/* KK Number */}
              <div className="mb-3">
                <label className="form-label">Nomor KK</label>
                <input
                  type="text"
                  className={inputClass('kk_number')}
                  value={kkSearch}
                  onChange={(e) => {
                    setKkSearch(e.target.value);
                    setShowKkDropdown(true);
                  }}
                  onFocus={() => setShowKkDropdown(true)}
                  placeholder="Cari atau pilih Nomor KK..."
                  autoComplete="off"
                />
                {fieldErrors.kk_number && (
                  <div className="invalid-feedback">{fieldErrors.kk_number}</div>
                )}
                {showKkDropdown && (
                  <ul
                    className="list-group position-absolute w-100 shadow-sm"
                    style={{ zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}
                  >
                    {filteredHouseholds.length === 0 ? (
                      <li className="list-group-item text-muted">Tidak ditemukan</li>
                    ) : (
                      filteredHouseholds.map((h) => (
                        <li
                          key={h.kk_number}
                          className="list-group-item list-group-item-action"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, kk_number: h.kk_number, address_id: h.address_id }));
                            handleKKChange(h.kk_number);
                            setKkSearch(`${h.kk_number}`);
                            setShowKkDropdown(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {h.kk_number}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Alamat (otomatis dari KK)</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.address_text}
                  disabled
                />
              </div>

              {/* Gender, Birthplace, Birthdate */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    name="gender"
                    className={inputClass('gender')}
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Laki - Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  {fieldErrors.gender && (
                    <div className="invalid-feedback">{fieldErrors.gender}</div>
                  )}
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Tempat Lahir</label>
                  <input
                    name="birthplace"
                    className={inputClass('birthplace')}
                    value={form.birthplace}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {fieldErrors.birthplace && (
                    <div className="invalid-feedback">{fieldErrors.birthplace}</div>
                  )}
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthdate"
                    className={inputClass('birthdate')}
                    value={form.birthdate}
                    onChange={handleChange}
                  />
                  {fieldErrors.birthdate && (
                    <div className="invalid-feedback">{fieldErrors.birthdate}</div>
                  )}
                </div>
              </div>

              {/* Age, Blood Type, Religion, Marital Status */}
              <div className="row">
                <div className="col-md-2 mb-3">
                  <label className="form-label">Umur</label>
                  <input name="age" className="form-control" value={form.age} disabled />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Golongan Darah</label>
                  <select
                    name="blood_type"
                    className={inputClass('blood_type')}
                    value={form.blood_type}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    {['A', 'B', 'O'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {/* Blood type is optional, so no error here */}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Agama</label>
                  <select
                    name="religion"
                    className={inputClass('religion')}
                    value={form.religion}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    {['Islam', 'Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(
                      (religion) => (
                        <option key={religion} value={religion}>
                          {religion}
                        </option>
                      )
                    )}
                  </select>
                  {fieldErrors.religion && (
                    <div className="invalid-feedback">{fieldErrors.religion}</div>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Status Pernikahan</label>
                  <select
                    name="marital_status"
                    className={inputClass('marital_status')}
                    value={form.marital_status}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    {['Belum Menikah', 'Menikah', 'Janda', 'Duda'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.marital_status && (
                    <div className="invalid-feedback">{fieldErrors.marital_status}</div>
                  )}
                </div>
              </div>

              {/* Relationship, Education, Occupation */}
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Status dalam KK</label>
                  <select
                    name="relationship"
                    className={inputClass('relationship')}
                    value={form.relationship}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    {['Kepala Keluarga', 'Istri', 'Anak', 'Lainnya'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.relationship && (
                    <div className="invalid-feedback">{fieldErrors.relationship}</div>
                  )}
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label">Pendidikan Terakhir</label>
                  <select
                  name="education"
                  className={inputClass('education')}
                  value={form.education}
                  onChange={handleChange}
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
                  {/* Education optional? No error */}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Pekerjaan</label>
                  <select
                    name="occupation"
                    className={inputClass('occupation')}
                    value={form.occupation}
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih --</option>
                    {occupations.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </select>
                  {/* Occupation optional? No error */}
                </div>
              </div>

              {/* Citizenship */}
              <div className="mb-3">
                <label className="form-label">Kewarganegaraan</label>
                <select
                  name="citizenship"
                  className={inputClass('citizenship')}
                  value={form.citizenship}
                  onChange={handleChange}
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {fieldErrors.citizenship && (
                  <div className="invalid-feedback">{fieldErrors.citizenship}</div>
                )}
              </div>
              
              {/* Status */}
              <div className="mb-3">
                <label className="form-label">Status NIK</label>
                <select
                  name="status"
                  className={inputClass('status')}
                  value={form.status}
                  onChange={handleChange}
                  disabled={selectedKKOwnership === 'pemilik belum pindah'}
                >
                  <option value="">-- Pilih --</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif - meninggal">Tidak Aktif - Meninggal</option>
                  <option value="tidak aktif - pindah">Tidak Aktif - Pindah</option>
                  <option value="tidak aktif - lainnya">Tidak Aktif - Lainnya</option>
                  <option value="tidak aktif - domisili diluar">Tidak Aktif - Domisili Diluar</option>
                </select>
              </div>
              {/* show status remarks on lainnya option selected */}
              {form.status === 'tidak aktif - lainnya' && selectedKKOwnership !== 'pemilik belum pindah' && (
                <div className="mb-3">
                  <label className="form-label">Alasan Tidak Aktif</label>
                  <input
                    name="status_remarks"
                    className={inputClass('status_remarks')}
                    value={form.status_remarks}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {fieldErrors.status_remarks && (
                    <div className="invalid-feedback">{fieldErrors.status_remarks}</div>
                  )}
                </div>
              )}

              {form.relationship === 'Lainnya' && (
                  <div className="col mb-3">
                    <label className="form-label">Keterangan Status dalam KK - Lainnya</label>
                    <input
                      name="relationship_remarks"
                      className={inputClass('relationship_remarks')}
                      value={form.relationship_remarks}
                      onChange={handleChange}
                      autoComplete="off"
                    />
                    {fieldErrors.relationship_remarks && (
                      <div className="invalid-feedback">{fieldErrors.relationship_remarks}</div>
                    )}
                  </div>
                )}

              <button type="submit" className="btn btn-primary">
                Buat Data Warga
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
