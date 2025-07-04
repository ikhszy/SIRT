// client/src/pages/SuratPengantar/IntroLetterForm.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import AdminLayout from '../../layouts/AdminLayout';

export default function IntroLetterForm() {
  const [residents, setResidents] = useState([]);
  const [selectedNIK, setSelectedNIK] = useState('');
  const [residentDetail, setResidentDetail] = useState(null);
  const [settings, setSettings] = useState({});
  const [letterPurpose, setLetterPurpose] = useState('');
  const [letterNumber, setLetterNumber] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResidents();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedNIK) {
      fetchResidentDetail(selectedNIK);
    } else {
      setResidentDetail(null);
    }
  }, [selectedNIK]);

  const fetchResidents = async () => {
    const res = await api.get('/residents?lookup=true');
    setResidents(res.data);
  };

  const fetchSettings = async () => {
    const res = await api.get('/settings');
    setSettings(res.data);
  };

  const fetchResidentDetail = async (nik) => {
    const res = await api.get(`/residents/nik/${nik}`); 
    setResidentDetail(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNIK || !letterPurpose || !letterNumber) return;

    try {
      const res = await api.post('/surat', {
        nik: selectedNIK,
        letterPurpose,
        letterNumber
      });

      if (res.data?.id) {
        navigate(`/surat/${res.data.id}`);
      } else {
        console.error('Surat created but no ID returned!');
      }
    } catch (err) {
      console.error('Error creating surat:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-file-alt me-2"></i> Buat Surat Pengantar
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/surat')} // or your preferred url
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
        <div className="card shadow mb-4">
          <div className="card-body">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>NIK</Form.Label>
                <Select
                  options={residents.map(r => ({
                    value: r.nik,
                    label: `${r.full_name} - ${r.nik}`
                  }))}
                  value={
                    residents
                      .map(r => ({ value: r.nik, label: `${r.full_name} - ${r.nik}` }))
                      .find(opt => opt.value === selectedNIK) || null
                  }
                  onChange={(option) => setSelectedNIK(option ? option.value : '')}
                  placeholder="Cari nama atau NIK..."
                  isClearable
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nomor Surat</Form.Label>
                <Form.Control
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  placeholder="Masukkan Nomor Surat"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Maksud / Keperluan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={letterPurpose}
                  onChange={(e) => setLetterPurpose(e.target.value)}
                  placeholder="Masukkan tujuan pembuatan surat"
                />
              </Form.Group>

              {residentDetail && (
                <>
                  <hr className="my-4" />
                  <h5 className="mb-3">Data Otomatis</h5>
                  <Row className="mb-2">
                    <Col md={6}><strong>Nama:</strong> {residentDetail.full_name}</Col>
                    <Col md={6}><strong>Tempat/Tanggal Lahir:</strong> {residentDetail.birthplace}, {residentDetail.birthdate}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={6}><strong>Jenis Kelamin:</strong> {residentDetail.gender}</Col>
                    <Col md={6}><strong>NIK / KK:</strong> {residentDetail.nik} / {residentDetail.kk_number}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={6}><strong>Status Perkawinan:</strong> {residentDetail.marital_status}</Col>
                    <Col md={6}><strong>Pekerjaan:</strong> {residentDetail.occupation}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={6}><strong>Kewarganegaraan:</strong> {residentDetail.citizenship}</Col>
                    <Col md={6}><strong>Pendidikan:</strong> {residentDetail.education}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}><strong>Agama:</strong> {residentDetail.religion}</Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <strong>Alamat:</strong> {residentDetail.full_address}, RT {settings.rt}/RW {settings.rw}, {settings.kelurahan}, {settings.kecamatan}, {settings.kota}, {settings.kodepos}
                    </Col>
                  </Row>
                </>
              )}

              <div className="mt-4 text-end">
                <Button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-2"></i> Simpan dan Buat Surat
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
