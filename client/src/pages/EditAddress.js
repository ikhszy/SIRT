import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import ModalDialog from '../Components/ModalDialog';

export default function EditAddress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('form');
  const [form, setForm] = useState({ full_address: '' });
  const [donationHistory, setDonationHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);

  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    isSuccess: true,
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    setYearOptions(years);
  }, []);

  useEffect(() => {
    api.get(`/address/${id}`)
      .then(res => setForm(res.data))
      .catch(err => {
        console.error('Failed to load address', err);
        showError('Gagal memuat data alamat');
      });
  }, [id]);

  useEffect(() => {
    if (activeTab === 'history') {
      api.get(`/finance/donations/${id}?year=${selectedYear}`)
        .then(res => setDonationHistory(res.data))
        .catch(err => console.error('Failed to fetch donation history', err));
    }
  }, [activeTab, id, selectedYear]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/address/${id}`, form);
      setModal({
        show: true,
        title: 'Sukses',
        message: 'Alamat berhasil diperbarui!',
        isSuccess: true
      });
      setTimeout(() => navigate('/addresses'), 1500);
    } catch (err) {
      console.error(err);
      showError('Gagal memperbarui alamat');
    }
  };

  const showError = (message) => {
    setModal({
      show: true,
      title: 'Error',
      message,
      isSuccess: false
    });
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-edit me-2"></i> Ubah Alamat
        </h1>

        <div className="mb-3">
          <button
            className={`btn btn-outline-primary me-2 ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Data Alamat
          </button>
          <button
            className={`btn btn-outline-success ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Riwayat Iuran
          </button>
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            {activeTab === 'form' ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Alamat</label>
                  <input
                    className="form-control"
                    name="full_address"
                    value={form.full_address}
                    onChange={handleChange}
                    placeholder="Isikan nama jalan saja..."
                    required
                  />
                </div>

                <button className="btn btn-primary" type="submit">
                  <i className="fas fa-save me-1"></i> Simpan Perubahan
                </button>
              </form>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Riwayat Pembayaran Iuran</h5>
                  <select
                    className="form-select"
                    style={{ maxWidth: 160 }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        Tahun {year}
                      </option>
                    ))}
                  </select>
                </div>

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationHistory.map((entry, i) => (
                      <tr key={i}>
                        <td>{entry.month}</td>
                        <td>
                          <span className={`badge 
                            ${entry.status === 'paid' ? 'bg-success' : ''}
                            ${entry.status === 'pending' ? 'bg-warning text-dark' : ''}
                            ${entry.status === 'late' ? 'bg-danger' : ''}
                          `}>
                            {entry.status === 'paid'
                              ? 'Lunas'
                              : entry.status === 'pending'
                              ? 'Belum Bayar'
                              : 'Terlambat'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {donationHistory.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center text-muted">Belum ada data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
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
