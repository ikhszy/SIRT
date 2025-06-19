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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transaction) {
      setError("❌ Data transaksi tidak ditemukan.");
    }
  }, [transaction]);

  const borrowerDisplayName =
    transaction?.borrower_type === "warga"
      ? transaction?.borrower_name_resident
      : transaction?.borrower_name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!transaction) {
      setError("Transaksi tidak tersedia.");
      return;
    }

    if ((condition === "rusak" || condition === "hilang") && description.trim() === "") {
      setError("Mohon isi keterangan jika barang rusak atau hilang.");
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

      setMessage("✅ Barang berhasil dikembalikan.");
      setTimeout(() => navigate("/inventory-transaction"), 2000);
    } catch (err) {
      setError("❌ Gagal mengembalikan barang: " + (err.response?.data?.error || err.message));
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
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-undo me-2"></i>Kembalikan Barang
        </h1>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

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
      </div>
    </AdminLayout>
  );
}
