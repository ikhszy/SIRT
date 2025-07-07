import React, { useEffect, useState } from 'react';
import {
  Table, Button, Form, Row, Col, Card
} from 'react-bootstrap';
import api from '../../api';
import AdminLayout from '../../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../Components/Pagination';

export default function IntroLetterPage() {
  const [letters, setLetters] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line
  }, [page, itemsPerPage]);

  const fetchLetters = async () => {
    try {
      const res = await api.get(`/surat`, {
        params: {
          page,
          limit: itemsPerPage,
          search,
          status,
          startDate,
          endDate
        }
      });

      setLetters(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLetters();
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-file-contract me-2"></i> Surat Pengantar
          </h1>
          <Button variant="success" onClick={() => navigate('/surat/tambah')}>
            <i className="fas fa-plus me-1"></i> Tambah Surat
          </Button>
        </div>

        <Form onSubmit={handleFilter} className="mb-3">
          <Row className="g-2">
            <Col md={3}>
              <Form.Control
                placeholder="Cari nama atau NIK"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="Belum Diserahkan">Belum Diserahkan</option>
                <option value="Diserahkan">Diserahkan</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Button type="submit" className="w-100 btn-primary">Filter</Button>
            </Col>
          </Row>
        </Form>

        <Card className="shadow">
          <Card.Body className="table-responsive">
            <Table bordered hover>
              <thead className="table-primary">
                <tr>
                  <th>Nama</th>
                  <th>Nomor</th>
                  <th>Keperluan</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {letters.length > 0 ? (
                  letters.map((letter) => (
                    <tr key={letter.id}>
                      <td>{letter.full_name}</td>
                      <td>{letter.letterNumber}</td>
                      <td>{letter.letterPurpose}</td>
                      <td>{letter.letterStatus}</td>
                      <td>{new Date(letter.date_created).toLocaleDateString('id-ID')}</td>
                      <td>
                        <Button
                            className="btn btn-sm"
                            onClick={() => navigate(`/surat/${letter.id}`)}>
                            <i class="fa-solid fa-eye"></i>
                          </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">Tidak ada data ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                {total === 0
                  ? 'Menampilkan 0 dari 0 data'
                  : `Menampilkan ${(page - 1) * itemsPerPage + 1} - ${Math.min(page * itemsPerPage, total)} dari ${total} data`}
              </div>

              <div className="d-flex align-items-center">
                <label className="me-2">Data per halaman:</label>
                <Form.Select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="form-select-sm"
                  style={{ width: 'auto' }}
                >
                  {[5, 10, 25, 50, 100].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </Form.Select>
              </div>

              <nav>
                <Pagination
                  totalPages={totalPages}
                  currentPage={page}
                  onPageChange={(page) => setPage(page)}
                />
              </nav>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
