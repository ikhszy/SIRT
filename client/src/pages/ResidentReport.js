import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Card, Form, Row, Col, Table, Button, InputGroup, FormControl
} from 'react-bootstrap';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

// Utility
const calculateAge = (birthdate) => {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// Constants
const defaultFilters = {
  full_name: '', nik: '', kk_number: '', gender: '', birthplace: '',
  education: '', occupation: '', full_address: '',
  min_age: '', max_age: '', min_birthdate: '', max_birthdate: '',
  blood_type: [], marital_status: [], relationship: [], citizenship: [],
};

const createOptions = (values) => values.map(v => ({ value: v, label: v }));

const bloodTypeOptions = createOptions(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const maritalOptions = createOptions(['Belum Menikah', 'Menikah', 'Janda', 'Duda']);
const relationshipOptions = createOptions(['Kepala Keluarga', 'Istri', 'Anak']);
const citizenshipOptions = createOptions(['Indonesia', 'Malaysia', 'Singapore', 'USA', 'Other']);

const useQuery = () => new URLSearchParams(useLocation().search);

// Reusable MultiSelect component
const MultiSelect = ({ options, value, onChange, placeholder }) => (
  <Select
    options={options}
    isMulti
    placeholder={placeholder}
    value={options.filter(opt => value.includes(opt.value))}
    onChange={(selected) => onChange(selected ? selected.map(s => s.value) : [])}
    classNamePrefix="select"
    isClearable
  />
);

// Main Component
export default function ResidentReport() {
  const [residents, setResidents] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const query = useQuery();

  // Load filters from URL
  useEffect(() => {
    const parsed = { ...defaultFilters };
    for (let key of query.keys()) {
      parsed[key] = Array.isArray(defaultFilters[key])
        ? query.get(key)?.split(',') || []
        : query.get(key) || '';
    }
    setFilters(parsed);
  }, []);

  // Fetch residents
  useEffect(() => {
    api.get('/residents').then((res) => {
      const enriched = res.data.map(r => ({ ...r, age: calculateAge(r.birthdate) }));
      setResidents(enriched);
    });
  }, []);

  // Reset sort on filter change
  useEffect(() => {
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  }, [filters]);

  const multiMatch = (field, values, item) => {
    if (!values?.length) return true;
    return values.includes(String(item[field]).toLowerCase());
  };

  const matchText = (field, value, item) => {
    if (!value) return true;
    return item[field]?.toString().toLowerCase().includes(value.toLowerCase());
  };

  const filteredResidents = residents.filter((r) => {
    const {
      full_name, nik, kk_number, gender, birthplace, education,
      occupation, full_address, min_age, max_age,
      min_birthdate, max_birthdate,
      blood_type, marital_status, relationship, citizenship
    } = filters;

    const age = r.age;
    const birthdate = r.birthdate || '';

    return (
      matchText('full_name', full_name, r) &&
      matchText('nik', nik, r) &&
      matchText('kk_number', kk_number, r) &&
      matchText('gender', gender, r) &&
      matchText('birthplace', birthplace, r) &&
      matchText('education', education, r) &&
      matchText('occupation', occupation, r) &&
      matchText('full_address', full_address, r) &&
      (!min_age || age >= parseInt(min_age)) &&
      (!max_age || age <= parseInt(max_age)) &&
      (!min_birthdate || birthdate >= min_birthdate) &&
      (!max_birthdate || birthdate <= max_birthdate) &&
      multiMatch('blood_type', blood_type, r) &&
      multiMatch('marital_status', marital_status, r) &&
      multiMatch('relationship', relationship, r) &&
      multiMatch('citizenship', citizenship, r)
    );
  });

  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const sortedResidents = [...filteredResidents].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    let valA = a[key] ?? '';
    let valB = b[key] ?? '';
    if (key === 'birthdate') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (key === 'age') {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedResidents = sortedResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(12);
    doc.text("Resident Report", 14, 15);
    const tableColumn = [
      "Nama Lengkap", "NIK", "Nomor KK", "Jenis Kelamin", "Alamat Lengkap",
      "Tempat Lahir", "Tanggal Lahir", "Usia", "Gol. Darah", "Agama",
      "Status Perkawinan", "Hubungan Keluarga", "Pendidikan", "Pekerjaan", "Kewarganegaraan"
    ];
    const tableRows = filteredResidents.map(r => [
      r.full_name, r.nik, r.kk_number, r.gender, r.full_address, r.birthplace,
      r.birthdate, r.age, r.blood_type, r.religion, r.marital_status,
      r.relationship, r.education, r.occupation, r.citizenship
    ]);
    doc.autoTable({
      startY: 20,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
    doc.save(`resident-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleClearFilters = () => setFilters(defaultFilters);

  // ----- JSX Render Below -----
  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <h1 className="h3 text-gray-800"><i className="fas fa-file-alt me-2"></i>Resident Report</h1>
          <div>
            <Button variant="outline-danger" className="me-2" onClick={handleExportPDF}>
              <i className="fas fa-file-pdf me-1" /> Export to PDF
            </Button>
            <Button variant="outline-primary" onClick={() => window.print()}>
              <i className="fas fa-print me-1" /> Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-3 no-print">
          <Card.Body>
            <Row className="g-3">
              {['Nama Lengkap', 'NIK', 'Nomor KK', 'Jenis Kelamin', 'Tempat Lahir', 'Pendidikan', 'Pekerjaan', 'Alamat Lengkap'].map((label, index) => {
                const keys = ['full_name', 'nik', 'kk_number', 'gender', 'birthplace', 'education', 'occupation', 'full_address'];
                return (
                  <Col md={3} key={keys[index]}>
                    <FormControl
                      size="sm"
                      placeholder={label}
                      value={filters[keys[index]]}
                      onChange={e => setFilters(prev => ({ ...prev, [keys[index]]: e.target.value }))}
                    />
                  </Col>
                );
              })}

              {/* Age Range */}
              <Col md={3}><InputGroup size="sm">
                <FormControl placeholder="Usia Minimum" type="number" value={filters.min_age} onChange={e => setFilters(prev => ({ ...prev, min_age: e.target.value }))} />
                <FormControl placeholder="Usia Maksimum" type="number" value={filters.max_age} onChange={e => setFilters(prev => ({ ...prev, max_age: e.target.value }))} />
              </InputGroup></Col>

              <Col md={3}><InputGroup size="sm">
                <FormControl type="date" value={filters.min_birthdate} onChange={e => setFilters(prev => ({ ...prev, min_birthdate: e.target.value }))} />
                <FormControl type="date" value={filters.max_birthdate} onChange={e => setFilters(prev => ({ ...prev, max_birthdate: e.target.value }))} />
              </InputGroup></Col>

              <Col md={3}><MultiSelect options={bloodTypeOptions} value={filters.blood_type} onChange={val => setFilters(prev => ({ ...prev, blood_type: val }))} placeholder="Gol. Darah" /></Col>
              <Col md={3}><MultiSelect options={maritalOptions} value={filters.marital_status} onChange={val => setFilters(prev => ({ ...prev, marital_status: val }))} placeholder="Status Perkawinan" /></Col>
              <Col md={3}><MultiSelect options={relationshipOptions} value={filters.relationship} onChange={val => setFilters(prev => ({ ...prev, relationship: val }))} placeholder="Hubungan Keluarga" /></Col>
              <Col md={3}><MultiSelect options={citizenshipOptions} value={filters.citizenship} onChange={val => setFilters(prev => ({ ...prev, citizenship: val }))} placeholder="Kewarganegaraan" /></Col>
            </Row>
            <div className="mt-3 d-flex justify-content-end">
              <Button size="sm" variant="secondary" onClick={handleClearFilters}>Hapus filters</Button>
            </div>
          </Card.Body>
        </Card>
        <Card className="printable-area">
          <Card.Body>
            <Table striped bordered hover responsive size="sm" className="table-sm">
              <thead>
                <tr>
                  {[
                    { key: 'full_name', label: 'Nama Lengkap' },
                    { key: 'nik', label: 'NIK' },
                    { key: 'kk_number', label: 'Nomor KK' },
                    { key: 'gender', label: 'Jenis Kelamin' },
                    { key: 'birthplace', label: 'Tempat Lahir' },
                    { key: 'birthdate', label: 'Tanggal Lahir' },
                    { key: 'age', label: 'Usia' },
                    { key: 'blood_type', label: 'Gol. Darah' },
                    { key: 'religion', label: 'Agama' },
                    { key: 'marital_status', label: 'Status Perkawinan' },
                    { key: 'relationship', label: 'Hubungan Keluarga' },
                    { key: 'education', label: 'Pendidikan' },
                    { key: 'occupation', label: 'Pekerjaan' },
                    { key: 'citizenship', label: 'Kewarganegaraan' },
                    { key: 'full_address', label: 'Alamat Lengkap' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{ cursor: 'pointer' }}
                    >
                      {label}{" "}
                      {sortConfig.key === key && (
                        <i className={`fas fa-sort-${sortConfig.direction}`} />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResidents.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="text-center">No data found</td>
                  </tr>
                ) : (
                  paginatedResidents.map((resident, i) => (
                    <tr key={i}>
                      <td>{resident.full_name}</td>
                      <td>{resident.nik}</td>
                      <td>{resident.kk_number}</td>
                      <td>{resident.gender}</td>
                      <td>{resident.birthplace}</td>
                      <td>{resident.birthdate}</td>
                      <td>{resident.age}</td>
                      <td>{resident.blood_type}</td>
                      <td>{resident.religion}</td>
                      <td>{resident.marital_status}</td>
                      <td>{resident.relationship}</td>
                      <td>{resident.education}</td>
                      <td>{resident.occupation}</td>
                      <td>{resident.citizenship}</td>
                      <td>{resident.full_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {/* Pagination and Summary */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Group className="d-flex align-items-center gap-2 mb-0">
                <span className="small">Items per page:</span>
                <Form.Select
                  size="sm"
                  value={itemsPerPage}
                  style={{ width: '80px' }}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[5, 10, 25, 50, 100].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="text-muted">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>

              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="me-2"
                >
                  Previous
                </Button>
                <span className="mx-1">Page {currentPage} of {totalPages}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ms-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
