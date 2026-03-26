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
  blood_type: [], marital_status: [], relationship: [], citizenship: '',
  status: ''
};

const createOptions = (values) => values.map(v => ({ value: v, label: v }));

const bloodTypeOptions = createOptions(['A', 'B', 'AB', 'O']);
const maritalOptions = createOptions(['Belum Menikah', 'Menikah', 'Janda', 'Duda']);
const relationshipOptions = createOptions(['Kepala Keluarga', 'Istri', 'Anak', 'Lainnya']);
const statusOptions = createOptions(['aktif', 'tidak aktif - meninggal', 'tidak aktif - pindah', 'tidak aktif - lainnya']);

const useQuery = () => new URLSearchParams(useLocation().search);

const MultiSelect = ({ options, value, onChange, placeholder, styles }) => (
  <Select
    styles={styles}
    options={options}
    isMulti
    placeholder={placeholder}
    value={options.filter(opt => value.includes(opt.value))}
    onChange={(selected) => onChange(selected ? selected.map(s => s.value) : [])}
    classNamePrefix="select"
    isClearable
  />
);

export default function ResidentReport() {
  const [residents, setResidents] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const query = useQuery();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getActiveFilters = () => {
    const chips = [];

    const labelMap = {
      full_name: "Nama",
      nik: "NIK",
      kk_number: "No KK",
      gender: "Gender",
      birthplace: "Tempat Lahir",
      education: "Pendidikan",
      occupation: "Pekerjaan",
      full_address: "Alamat",
      min_age: "Usia Min",
      max_age: "Usia Max",
      min_birthdate: "Lahir Dari",
      max_birthdate: "Lahir Sampai",
      status: "Status",
      marital_status: "Perkawinan",
      relationship: "Hubungan",
      citizenship: "Kewarganegaraan",
      blood_type: "Gol. Darah"
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      if (Array.isArray(value)) {
        value.forEach(v => {
          chips.push({
            key,
            value: v,
            label: `${labelMap[key] || key}: ${v}`
          });
        });
      } else {
        chips.push({
          key,
          value,
          label: `${labelMap[key] || key}: ${value}`
        });
      }
    });

    return chips;
  };

  // 🔹 Remove individual filter
  const removeFilter = (key, value) => {
    setFilters(prev => {
      if (Array.isArray(prev[key])) {
        return {
          ...prev,
          [key]: prev[key].filter(v => v !== value)
        };
      }
      return {
        ...prev,
        [key]: ''
      };
    });
  };

  useEffect(() => {
    fetchResidents();
  }, [filters]);

  useEffect(() => {
    const parsed = { ...defaultFilters };
    const ageGroup = query.get("age_group");
    const gender = query.get("gender");
    const marital = query.get("marital_status");

    // Apply age group ranges
    if (ageGroup === "anak") Object.assign(parsed, { min_age: "0", max_age: "12" });
    else if (ageGroup === "remaja") Object.assign(parsed, { min_age: "13", max_age: "17" });
    else if (ageGroup === "dewasa") Object.assign(parsed, { min_age: "18", max_age: "59" });
    else if (ageGroup === "lansia") Object.assign(parsed, { min_age: "60", max_age: "150" });

    // Parse all other query params
    for (let key of query.keys()) {
      if ((key === 'min_age' || key === 'max_age') && ageGroup) continue;
      parsed[key] = Array.isArray(defaultFilters[key])
        ? (query.get(key) ? query.get(key).split(',') : [])
        : query.get(key) || '';
    }

    setFilters(parsed);
    console.log('Parsed Filters:', parsed);

    // Automatically fetch data if filters are set via query
    const autoTrigger = ageGroup || gender || marital;
    if (autoTrigger) {
      const params = new URLSearchParams();
      for (const key in parsed) {
        const value = parsed[key];
        if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(","));
        } else if (value) {
          params.append(key, value);
        }
      }

      api.get(`/residents?${params.toString()}`)
        .then((res) => {
          const enriched = res.data.map(r => ({ ...r, age: calculateAge(r.birthdate) }));
          setResidents(enriched);
        })
        .catch();
    }
  }, []);

  const fetchResidents = () => {
    const params = new URLSearchParams();
    for (const key in filters) {
      const value = filters[key];
      if (Array.isArray(value) && value.length > 0) {
        params.append(key, value.join(","));
      } else if (value) {
        params.append(key, value);
      }
    }
    api.get(`/residents?${params.toString()}`)
      .then((res) => {
        const enriched = res.data.map(r => ({ ...r, age: calculateAge(r.birthdate) }));
        setResidents(enriched);
      })
      .catch();
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '31px',
      height: '31px',
      fontSize: '0.875rem'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px'
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '31px'
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.875rem'
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '0.875rem'
    })
  };

  useEffect(() => {
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  }, [filters]);

  const totalItems = residents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const sortedResidents = [...residents].sort((a, b) => {
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
    doc.setFontSize(16);
    doc.text("Laporan Data Warga", 40, 30);
    const tableColumn = [
      "Nama Lengkap", "NIK", "Nomor KK", "Jenis Kelamin", "Alamat Lengkap",
      "Tempat Lahir", "Tanggal Lahir", "Usia", "Gol. Darah", "Agama",
      "Status Perkawinan", "Hubungan Keluarga", "Pendidikan", "Pekerjaan", "Kewarganegaraan", "Status"
    ];
    const tableRows = residents.map(r => [
      r.full_name, r.nik, r.kk_number, r.gender, r.full_address, r.birthplace,
      r.birthdate, r.age, r.blood_type, r.religion, r.marital_status,
      r.relationship, r.education, r.occupation, r.citizenship, r.status
    ]);
    doc.autoTable({
      startY: 20,
      head: [[
        "Nama",
        "NIK",
        "KK",
        "JK",
        "Lahir",
        "Usia",
        "Darah",
        "Status",
        "Alamat"
      ]],

      body: residents.map(r => [
        r.full_name,
        r.nik,
        r.kk_number,
        r.gender === "Laki - Laki" ? "L" : "P",
        `${r.birthplace}, ${r.birthdate}`,
        r.age,
        r.blood_type || "-",
        r.status,
        r.full_address
      ]),

      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top'
      },

      headStyles: {
        fillColor: [52, 73, 94], // darker, more professional
        textColor: 255,
        fontStyle: 'bold'
      },

      columnStyles: {
        0: { cellWidth: 35 }, // Nama
        1: { cellWidth: 35 }, // NIK
        2: { cellWidth: 35 }, // KK
        3: { cellWidth: 12, halign: 'center' }, // JK
        4: { cellWidth: 40 }, // Lahir
        5: { cellWidth: 12, halign: 'center' }, // Usia
        6: { cellWidth: 15, halign: 'center' }, // Gol darah
        7: { cellWidth: 30 }, // Status
        8: { cellWidth: 'auto' } // Alamat (flex)
      },

      didDrawPage: (data) => {
        doc.setFontSize(10);
        const today = new Date();
        const formattedDate = today.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        doc.setFontSize(12);
        doc.text(
          `Laporan data Warga per ${formattedDate}`,
          data.settings.margin.left,
          10
        );
      }
    });
    doc.save(`resident-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleClearFilters = () => setFilters(defaultFilters);

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-file-alt me-2"></i>Laporan Data Warga
          </h1>
          <div>
            <Button variant="outline-danger" className="me-2" onClick={handleExportPDF}>
              <i className="fas fa-file-pdf me-1" /> Export to PDF
            </Button>
          </div>
        </div>

        {/* 🔥 FILTER TOOLBAR */}
        <Card className="mb-3 border-0 shadow-sm no-print">
          <Card.Body>

            {/* 🔹 TOP BAR */}
            <div className="d-flex flex-wrap gap-2 align-items-center mb-2">

              {/* 🔍 Search */}
              <FormControl
                size="sm"
                placeholder="Cari nama, NIK, atau KK..."
                style={{ maxWidth: '280px' }}
                value={filters.full_name}
                onChange={e => setFilters(prev => ({ ...prev, full_name: e.target.value }))}
              />

              {/* 🎯 Quick Filters */}
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setFilters(prev => ({ ...prev, gender: 'Laki - Laki' }))}
              >
                Laki-laki
              </Button>

              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setFilters(prev => ({ ...prev, gender: 'Perempuan' }))}
              >
                Perempuan
              </Button>

              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setFilters(prev => ({ ...prev, min_age: '60', max_age: '150' }))}
              >
                Lansia
              </Button>

              {/* ⚙️ Advanced Toggle */}
              <Button
                size="sm"
                variant="outline-dark"
                onClick={() => setShowAdvanced(prev => !prev)}
              >
                Filters ⚙️
              </Button>

              {/* 🔄 Reset */}
              <Button
                size="sm"
                variant="outline-danger"
                onClick={handleClearFilters}
              >
                Reset
              </Button>

            </div>

            {/* 🔹 ACTIVE FILTER CHIPS */}
            {getActiveFilters().length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {getActiveFilters().map((chip, index) => (
                  <span
                    key={index}
                    className="badge bg-light text-dark border d-flex align-items-center"
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      borderRadius: '20px'
                    }}
                  >
                    {chip.label}
                    <button
                      onClick={() => removeFilter(chip.key, chip.value)}
                      style={{
                        marginLeft: '6px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 🔽 ADVANCED FILTERS */}
            {showAdvanced && (
              <div className="mt-3 pt-3 border-top">
                <Row className="g-3">

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="NIK"
                      value={filters.nik}
                      onChange={e => setFilters(prev => ({ ...prev, nik: e.target.value }))}
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="Nomor KK"
                      value={filters.kk_number}
                      onChange={e => setFilters(prev => ({ ...prev, kk_number: e.target.value }))}
                    />
                  </Col>

                  <Col md={3}>
                    <Select
                      styles={selectStyles}
                      options={[
                        { value: 'Laki - Laki', label: 'Laki - Laki' },
                        { value: 'Perempuan', label: 'Perempuan' }
                      ]}
                      placeholder="Jenis Kelamin"
                      isClearable
                      value={
                        filters.gender
                          ? { value: filters.gender, label: filters.gender }
                          : null
                      }
                      onChange={opt => setFilters(prev => ({
                        ...prev,
                        gender: opt?.value || ''
                      }))}
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="Tempat Lahir"
                      value={filters.birthplace}
                      onChange={e => setFilters(prev => ({ ...prev, birthplace: e.target.value }))}
                    />
                  </Col>

                  {/* 🎂 Birthdate Range */}
                  <Col md={3}>
                    <FormControl
                      type="date"
                      size="sm"
                      value={filters.min_birthdate}
                      onChange={e => setFilters(prev => ({ ...prev, min_birthdate: e.target.value }))}
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      type="date"
                      size="sm"
                      value={filters.max_birthdate}
                      onChange={e => setFilters(prev => ({ ...prev, max_birthdate: e.target.value }))}
                    />
                  </Col>

                  {/* 🎯 Age */}
                  <Col md={3}>
                    <InputGroup size="sm">
                      <FormControl
                        placeholder="Usia Min"
                        type="number"
                        value={filters.min_age}
                        onChange={e => setFilters(prev => ({ ...prev, min_age: e.target.value }))}
                      />
                      <FormControl
                        placeholder="Usia Max"
                        type="number"
                        value={filters.max_age}
                        onChange={e => setFilters(prev => ({ ...prev, max_age: e.target.value }))}
                      />
                    </InputGroup>
                  </Col>

                  <Col md={3}>
                    <MultiSelect
                      styles={selectStyles}
                      options={bloodTypeOptions}
                      value={filters.blood_type}
                      onChange={val => setFilters(prev => ({ ...prev, blood_type: val }))}
                      placeholder="Gol. Darah"
                    />
                  </Col>

                  <Col md={3}>
                    <MultiSelect
                      styles={selectStyles}
                      options={maritalOptions}
                      value={filters.marital_status}
                      onChange={val => setFilters(prev => ({ ...prev, marital_status: val }))}
                      placeholder="Status Perkawinan"
                    />
                  </Col>

                  <Col md={3}>
                    <MultiSelect
                      styles={selectStyles}
                      options={relationshipOptions}
                      value={filters.relationship}
                      onChange={val => setFilters(prev => ({ ...prev, relationship: val }))}
                      placeholder="Hubungan Keluarga"
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="Kewarganegaraan"
                      value={filters.citizenship}
                      onChange={e => setFilters(prev => ({
                        ...prev,
                        citizenship: e.target.value
                      }))}
                    />
                  </Col>

                  <Col md={3}>
                    <Select
                      styles={selectStyles}
                      options={statusOptions}
                      placeholder="Status Warga"
                      isClearable
                      value={statusOptions.find(opt => opt.value === filters.status) || null}
                      onChange={opt => setFilters(prev => ({
                        ...prev,
                        status: opt?.value || ''
                      }))}
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="Pendidikan"
                      value={filters.education}
                      onChange={e => setFilters(prev => ({ ...prev, education: e.target.value }))}
                    />
                  </Col>

                  <Col md={3}>
                    <FormControl
                      size="sm"
                      placeholder="Pekerjaan"
                      value={filters.occupation}
                      onChange={e => setFilters(prev => ({ ...prev, occupation: e.target.value }))}
                    />
                  </Col>

                  <Col md={6}>
                    <FormControl
                      size="sm"
                      placeholder="Alamat Lengkap"
                      value={filters.full_address}
                      onChange={e => setFilters(prev => ({ ...prev, full_address: e.target.value }))}
                    />
                  </Col>

                </Row>
              </div>
            )}

          </Card.Body>
        </Card>

        <Card className="printable-area">
          <Card.Body>
            <Table striped bordered hover responsive size="sm" className="table-sm">
              <thead>
                <tr>
                  {[{ key: 'full_name', label: 'Nama Lengkap' }, { key: 'nik', label: 'NIK' },
                    { key: 'kk_number', label: 'Nomor KK' }, { key: 'gender', label: 'Jenis Kelamin' },
                    { key: 'birthplace', label: 'Tempat Lahir' }, { key: 'birthdate', label: 'Tanggal Lahir' },
                    { key: 'age', label: 'Usia' }, { key: 'blood_type', label: 'Gol. Darah' },
                    { key: 'religion', label: 'Agama' }, { key: 'marital_status', label: 'Status Perkawinan' },
                    { key: 'relationship', label: 'Hubungan Keluarga' }, { key: 'education', label: 'Pendidikan' },
                    { key: 'occupation', label: 'Pekerjaan' }, { key: 'citizenship', label: 'Kewarganegaraan' },
                    { key: 'status', label: 'Status' }, { key: 'full_address', label: 'Alamat Lengkap' }].map(({ key, label }) => (
                      <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
                        {label}{" "}
                        {sortConfig.key === key && (
                          <i className={`fas fa-sort-${sortConfig.direction}`} />
                        )}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {residents.length === 0 ? (
                  <tr><td colSpan="16" className="text-center">Tidak ada data ditemukan</td></tr>
                ) : paginatedResidents.length === 0 ? (
                  <tr><td colSpan="16" className="text-center">Tidak ada data ditemukan</td></tr>
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
                      <td>{resident.status}</td>
                      <td>{resident.full_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Group className="d-flex align-items-center gap-2 mb-0">
                <span className="small">Items per page:</span>
                <Form.Select size="sm" value={itemsPerPage} style={{ width: '80px' }} onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="text-muted">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>

              <div>
                <Button size="sm" variant="secondary" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="me-2">Previous</Button>
                <span className="mx-1">Page {currentPage} of {totalPages}</span>
                <Button size="sm" variant="secondary" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="ms-2">Next</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
