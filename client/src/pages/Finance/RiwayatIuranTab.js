import React, { useState, useEffect } from 'react';
import api from '../../api'; // adjust path if needed

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export default function RiwayatIuranTab() {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/address'); // change to your actual endpoint
        setAddresses(res.data);
      } catch (e) {
        console.error('Failed to load addresses', e);
      }
    };
    fetchAddresses();
  }, []);

  const handleSearch = async () => {
    if (!selectedMonth || !selectedYear) {
      setError('Silakan pilih bulan dan tahun terlebih dahulu.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.get('/finance/iuran/status', {
        params: {
          month: selectedMonth.toString().padStart(2, '0'),
          year: selectedYear,
          // optionally include address filter if needed, e.g.
          addressId: selectedAddress || undefined,
        },
      });
      setData(res.data);
      setTotalItems(res.data.length);
    } catch (e) {
      setError('Gagal mengambil data iuran.');
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Trigger search again for new page
    handleSearch();
  };

  return (
    <div>
      <div className="row g-3 mb-3">
        {/* Address dropdown */}
        <div className="col-md-4">
          <label htmlFor="address" className="form-label">Alamat</label>
          <select
            id="address"
            className="form-select"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
          >
            <option value="">-- Pilih Alamat --</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.full_address}
              </option>
            ))}
          </select>
        </div>

        {/* Month dropdown */}
        <div className="col-md-3">
          <label htmlFor="month" className="form-label">Bulan</label>
          <select
            id="month"
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">-- Pilih Bulan --</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year dropdown */}
        <div className="col-md-3">
          <label htmlFor="year" className="form-label">Tahun</label>
          <select
            id="year"
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">-- Pilih Tahun --</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={() => {
            setCurrentPage(1); // reset page to 1 on new search
            handleSearch();
          }}>
            Cari
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && <div>Loading...</div>}

      {!loading && data.length === 0 && !error && (
        <div className="alert alert-info">
          Silakan pilih filter dan klik Cari untuk melihat data iuran.
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-primary">
                <tr>
                  <th>Alamat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                  <tr key={index}>
                    <td>{item.address}</td>
                    <td>
                      {item.status === 'paid' ? (
                        <span className="badge bg-success">Lunas</span>
                      ) : (
                        <span className="badge bg-danger">Belum Bayar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
