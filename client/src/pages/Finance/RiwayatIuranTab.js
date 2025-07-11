import React, { useState, useEffect } from 'react';
import api from '../../api'; // adjust path if needed
import Pagination from '../../Components/Pagination';

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

export default function RiwayatIuranTab({ prefilledFilters }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch available addresses on mount
  useEffect(() => {
    api.get('/address').then(res => setAddresses(res.data)).catch(() => {});
  }, []);

  // Prefill filters on first mount if available
  useEffect(() => {
    if (prefilledFilters && !hasPrefilled) {
      const { bulan, tahun, alamat } = prefilledFilters;

      if (bulan) setSelectedMonth(String(bulan));
      if (tahun) setSelectedYear(String(tahun));
      if (alamat) setSelectedAddress(alamat);

      setHasPrefilled(true);
    }
  }, [prefilledFilters, hasPrefilled]);

  // Trigger search once filters are filled
  useEffect(() => {
    if (hasPrefilled && selectedMonth && selectedYear) {
      handleSearch();
    }
  }, [hasPrefilled, selectedMonth, selectedYear]);

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
          addressId: selectedAddress || undefined,
          status: selectedStatus || undefined,
        },
      });
      setData(res.data);
      setTotalItems(res.data.length);
    } catch {
      setError('Gagal mengambil data iuran.');
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    handleSearch(); // re-fetch data (you could paginate server-side here too)
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="row row-cols-1 row-cols-md-4 g-3">
            <div className="col">
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

            <div className="col">
              <label htmlFor="month" className="form-label">Bulan</label>
              <select
                id="month"
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">-- Pilih Bulan --</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="col">
              <label htmlFor="year" className="form-label">Tahun</label>
              <select
                id="year"
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">-- Pilih Tahun --</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="col">
              <label htmlFor="status" className="form-label">Status Pembayaran</label>
              <select
                id="status"
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">-- Semua --</option>
                <option value="paid">Bayar</option>
                <option value="unpaid">Belum Bayar</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-primary"
              onClick={() => {
                setCurrentPage(1);
                handleSearch();
              }}
            >
              Cari
            </button>
          </div>
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
                {data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => (
                  <tr key={i}>
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
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
