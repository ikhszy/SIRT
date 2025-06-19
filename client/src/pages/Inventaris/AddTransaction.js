import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function AddTransaction() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "success" });

  const [formData, setFormData] = useState({
    item_id: "",
    quantity: 1,
    condition: "baik",
    location: "",
    description: "",
    borrower_type: "warga",
    borrower_id: "",
    borrower_name: "",
    transaction_type: "borrow",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItem = items.find((item) => item.id == formData.item_id);
  const availableQty = selectedItem?.quantity ?? null;

  useEffect(() => {
    api.get("/inventory").then((res) => setItems(res.data));
    api.get("/residents").then((res) => setResidents(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ text: "", type: "success" });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage({ text: "", type: "success" });

    // Validation
    if (!formData.item_id) return setError("Barang harus dipilih.");
    if (formData.quantity < 1) return setError("Jumlah minimal 1.");
    if (formData.borrower_type === "warga" && !formData.borrower_id)
      return setError("Warga harus dipilih.");
    if (formData.borrower_type === "bukan warga" && !formData.borrower_name.trim())
      return setError("Nama peminjam harus diisi.");
    if (!formData.location.trim()) return setError("Lokasi harus diisi.");

    if (formData.transaction_type === "borrow" && availableQty !== null && formData.quantity > availableQty) {
      return setError(`Jumlah melebihi stok tersedia (${availableQty}).`);
    }

    setLoading(true);

    try {
      await api.post("/inventory-transactions", formData);
      setMessage({ text: "✅ Transaksi berhasil disimpan", type: "success" });
      setShowToast(true);

      setTimeout(() => navigate("/inventory-transaction"), 1500);

      // Reset form except item_id
      setFormData((prev) => ({
        ...prev,
        quantity: 1,
        location: "",
        description: "",
        borrower_id: "",
        borrower_name: "",
      }));
    } catch (err) {
      setMessage({
        text: "❌ Gagal menyimpan: " + (err.response?.data?.error || err.message),
        type: "error",
      });
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-plus-circle me-2"></i>Tambah Transaksi Inventaris
        </h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Item select */}
          <div className="mb-3">
            <label>Nama Barang</label>
            <select
              className="form-select"
              name="item_id"
              value={formData.item_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Pilih Barang --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity input */}
          <div className="mb-3">
            <label>Jumlah</label>
            <input
              type="number"
              className="form-control"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
            {availableQty !== null && (
              <small
                className={`${
                  parseInt(formData.quantity || 0) > availableQty
                    ? "text-danger"
                    : "text-muted"
                }`}
              >
                Stok tersedia: {availableQty}
              </small>
            )}
          </div>

          {/* Condition select */}
          <div className="mb-3">
            <label>Kondisi</label>
            <select
              className="form-select"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              <option value="baik">Baik</option>
              <option value="rusak">Rusak</option>
              <option value="hilang">Hilang</option>
            </select>
          </div>

          {/* Location input */}
          <div className="mb-3">
            <label>Lokasi</label>
            <input
              type="text"
              className="form-control"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description textarea */}
          <div className="mb-3">
            <label>Keterangan</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Borrower type */}
          <div className="mb-3">
            <label>Peminjam</label>
            <select
              className="form-select"
              name="borrower_type"
              value={formData.borrower_type}
              onChange={handleChange}
              required
            >
              <option value="warga">Warga</option>
              <option value="bukan warga">Bukan Warga</option>
            </select>
          </div>

          {/* Conditional input for borrower */}
          {formData.borrower_type === "warga" ? (
            <div className="mb-3">
              <label>Nama Warga</label>
              <select
                className="form-select"
                name="borrower_id"
                value={formData.borrower_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Pilih Warga --</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.full_address})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <label>Nama Peminjam (Bukan Warga)</label>
              <input
                type="text"
                className="form-control"
                name="borrower_name"
                value={formData.borrower_name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Menyimpan...
              </>
            ) : (
              "Simpan Transaksi"
            )}
          </button>
        </form>

        {/* Toast Message */}
        {showToast && (
          <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div
              className={`toast align-items-center text-white ${
                message.type === "success" ? "bg-success" : "bg-danger"
              } border-0 show`}
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="d-flex">
                <div className="toast-body">{message.text}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setShowToast(false)}
                ></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
