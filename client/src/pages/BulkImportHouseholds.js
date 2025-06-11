import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";

export default function BulkImportHouseholds() {
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
      const res = await axios.post("http://localhost:5000/api/households-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        // Assuming backend returns 'data' as preview array and 'errors' if any
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/households-import/bulk", formData, {
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
                  <th>KK Number</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    <td>{row["Nomor KK"] || row.kk_number || "-"}</td>
                    <td>{row["Alamat Lengkap"] || row.address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importResult && (
          <div className="alert alert-info">
            <h5>Import Result:</h5>
            <p>Inserted rows: {importResult.inserted?.length || 0}</p>
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
    </AdminLayout>
  );
}
