import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";
import ModalDialog from "../Components/ModalDialog";
import { useNavigate } from "react-router-dom";

export default function BulkImportResidents() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [insertedCount, setInsertedCount] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setErrors([]);
    setInsertedCount(0);
    setShowSuccessModal(false);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoadingPreview(true);
    setPreviewData([]);
    setErrors([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/residents-import/preview", formData);
      if (res.data.success) {
        setPreviewData(res.data.data || []);
        setErrors(res.data.errors || []);
      } else {
        alert("Preview failed.");
      }
    } catch (err) {
      alert("Preview request failed.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!file || errors.length > 0 || previewData.length === 0) return;
    setLoadingImport(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/residents-import/bulk", formData);
      if (res.data.success) {
        setInsertedCount(res.data.inserted?.length || 0);
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/residents");
        }, 3000);
        setFile(null);
        setPreviewData([]);
        setErrors([]);
      } else {
        alert("Import failed.");
      }
    } catch (err) {
      alert("Import request failed.");
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
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Loading preview...
              </>
            ) : (
              "Preview"
            )}
          </button>
          <button
            className="btn btn-success"
            onClick={handleImport}
            disabled={
              loadingImport || !file || previewData.length === 0 || errors.length > 0
            }
          >
            {loadingImport ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
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
            <div className="d-flex flex-column" style={{ height: "calc(100vh - 200px)" }}>
              <div className="flex-grow-1 overflow-auto">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light sticky-top bg-white">
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
                        <th>Status NIK</th>
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
                          <td>{row.birthdate}</td>
                          <td>{row.blood_type || "-"}</td>
                          <td>{row.religion}</td>
                          <td>{row.marital_status}</td>
                          <td>{row.relationship}</td>
                          <td>{row.education || "-"}</td>
                          <td>{row.occupation || "-"}</td>
                          <td>{row.citizenship}</td>
                          <td>{row.full_address}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalDialog
        show={showSuccessModal}
        title="Import Berhasil"
        message={`Data warga berhasil diimpor sebanyak ${insertedCount} baris.`}
        isSuccess={true}
        onClose={() => setShowSuccessModal(false)}
      />
    </AdminLayout>
  );
}
