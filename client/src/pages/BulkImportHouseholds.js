import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from '../api';
import ModalDialog from "../Components/ModalDialog";
import { useNavigate } from "react-router-dom";

export default function BulkImportHouseholds() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importResult, setImportResult] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);
    setShowSuccessModal(false);
  };

  const handlePreview = async () => {
    if (!file) return alert("Please select a file");

    setLoadingPreview(true);
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/households-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setPreviewData(res.data.data || []);
        setErrors(res.data.errors || []);
      } else {
        alert("Preview failed: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Preview request failed: " + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return alert("Nothing to import");

    setLoadingImport(true);
    setImportResult(null);
    setShowSuccessModal(false);
    setShowErrorModal(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/households-import/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setImportResult(res.data);
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/households");
        }, 3000);

        setFile(null);
        setPreviewData([]);
        setErrors([]);
      } else {
        setImportResult(res.data);
        setShowErrorModal(true);
      }
    } catch (err) {
      setShowErrorModal(true);
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 text-gray-800 mb-4">
          <i className="fas fa-file-upload me-2"></i> Bulk Import Households
        </h1>

        <div className="mb-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="form-control"
            onChange={handleFileChange}
          />
        </div>

        <div className="mb-3">
          <a
            href="http://localhost:5000/public/templates/Household_template.xlsx"
            className="btn btn-primary me-2"
            download
          >
            <i className="fas fa-download me-2"></i>Download Excel Template
          </a>
          <button
            className="btn btn-primary me-2"
            onClick={handlePreview}
            disabled={loadingPreview || !file}
          >
            {loadingPreview ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Loading preview...
              </>
            ) : (
              "Preview"
            )}
          </button>

          <button
            className="btn btn-success"
            onClick={handleImport}
            disabled={loadingImport || !file || previewData.length === 0}
          >
            {loadingImport ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Importing...
              </>
            ) : (
              "Import to Database"
            )}
          </button>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert">
            <h5>Preview Errors:</h5>
            <ul className="mb-0">
              {errors.map((e, i) => (
                <li key={i}>{typeof e === "string" ? e : `Row ${e.row}: ${e.message}`}</li>
              ))}
            </ul>
          </div>
        )}

        {previewData.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table table-bordered table-striped">
              <thead className="table-primary">
                <tr>
                  <th>Nomor KK</th>
                  <th>Alamat</th>
                  <th>Status KK</th>
                  <th>Keterangan Tidak Aktif</th>
                  <th>Status Kepemilikan Rumah</th>
                  <th>Menumpang pada KK</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.kk_number || "-"}</td>
                    <td>{row.address || row["Alamat Lengkap"] || "-"}</td>
                    <td>{row.status_KK || "-"}</td>
                    <td>{row.status_KK_remarks || "-"}</td>
                    <td>{row.status_kepemilikan_rumah || "-"}</td>
                    <td>{row.borrowed_from_kk || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importResult && (
          <div className="alert alert-info">
            <h5>Import Result:</h5>
            <p>✅ Inserted rows: {importResult.inserted?.length || 0}</p>
            {importResult.errors?.length > 0 && (
              <>
                <h6>Errors:</h6>
                <ul>
                  {importResult.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <ModalDialog
        show={showSuccessModal}
        title="Import Berhasil"
        message={`Data KK berhasil diimpor sebanyak ${importResult?.inserted?.length || 0} baris.`}
        isSuccess={true}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/households");
        }}
      />

      <ModalDialog
        show={showErrorModal}
        title="Import Gagal"
        message={`Import gagal. Pastikan data sudah sesuai dan tidak ada error pada preview.`}
        isSuccess={false}
        onClose={() => setShowErrorModal(false)}
      />
    </AdminLayout>
  );
}
