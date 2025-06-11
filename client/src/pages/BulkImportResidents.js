import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { formatDateIndo } from "../utils/formatDate"

export default function BulkImportResidents() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);
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
      const res = await axios.post("/api/residents-import/preview", formData, {
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
    if (errors.length > 0) return alert("Cannot import: Please fix all errors first.");

    setLoadingImport(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/residents-import/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setImportResult(res.data);
      } else {
        alert("Import failed: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Import request failed: " + err.message);
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 text-gray-800 mb-4">
          <i className="fas fa-file-upload me-2"></i> Bulk Import Residents
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
          href="http://localhost:5000/public/templates/Residents_template.xlsx"
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
          disabled={loadingImport || !file || previewData.length === 0 || errors.length > 0}
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
        <div className="alert alert-danger">
          <h5>Errors</h5>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewData.length > 0 && errors.length === 0 && (
        <div>
          <h5>Preview Data</h5>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Nama Lengkap</th>
                  <th>NIK</th>
                  <th>Nomor KK</th>
                  <th>Jenis Kelamin</th>
                  <th>Tempat Lahir</th>
                  <th>Tanggal Lahir</th>
                  <th>Gol. Darah</th>
                  <th>Agama</th>
                  <th>Status Perkawinan</th>
                  <th>Status dalam Keluarga</th>
                  <th>Pendidikan Terakhir</th>
                  <th>Pekerjaan</th>
                  <th>Kewarganegaraan</th>
                  <th>Alamat</th>
                  <th>Domisili</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>{row.full_name}</td>
                    <td>{row.nik}</td>
                    <td>{row.kk_number}</td>
                    <td>{row.gender}</td>
                    <td>{row.birthplace}</td>
                    <td>{formatDateIndo(row.birthdate)}</td>
                    <td>{row.blood_type || "-"}</td>
                    <td>{row.religion}</td>
                    <td>{row.marital_status}</td>
                    <td>{row.relationship}</td>
                    <td>{row.education || "-"}</td>
                    <td>{row.occupation || "-"}</td>
                    <td>{row.citizenship}</td>
                    <td>{row.address_text}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-success mt-3"
            onClick={handleImport}
            disabled={loadingImport}
          >
            {loadingImport ? "Importing..." : "Import to Database"}
          </button>
        </div>
      )}

      {importResult && (
        <div className="mt-3">
          <h5>Import Result</h5>
          <p>Inserted rows: {importResult.inserted.length}</p>
          {importResult.errors.length > 0 && (
            <div className="alert alert-warning">
              <h6>Errors during import:</h6>
              <ul>
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
