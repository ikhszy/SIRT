import React, { useEffect, useState } from 'react';
import {
  Table, Button, Pagination, Form, Row, Col, Card
} from 'react-bootstrap';
import api from '../../api';
import AdminLayout from '../../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';

export default function IntroLetterPage() {
  const [letters, setLetters] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line
  }, [page]);

  const fetchLetters = async () => {
    try {
      const res = await api.get(`/surat`, {
        params: {
          page,
          limit: 10,
          search,
          status,
          startDate,
          endDate
        }
      });
      setLetters(res.data);
      setHasMore(res.data.length === 10);
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
                  <th>Aksi</th>
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
                        <Button size="sm" onClick={() => navigate(`/surat/${letter.id}`)}>
                          Lihat
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

            {/* Pagination */}
            <div className="d-flex justify-content-end">
              <Pagination>
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                <Pagination.Item active>{page}</Pagination.Item>
                <Pagination.Next disabled={!hasMore} onClick={() => setPage(p => p + 1)} />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
