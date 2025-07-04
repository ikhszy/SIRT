import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";

export default function ReturnTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const transaction = location.state?.transaction;

  const [condition, setCondition] = useState("baik");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", isSuccess: true });

  useEffect(() => {
    if (!transaction) {
      setToast({
        show: true,
        message: "❌ Data transaksi tidak ditemukan.",
        isSuccess: false
      });
    }
  }, [transaction]);

  const borrowerDisplayName =
    transaction?.borrower_type === "warga"
      ? transaction?.borrower_name_resident
      : transaction?.borrower_name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setToast({ show: false, message: "", isSuccess: true });

    if (!transaction) {
      return setToast({ show: true, message: "Transaksi tidak tersedia.", isSuccess: false });
    }

    if ((condition === "rusak" || condition === "hilang") && !description.trim()) {
      setErrors({ description: "Mohon isi keterangan jika barang rusak atau hilang." });
      return;
    }

    setLoading(true);
    try {
      await api.post("/inventory-transactions", {
        item_id: transaction.item_id,
        quantity: transaction.quantity,
        condition,
        location: transaction.location,
        description,
        borrower_type: transaction.borrower_type,
        borrower_id: transaction.borrower_id,
        borrower_name: transaction.borrower_name,
        transaction_type: "return",
      });

      setToast({
        show: true,
        message: "✅ Barang berhasil dikembalikan.",
        isSuccess: true,
      });

      setTimeout(() => navigate("/inventory-transaction"), 1500);
    } catch (err) {
      setToast({
        show: true,
        message: "❌ Gagal mengembalikan barang: " + (err.response?.data?.error || err.message),
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">Data transaksi tidak tersedia.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-undo me-2"></i>Kembalikan Barang
          </h1>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => navigate('/inventory-transaction')}
          >
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Nama Barang</label>
            <input type="text" className="form-control" value={transaction.item_name} disabled />
          </div>

          <div className="mb-3">
            <label>Jumlah</label>
            <input type="number" className="form-control" value={transaction.quantity} disabled />
          </div>

          <div className="mb-3">
            <label>Dipinjam oleh</label>
            <input type="text" className="form-control" value={borrowerDisplayName} disabled />
          </div>

          <div className="mb-3">
            <label>Lokasi pinjam</label>
            <input type="text" className="form-control" value={transaction.location} disabled />
          </div>

          <div className="mb-3">
            <label>Kondisi Saat Dikembalikan</label>
            <select
              className="form-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
            >
              <option value="baik">Baik</option>
              <option value="rusak">Rusak</option>
              <option value="hilang">Hilang</option>
            </select>
          </div>

          <div className="mb-3">
            <label>Keterangan</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Isi keterangan jika barang rusak/hilang"
            />
            {errors.description && <div className="text-danger small">{errors.description}</div>}
          </div>

          <button className="btn btn-success" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Mengembalikan...
              </>
            ) : (
              "Kembalikan Barang"
            )}
          </button>
        </form>

        {/* Snackbar */}
        <div
          className="toast-container position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast align-items-center text-white ${
              toast.isSuccess ? "bg-success" : "bg-danger"
            } ${toast.show ? "show" : ""}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast({ ...toast, show: false })}
              ></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
