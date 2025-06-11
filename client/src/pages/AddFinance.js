import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function AddTransaction() {
  const [type, setType] = useState('income');
  const [residents, setResidents] = useState([]);
  const [residentId, setResidentId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/residents').then(res => setResidents(res.data));
  }, []);

  useEffect(() => {
    // Auto-fill remarks if type is income and resident is selected
    if (type === 'income' && residentId) {
      const resident = residents.find(r => r.id === parseInt(residentId));
      if (resident) {
        setRemarks(`Iuran - ${resident.full_name}`);
      }
    }
  }, [type, residentId, residents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionDate || !remarks || !amount) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      transactionDate,
      remarks,
      transactionAmount: parseFloat(amount),
      status: 'A',
    };

    if (type === 'income') {
      if (residentId) payload.residentId = parseInt(residentId);
      await api.post('/finance/income', payload);
    } else {
      await api.post('/finance/expense', payload);
    }

    navigate('/finance');
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-plus me-2"></i> Tambah Transaksi
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Type Selector */}
              <div className="mb-3">
                <label className="form-label">Jenis Transaksi</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setResidentId('');
                    setRemarks('');
                  }}
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>

              {/* Resident Select (only for income) */}
              {type === 'income' && (
                <div className="mb-3">
                  <label className="form-label">Warga (Opsional)</label>
                  <select
                    className="form-select"
                    value={residentId}
                    onChange={(e) => setResidentId(e.target.value)}
                  >
                    <option value="">-- Pilih Warga --</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name} ({r.nik})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Keterangan</label>
                <input
                  type="text"
                  className="form-control"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Jumlah (Rp)</label>
                <input
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Tanggal Transaksi</label>
                <input
                  type="date"
                  className="form-control"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Simpan
              </button>
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigate('/finance')}
              >
                Batal
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
