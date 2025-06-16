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
    const res = await api.get(`/residents/nik/${nik}`); // ✅ Ensure you're using /nik/:nik
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
      <Card className="p-4">
        <h4>Buat Surat Pengantar</h4>
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
              <h5>Data Otomatis</h5>
              <Row>
                <Col md={6}><strong>Nama:</strong> {residentDetail.full_name}</Col>
                <Col md={6}><strong>Tempat/Tanggal Lahir:</strong> {residentDetail.birthplace}, {residentDetail.birthdate}</Col>
              </Row>
              <Row>
                <Col md={6}><strong>Jenis Kelamin:</strong> {residentDetail.gender}</Col>
                <Col md={6}><strong>NIK / KK:</strong> {residentDetail.nik} / {residentDetail.kk_number}</Col>
              </Row>
              <Row>
                <Col md={6}><strong>Status Perkawinan:</strong> {residentDetail.marital_status}</Col>
                <Col md={6}><strong>Pekerjaan:</strong> {residentDetail.occupation}</Col>
              </Row>
              <Row>
                <Col md={6}><strong>Kewarganegaraan:</strong> {residentDetail.citizenship}</Col>
                <Col md={6}><strong>Pendidikan:</strong> {residentDetail.education}</Col>
              </Row>
              <Row>
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
            <Button type="submit">Simpan dan Buat Surat</Button>
          </div>
        </Form>
      </Card>
    </AdminLayout>
  );
}
