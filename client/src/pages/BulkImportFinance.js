import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";

export default function FinanceImport() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [inserted, setInserted] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setInserted([]);
  };

  const handlePreview = async () => {
    if (!file) return alert("Please select an Excel file.");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await api.post("/finance-import/preview", formData);
      if (res.data.success) {
        setPreviewData(res.data.data);
        setErrors([]);
      } else {
        alert("Preview failed");
      }
    } catch (err) {
      alert("Error previewing file.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return alert("Please select an Excel file.");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await api.post("/finance-import/bulk", formData);
      if (res.data.success) {
        setInserted(res.data.inserted);
        setErrors(res.data.errors);
        alert("Import complete");
      } else {
        alert("Import failed");
      }
    } catch (err) {
      alert("Error during import.");
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
                  <th>Warga ID</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 2}</td>
                    <td>{row["Tanggal"]}</td>
                    <td>{row["Jenis"]}</td>
                    <td>{row["Keterangan"]}</td>
                    <td>{row["Jumlah"]}</td>
                    <td>{row["Warga ID"]}</td>
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
    </AdminLayout>
  );
}
