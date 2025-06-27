import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";
import ModalDialog from "../Components/ModalDialog";

export default function FinanceImport() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [inserted, setInserted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', isSuccess: true });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setInserted([]);
  };

  const handlePreview = async () => {
    if (!file) {
      return setModal({
        show: true,
        title: 'Gagal',
        message: 'Silakan pilih file Excel terlebih dahulu.',
        isSuccess: false
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const res = await api.post("/finance/import/preview", formData);
      if (!res.data.success) {
        return setModal({
          show: true,
          title: 'Gagal',
          message: 'Preview gagal dilakukan.',
          isSuccess: false
        });
      }

      const previewRows = res.data.data || [];
      const errorsFromBackend = res.data.errors || [];

      const addressIds = [...new Set(previewRows.map(r => r.addressId).filter(Boolean))];
      let addressMap = {};

      if (addressIds.length > 0) {
        const allAddresses = await api.get("/address");
        addressMap = Object.fromEntries(
          allAddresses.data.map(addr => [addr.id, addr.full_address])
        );
      }

      const enrichedPreview = previewRows.map(row => ({
        ...row,
        full_address: row.addressId ? addressMap[row.addressId] || "(Alamat tidak ditemukan)" : "-"
      }));

      setPreviewData(enrichedPreview);
      setErrors(errorsFromBackend);

      setModal({
        show: true,
        title: 'Preview Berhasil',
        message: `Preview berhasil. Ditemukan ${previewRows.length} baris.`,
        isSuccess: true
      });
    } catch (err) {
      console.error("Preview error:", err?.response || err);
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Terjadi kesalahan saat melakukan preview file.',
        isSuccess: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      return setModal({
        show: true,
        title: 'Gagal',
        message: 'Silakan pilih file Excel terlebih dahulu.',
        isSuccess: false
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await api.post("/finance/import/import", formData);
      if (res.data.success) {
        setInserted(res.data.inserted);
        setErrors(res.data.errors);

        setModal({
          show: true,
          title: 'Import Berhasil',
          message: `Berhasil mengimpor ${res.data.inserted.length} baris.`,
          isSuccess: true
        });
      } else {
        setModal({
          show: true,
          title: 'Import Gagal',
          message: 'Terjadi kesalahan saat mengimpor data.',
          isSuccess: false
        });
      }
    } catch (err) {
      console.error("Import error:", err);
      setModal({
        show: true,
        title: 'Gagal',
        message: 'Terjadi kesalahan saat mengimpor file.',
        isSuccess: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 text-gray-800 mb-4">
          <i className="fas fa-file-upload me-2"></i> Bulk Import Finance
        </h1>

        <div className="mb-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>
        <a
          href="http://localhost:5000/public/templates/Finance_template.xlsx"
          className="btn btn-primary me-2"
          download
        >
          <i className="fas fa-download me-2"></i>Download Template
        </a>
        <button className="btn btn-primary me-2" onClick={handlePreview} disabled={loading || !file}>
          Preview
        </button>
        <button className="btn btn-success" onClick={handleImport} disabled={loading || !file}>
          Import
        </button>

        {previewData.length > 0 && (
          <div className="mt-4">
            <h5>Preview</h5>
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th>Row</th>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Keterangan</th>
                  <th>Jumlah</th>
                  <th>Alamat</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 2}</td>
                    <td>{row.transactionDate}</td>
                    <td>{row.category}</td>
                    <td>{row.remarks}</td>
                    <td>{row.transactionAmount}</td>
                    <td>{row.full_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 alert alert-danger">
            <h5>Errors</h5>
            <ul>
              {errors.map((err, i) => (
                <li key={i}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        {inserted.length > 0 && (
          <div className="mt-4 alert alert-success">
            <h5>Inserted Rows</h5>
            <ul>
              {inserted.map((ins, i) => (
                <li key={i}>Row {ins.row} inserted as ID {ins.id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ModalDialog
        show={modal.show}
        title={modal.title}
        message={modal.message}
        isSuccess={modal.isSuccess}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}