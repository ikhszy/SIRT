import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [households, setHouseholds] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [residents, setResidents] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

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

  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleExportAddressPDF = async () => {
    const doc = new jsPDF('p', 'pt', 'A4');

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fullAddress = `${form.full_address} RT ${commonSettings?.rt} RW ${commonSettings?.rw} Kelurahan ${commonSettings?.kelurahan}, Kecamatan ${commonSettings?.kecamatan}, ${commonSettings?.kota} ${commonSettings?.kodepos}`;

    // 🔹 Title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Laporan Warga per Alamat`, 40, 40);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Per ${today}`, 40, 55);

    // 🔹 Address
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Alamat:`, 40, 75);

    doc.setFont(undefined, 'normal');
    doc.text(fullAddress, 40, 90, { maxWidth: 500 });

    let startY = 120;

    const statusOrder = [
      "Pemilik",
      "Pemilik belum pindah",
      "Numpang Alamat",
      "Sewa"
    ];

    const sortedHouseholds = [...households].sort((a, b) => {
      return (
        statusOrder.indexOf(a.status_kepemilikan_rumah) -
        statusOrder.indexOf(b.status_kepemilikan_rumah)
      );
    });

    // 🔥 Loop each KK
    for (const household of sortedHouseholds) {
      // Fetch residents per KK (important!)
      let members = [];
      try {
        const res = await api.get(`/residents?household_id=${household.kk_number}`);
        members = res.data;
      } catch (err) {
        console.error('Failed fetch residents for KK', household.kk_number);
      }

      if (members.length === 0) continue;

      const relationshipOrder = [
        "Kepala Keluarga",
        "Istri",
        "Anak",
        "Lainnya"
      ];

      members.sort((a, b) =>
        relationshipOrder.indexOf(a.relationship) -
        relationshipOrder.indexOf(b.relationship)
      );

      // 🔹 Add top spacing BEFORE each KK (except first)
      if (startY > 120) {
        startY += 10;
      }

      // 🔹 KK Header
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text(`No. KK: ${household.kk_number}`, 40, startY);

      doc.setFont(undefined, 'normal');
      doc.text(`Status: ${household.status_kepemilikan_rumah}`, 40, startY + 12);

      startY += 20; // ✅ more breathing room before table

      // 🔹 Table
      doc.autoTable({
        startY,
        head: [["Nama", "Hubungan", "L/P", "Usia"]],
        body: members.map(m => [
          m.full_name,
          m.relationship || '-',
          m.gender === "Laki - Laki" ? "L" : "P",
          calculateAge(m.birthdate)
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 4 // 🔥 increase padding (IMPORTANT)
        },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255
        },
        margin: { left: 40 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // 🔹 After table
      startY = doc.lastAutoTable.finalY + 8;

      // 🔹 Total
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text(`Jumlah anggota: ${members.length} orang`, 40, startY);

      // 🔹 Add divider line HERE
      doc.setDrawColor(200);
      doc.line(40, startY + 5, 550, startY + 5);

      // 🔹 BIG spacing before next KK
      startY += 15;

      // 🔥 Page break handling
      if (startY > 750) {
        doc.addPage();
        startY = 40;
      }
    }

    const safeAddress = form.full_address
    .replace(/[\\/:*?"<>|]/g, '') // clean invalid chars
    .trim()
    .slice(0, 10);

  doc.save(`Detail-${safeAddress}.pdf`);
  };

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

  useEffect(() => {
    if (!id) return;

    const fetchHouseholds = async () => {
      try {
        const res = await api.get(`/households?address_id=${id}`);
        setHouseholds(res.data);
      } catch (err) {
        console.error('Failed to load households', err);
      }
    };

    fetchHouseholds();
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
  const handleHouseholdClick = async (household) => {
    setSelectedHousehold(household);
    setLoadingResidents(true);

    try {
      const res = await api.get(`/residents?household_id=${household.kk_number}`);
      setResidents(res.data);
    } catch (err) {
      console.error('Failed to load residents', err);
      setResidents([]);
    } finally {
      setLoadingResidents(false);
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
          <button
            className="btn btn-outline-success ms-2"
            onClick={handleExportAddressPDF}
          >
            <i className="fas fa-file-pdf me-1"></i> Export Alamat
          </button>
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
        <div className="card shadow mb-4">
          <div className="card-header">
            <h5 className="mb-0">Daftar Kartu Keluarga</h5>
          </div>
          <div className="card-body">
            {households.length === 0 ? (
              <p className="text-muted">Tidak ada data KK untuk alamat ini.</p>
            ) : (
              <div className="list-group">
                {households.map((h) => (
                  <button
                    key={h.id}
                    className={`list-group-item list-group-item-action ${
                      selectedHousehold?.id === h.id ? 'active' : ''
                    }`}
                    onClick={() => handleHouseholdClick(h)}
                  >
                    <strong>{h.kk_number}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedHousehold && (
          <div className="card shadow mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                Anggota Keluarga - KK {selectedHousehold.kk_number} ({selectedHousehold.status_kepemilikan_rumah})
              </h5>
            </div>
            <div className="card-body">
              {residents.length === 0 ? (
                <p className="text-muted">Tidak ada data anggota keluarga.</p>
              ) : (
                <ul className="list-group">
                  {residents.map((r) => (
                    <li 
                    key={r.id}
                    className="list-group-item"
                    onClick={() => navigate(`/residents/view/${r.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                      <strong>{r.full_name} </strong>
                      <div className="text-muted small">
                      NIK: {r.nik}
                      <br></br>
                      Status dalam KK: {r.relationship} 
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
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
