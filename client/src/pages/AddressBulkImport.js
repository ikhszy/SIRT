import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";
import ModalDialog from "../Components/ModalDialog";
import { useNavigate } from "react-router-dom";

export default function BulkImportAddress() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [inserted, setInserted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setInserted([]);
    setShowSuccessModal(false);
  };

  const handlePreview = async () => {
    if (!file) return alert("Please select an Excel file.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await api.post("/address-import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setPreviewData(res.data.data || []);
        setErrors(res.data.errors || []);
        setInserted([]);
      } else {
        alert("Preview failed.");
      }
    } catch (error) {
      alert("Error while previewing.");
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
      setInserted(res.data.inserted || []);
      setErrors(res.data.errors || []);

      if (res.data.success && res.data.inserted.length > 0) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/addresses");
        }, 3000);
      } else {
        alert("Tidak ada baris yang berhasil diimpor.");
      }
    } catch (error) {
      alert("Import gagal.");
    } finally {
      setLoading(false);
    }
  };

  const hasDuplicate = previewData.some((row) => row.__duplicate);
  const hasError = errors.length > 0;
  const getRowError = (rowNumber) => {
    const err = errors.find((e) => e.row === rowNumber);
    return err ? err.message : null;
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-file-upload me-2"></i> Import Alamat
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/addresses')} // or your preferred url
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>
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
          disabled={
            loading || !file || previewData.length === 0 || hasError || hasDuplicate
          }
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
                  <th>Alamat Lengkap</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => {
                  const isDuplicate = row.__duplicate;
                  const errorMsg = getRowError(row.__rowNumber);
                  const rowClass = isDuplicate || errorMsg ? "table-danger" : "";

                  return (
                    <tr key={idx} className={rowClass}>
                      <td>{row.__rowNumber}</td>
                      <td>
                        {row["Alamat Lengkap"] || "-"}
                        {isDuplicate && (
                          <span className="ms-2 text-danger fw-bold">(Duplikat)</span>
                        )}
                        {errorMsg && (
                          <div className="text-danger small">(Error: {errorMsg})</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      <ModalDialog
        show={showSuccessModal}
        title="Import Berhasil"
        message={`Data alamat berhasil diimpor sebanyak ${inserted.length} baris.`}
        isSuccess={true}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/addresses");
        }}
      />
    </AdminLayout>
  );
}
