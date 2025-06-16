// client/src/pages/SuratPengantar/SuratPreviewPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import AdminLayout from '../../layouts/AdminLayout';
import IntroLetterPreview from './IntroLetterPreview';
import { Button, Spinner } from 'react-bootstrap';
import html2pdf from 'html2pdf.js';

export default function SuratPreviewPage() {
  const { id } = useParams();
  const [letter, setLetter] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const letterRef = useRef();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [letterRes, settingsRes] = await Promise.all([
        api.get(`/surat/${id}`),
        api.get('/settings')
      ]);
      setLetter(letterRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch letter data:', err);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = letterRef.current;
    const opt = {
      margin:       0.5,
      filename:     `${letter.full_name}_surat_pengantar.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <Spinner animation="border" /> <div>Memuat surat...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!letter || !settings) {
    return (
      <AdminLayout>
        <div className="text-center my-5 text-danger">
          Gagal memuat data surat.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-3 d-print-none text-end">
        <Button variant="secondary" className="me-2" onClick={handlePrint}>
          🖨️ Print Surat
        </Button>
        <Button variant="success" onClick={handleDownloadPDF}>
          📥 Download PDF
        </Button>
      </div>

      <div ref={letterRef}>
        <IntroLetterPreview
          resident={{
            full_name: letter.full_name,
            birthplace: letter.birthplace,
            birthdate: letter.birthdate,
            gender: letter.gender,
            nik: letter.nik,
            kk_number: letter.kk_number,
            marital_status: letter.marital_status,
            occupation: letter.occupation,
            citizenship: letter.citizenship,
            education: letter.education,
            religion: letter.religion,
            full_address: letter.full_address
          }}
          letterNumber={letter.letterNumber}
          letterPurpose={letter.letterPurpose}
          settings={settings}
          date_created={letter.date_created}
        />
      </div>
      {letter.letterStatus !== 'Diserahkan' && (
        <div className="text-end mt-4">
          <button
            className="btn btn-success"
            onClick={async () => {
              try {
                await api.put(`/surat/${id}/status`, { letterStatus: 'Diserahkan' });
                alert('Surat telah diserahkan.');
                fetchLetter(); // Re-fetch data to refresh status
              } catch (err) {
                console.error('Gagal menyerahkan surat:', err);
                alert('Gagal menyerahkan surat.');
              }
            }}
          >
            Serahkan Surat
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
