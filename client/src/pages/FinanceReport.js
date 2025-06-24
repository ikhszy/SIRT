import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Card, Button } from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useLocation } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount) => amount.toLocaleString('id-ID');
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID');

const FinanceReport = () => {
  const [data, setData] = useState([]);
  const location = useLocation();
  const defaultFilters = {
  min_transactionDate: '',
  max_transactionDate: '',
  status: '',
  remarks: '',
};

const locationFilters = location.state?.filters;

const [filters, setFilters] = useState(() => {
  if (locationFilters) {
    return {
      min_transactionDate: locationFilters.rentangTanggal?.[0] || '',
      max_transactionDate: locationFilters.rentangTanggal?.[1] || '',
      status: locationFilters.status === 'Pemasukan' ? 'income' :
              locationFilters.status === 'Pengeluaran' ? 'expense' : '',
      remarks: '',
    };
  }
  return defaultFilters;
});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.min_transactionDate) params.append('startDate', filters.min_transactionDate);
      if (filters.max_transactionDate) params.append('endDate', filters.max_transactionDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.remarks) params.append('remarks', filters.remarks);

      const response = await api.get(`/finance/report?${params.toString()}`);
      const json = response.data;

      const sorted = json.sort(
        (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
      );
      setData(sorted);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
      alert('Gagal memuat data keuangan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data;

  const totalIncome = filteredData
    .filter((item) => item.status === 'income')
    .reduce((sum, item) => sum + item.transactionAmount, 0);

  const totalExpense = filteredData
    .filter((item) => item.status === 'expense')
    .reduce((sum, item) => sum + item.transactionAmount, 0);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredData.length]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Laporan Keuangan', 14, 15);

    const tableData = filteredData.map((item) => [
      formatDate(item.transactionDate),
      item.remarks,
      item.status === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Rp ' + formatCurrency(item.transactionAmount),
    ]);

    doc.autoTable({
      head: [['Tanggal', 'Keterangan', 'Status', 'Jumlah']],
      body: tableData,
      startY: 25,
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text(`Total Pemasukan: Rp ${formatCurrency(totalIncome)}`, 14, finalY);
    doc.text(`Total Pengeluaran: Rp ${formatCurrency(totalExpense)}`, 14, finalY + 7);
    doc.text(
      `Saldo Akhir: Rp ${formatCurrency(totalIncome - totalExpense)}`,
      14,
      finalY + 14
    );

    const today = new Date().toISOString().split('T')[0];
    doc.save(`laporan_keuangan_${today}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 text-gray-800">
            <i className="fas fa-balance-scale me-2"></i>Laporan Keuangan
          </h1>
        <Button variant="primary" size="sm" onClick={handleExportPDF}>
          Export PDF
        </Button>
      </div>

      <Card className="shadow mb-4">
        <Card.Body>
          <Form className="mb-4 p-3 border rounded bg-light">
            <Row className="gy-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Rentang Tanggal</Form.Label>
                  <div className="d-flex gap-2">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.min_transactionDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          min_transactionDate: e.target.value,
                        }))
                      }
                    />
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.max_transactionDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          max_transactionDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="">Semua</option>
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Keterangan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Cari keterangan"
                    value={filters.remarks}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="text-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  {isLoading ? 'Memuat...' : 'Terapkan Filter'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="ms-2"
                  onClick={() =>
                    setFilters({
                      min_transactionDate: '',
                      max_transactionDate: '',
                      status: '',
                      remarks: '',
                    })
                  }
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>

          {isLoading && (
            <div className="text-center my-3 text-muted fst-italic">Memuat data...</div>
          )}

          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-primary">
              <tr>
                <th>Tanggal Transaksi</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th className="text-end">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted fst-italic">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.transactionDate)}</td>
                    <td>{item.remarks}</td>
                    <td>{item.status === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                    <td className="text-end fw-semibold">
                      Rp {formatCurrency(item.transactionAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Menampilkan {paginatedData.length} dari {filteredData.length} data
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Sebelumnya
              </Button>
              <span className="align-self-center">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded shadow-sm bg-light">
            <h6 className="mb-3 fw-semibold border-bottom pb-2">Ringkasan</h6>
            <p className="mb-1">
              <span className="fw-semibold text-success">Total Pemasukan:</span>{' '}
              Rp {formatCurrency(totalIncome)}
            </p>
            <p className="mb-1">
              <span className="fw-semibold text-danger">Total Pengeluaran:</span>{' '}
              Rp {formatCurrency(totalExpense)}
            </p>
            <p className="mb-0">
              <span className="fw-semibold">
                Saldo Akhir:{' '}
                <span
                  style={{
                    color: totalIncome - totalExpense >= 0 ? '#198754' : '#dc3545',
                  }}
                >
                  Rp {formatCurrency(totalIncome - totalExpense)}
                </span>
              </span>
            </p>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default FinanceReport;
