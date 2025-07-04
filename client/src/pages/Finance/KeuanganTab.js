import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import ModalDialog from '../../Components/ModalDialog';

export default function KeuanganTab() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    id: null,
    type: '',
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const navigate = useNavigate();

  // Debounce search input (wait 300ms after user stops typing)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchTransactions = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleConfirmedDelete = async () => {
    const { id, type } = confirmModal;
    try {
      await api.delete(`/finance/${type.toLowerCase()}/${id}`);
      fetchTransactions();
      setShowSnackbar(true);
    } catch (error) {
      alert('Failed to delete transaction.');
      console.error(error);
    } finally {
      setConfirmModal({ show: false, id: null, type: '' });
    }
  };

  // Filter and paginate
  const filtered = transactions.filter(t =>
    (t.remarks || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Reset page if current page is out of range due to filtering or itemsPerPage change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Cari berdasarkan keterangan..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Search transactions by remarks"
        />
      </div>
      <div className="card shadow">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered mb-0">
            <thead className="table-primary">
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th>Jumlah (Rp)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map(t => (
                  <tr
                    key={`${t.type}-${t.id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/finance/edit/${t.type.toLowerCase()}/${t.id}`)}
                  >
                    <td>{new Date(t.transactionDate).toLocaleDateString('id-ID')}</td>
                    <td>{t.remarks}</td>
                    <td>
                      <span
                        className={`badge ${
                          t.type === 'Income' ? 'bg-success' : 'bg-danger'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td>{Number(t.transactionAmount).toLocaleString('id-ID')}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Prevents row click
                          setConfirmModal({ show: true, id: t.id, type: t.type });
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 px-3">
          <div>
            Menampilkan{' '}
            {totalItems === 0
              ? 0
              : (currentPage - 1) * itemsPerPage + 1}{' '}
            -{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
          </div>

          <div className="d-flex align-items-center">
            <label htmlFor="itemsPerPage" className="me-2 mb-0">
              Data per halaman:
            </label>
            <select
              id="itemsPerPage"
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  aria-label="Previous page"
                >
                  &laquo;
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                    aria-label={`Page ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  aria-label="Next page"
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <ModalDialog
        show={confirmModal.show}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus transaksi ini?"
        onClose={() => setConfirmModal({ show: false, id: null, type: '' })}
        isSuccess={false}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmModal({ show: false, id: null, type: '' })}
            >
              Batal
            </button>
            <button className="btn btn-danger" onClick={handleConfirmedDelete}>
              Hapus
            </button>
          </>
        }
      />

      {showSnackbar && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1060 }}
        >
          <div className="toast show align-items-center text-white bg-success border-0 shadow">
            <div className="d-flex">
              <div className="toast-body">
                Data keuangan berhasil dihapus
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowSnackbar(false)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
