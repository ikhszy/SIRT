import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";

export default function BulkImportAddress() {
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
      const res = await api.post("/address-import/preview", formData);
      if (res.data.success) {
        setPreviewData(res.data.data);
        setErrors([]);
      } else {
        alert("Preview failed");
      }
    } catch (error) {
      alert("Error while previewing");
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
      const res = await api.post("/address-import/bulk", formData);
      if (res.data.success) {
        setInserted(res.data.inserted);
        setErrors(res.data.errors);
        alert("Import completed");
      } else {
        alert("Import failed");
      }
    } catch (error) {
      alert("Error during import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-3 text-gray-800">Bulk Import Addresses</h1>

        <div className="mb-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>
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
          disabled={loading || !file}
        >
          Preview
        </button>

        <button
          className="btn btn-success"
          onClick={handleImport}
          disabled={loading || !file}
        >
          Import
        </button>

        {previewData.length > 0 && (
          <div className="mt-4">
            <h5>Preview</h5>
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th>Row</th>
                  <th>Alamat</th>
                  <th>RT</th>
                  <th>RW</th>
                  <th>Kelurahan</th>
                  <th>Kecamatan</th>
                  <th>Kota</th>
                  <th>Kode pos</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 2}</td>
                    <td>{row["Alamat Lengkap"] || "-"}</td>
                    <td>{row["RT"] || "-"}</td>
                    <td>{row["RW"] || "-"}</td>
                    <td>{row["Kelurahan"] || "-"}</td>
                    <td>{row["Kecamatan"] || "-"}</td>
                    <td>{row["Kota"] || "-"}</td>
                    <td>{row["Kodepos"] || "-"}</td>
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
                <li key={i}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {inserted.length > 0 && (
          <div className="mt-4 alert alert-success">
            <h5>Inserted Rows</h5>
            <ul>
              {inserted.map((ins, i) => (
                <li key={i}>Row {ins.row} inserted with ID {ins.id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
