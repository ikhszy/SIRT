import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const [incomeRes, expenseRes] = await Promise.all([
      api.get('/finance/income'),
      api.get('/finance/expense'),
    ]);
    const income = incomeRes.data.map(t => ({ ...t, type: 'Income' }));
    const expense = expenseRes.data.map(t => ({ ...t, type: 'Expense' }));
    const merged = [...income, ...expense].sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
    );
    setTransactions(merged);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this transaction?')) return;
    await api.delete(`/finance/${type.toLowerCase()}/${id}`);
    fetchTransactions();
  };

  const filtered = transactions.filter(t =>
    t.remarks.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-wallet me-2"></i> Keuangan Warga
          </h1>
            <div>
              <a href="/finance/add" className="btn btn-success mb-3">
                <i className="fas fa-plus me-1"></i> Tambah Transaksi
              </a>
              <a href="/finance/import" className="btn btn-primary mb-3 ms-2">
                <i className="fas fa-file-import me-1"></i> Import Excel
              </a>
            </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari berdasarkan keterangan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="card shadow">
          <div className="card-body table-responsive">
            <table className="table table-bordered">
              <thead className="table-primary">
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                  <th>Jumlah (Rp)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((t) => (
                    <tr key={`${t.type}-${t.id}`}>
                      <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                      <td>{t.remarks}</td>
                      <td>
                        <span className={`badge ${t.type === 'Income' ? 'bg-success' : 'bg-danger'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td>{Number(t.transactionAmount).toLocaleString('id-ID')}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => navigate(`/finance/edit/${t.type.toLowerCase()}/${t.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(t.id, t.type)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
              </div>

              <div className="d-flex align-items-center">
                <label className="me-2">Data per halaman:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                >
                  {[5, 10, 25, 50].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                      &laquo;
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li
                      key={i + 1}
                      className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
