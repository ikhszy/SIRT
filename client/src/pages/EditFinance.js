import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditTransaction() {
  const { id, type } = useParams(); // expecting route like /finance/edit/income/5
  const navigate = useNavigate();

  const [residents, setResidents] = useState([]);
  const [residentId, setResidentId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  useEffect(() => {
    // Reset form fields when id or type changes
    setRemarks('');
    setAmount('');
    setTransactionDate('');
    setResidentId('');

    // Load residents list
    api.get('/residents')
      .then((res) => setResidents(res.data))
      .catch((err) => {
        console.error('Failed to load residents:', err);
        alert('Gagal memuat data penduduk.');
      });

    if (id && type) {
      // Load transaction data by id and type
      api.get(`/finance/${type}/${id}`)
        .then((res) => {
          const tx = res.data;
          setRemarks(tx.remarks || '');
          setAmount(tx.transactionAmount || '');
          setTransactionDate(tx.transactionDate ? tx.transactionDate.slice(0, 10) : '');
          if (type === 'income') {
            setResidentId(tx.residentId || '');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch transaction:', err);
          alert('Gagal memuat data transaksi.');
        });
    }
  }, [id, type]);

  useEffect(() => {
    // Auto update remarks for income donations when resident changes
    if (type === 'income' && residentId) {
      const r = residents.find((r) => r.id === parseInt(residentId));
      if (r) {
        setRemarks(`Iuran - ${r.full_name}`);
      }
    }
  }, [residentId, type, residents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks || !amount || !transactionDate) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      transactionDate,
      remarks,
      transactionAmount: parseFloat(amount),
      status: 'A',
    };

    if (type === 'income' && residentId) {
      payload.residentId = parseInt(residentId);
    }

    try {
      await api.put(`/finance/${type}/${id}`, payload);
      navigate('/finance');
    } catch (err) {
      console.error('Failed to update transaction:', err);
      alert('Gagal menyimpan perubahan transaksi.');
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-edit me-2"></i> Edit Transaksi
        </h1>

        <div className="card shadow mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Transaction Type (Read-Only) */}
              <div className="mb-3">
                <label className="form-label">Jenis Transaksi</label>
                <input
                  type="text"
                  className="form-control"
                  value={type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  disabled
                />
              </div>

              {/* Resident Select (only for income) */}
              {type === 'income' && (
                <div className="mb-3">
                  <label className="form-label">Donatur (Opsional)</label>
                  <select
                    className="form-select"
                    value={residentId}
                    onChange={(e) => setResidentId(e.target.value)}
                  >
                    <option value="">-- Pilih Donatur --</option>
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
                Simpan Perubahan
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
