import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort by name ascending
        const sorted = res.data.sort((a, b) => a.full_name.localeCompare(b.full_name));
        setResidents(sorted);
      } catch (err) {
        console.error('Failed to fetch residents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const filteredResidents = residents.filter((res) => {
    const query = searchTerm.toLowerCase();
    return (
      res.full_name?.toLowerCase().includes(query) ||
      res.nik?.toLowerCase().includes(query) ||
      res.gender?.toLowerCase().includes(query) ||
      res.kk_number?.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resident?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/residents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents(residents.filter((r) => r.id !== id));
    } catch (err) {
      alert('Failed to delete');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-users me-2"></i> Data Warga
          </h1>
            <div>
              <a href="/residents/add" className="btn btn-success">
                <i className="fas fa-plus"></i> Tambah Data Warga
              </a>
              <a href="/residents/import" className="btn btn-warning">
                <i className="fas fa-file-import"></i> Import Data Warga
              </a>
            </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari menggunakan Nama, NIK, Jenis Kelamin atau No.KK..."
            value={searchTerm}
            onChange={
              (e) => {setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-primary">
                  <tr>
                    <th>Name</th>
                    <th>NIK</th>
                    <th>Alamat</th>
                    <th>Jenis Kelamin</th>
                    <th>Tempat Lahir</th>
                    <th>Tanggal Lahir</th>
                    <th>No. KK</th>
                    <th>Status Domisili</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">Tidak ada Data Warga</td>
                    </tr>
                  ) : (
                    paginatedResidents.map((res) => (
                      <tr key={res.id} onClick={() => navigate(`/residents/view/${res.id}`)} style={{ cursor: 'pointer' }}>
                        <td>{res.full_name}</td>
                        <td>{res.nik}</td>
                        <td>{res.full_address}</td>
                        <td>{res.gender}</td>
                        <td>{res.birthplace}</td>
                        <td>{res.birthdate}</td>
                        <td>{res.kk_number}</td>
                        <td>{res.status}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(res.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}
                  {' - '}
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
                    {[5, 10, 25, 50, 100].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>&laquo;</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
