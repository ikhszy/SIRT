import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function AddTransaction() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [residents, setResidents] = useState([]);
  const [formData, setFormData] = useState({
    item_id: "",
    quantity: 1,
    condition: "",
    location: "",
    description: "",
    borrower_type: "warga",
    borrower_id: "",
    borrower_name: "",
    transaction_type: "borrow",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSuccess, setToastSuccess] = useState(true);

  const selectedItem = items.find((item) => item.id == formData.item_id);
  const selectedResident = residents.find((r) => r.id == formData.borrower_id);
  const availableQty = selectedItem?.quantity ?? null;

  useEffect(() => {
    api.get("/inventory").then((res) => setItems(res.data));
    api.get("/residents").then((res) => setResidents(res.data));
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setFormData((prev) => ({
        ...prev,
        condition: selectedItem.condition,
      }));
    }
  }, [selectedItem]);

  useEffect(() => {
    if (formData.borrower_type === "warga" && selectedResident) {
      setFormData((prev) => ({
        ...prev,
        location: selectedResident.full_address || "",
      }));
    }
  }, [formData.borrower_type, selectedResident]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "location" && formData.borrower_type === "warga") return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.item_id) newErrors.item_id = "Barang harus dipilih.";
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = "Jumlah minimal 1.";
    if (
      formData.transaction_type === "borrow" &&
      availableQty !== null &&
      formData.quantity > availableQty
    ) {
      newErrors.quantity = `Jumlah melebihi stok tersedia (${availableQty}).`;
    }
    if (!formData.location.trim()) newErrors.location = "Lokasi harus diisi.";
    if (formData.borrower_type === "warga" && !formData.borrower_id)
      newErrors.borrower_id = "Warga harus dipilih.";
    if (formData.borrower_type === "bukan warga" && !formData.borrower_name.trim())
      newErrors.borrower_name = "Nama peminjam harus diisi.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post("/inventory-transactions", formData);
      setToastMessage("✅ Peminjaman barang berhasil!");
      setToastSuccess(true);
      setShowToast(true);
      setTimeout(() => navigate("/inventory-transaction"), 1500);
    } catch (err) {
      setToastMessage("❌ " + (err.response?.data?.error || err.message));
      setToastSuccess(false);
      setShowToast(true);
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-left mb-4">
          <h1 className="h3 text-gray-800">
            <i className="fas fa-plus-circle me-2"></i>Tambah Transaksi Inventaris
          </h1>
          <button className="btn btn-warning" onClick={() => navigate("/inventory-transaction")}>
            <i className="fas fa-arrow-left me-1"></i> Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nama Barang */}
          <div className="mb-3">
            <label>Nama Barang</label>
            <select className="form-select" name="item_id" value={formData.item_id} onChange={handleChange}>
              <option value="">-- Pilih Barang --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.item_id && <div className="text-danger small">{errors.item_id}</div>}
          </div>

          {/* Jumlah */}
          <div className="mb-3">
            <label>Jumlah</label>
            <input
              type="number"
              className="form-control"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
            />
            {availableQty !== null && (
              <small
                className={`${
                  parseInt(formData.quantity || 0) > availableQty ? "text-danger" : "text-muted"
                }`}
              >
                Stok tersedia: {availableQty}
              </small>
            )}
            {errors.quantity && <div className="text-danger small">{errors.quantity}</div>}
          </div>

          {/* Kondisi */}
          <div className="mb-3">
            <label>Kondisi</label>
            <input
              type="text"
              className="form-control"
              name="condition"
              value={formData.condition}
              disabled
            />
          </div>

          {/* Tipe Peminjam */}
          <div className="mb-3">
            <label>Peminjam</label>
            <select className="form-select" name="borrower_type" value={formData.borrower_type} onChange={handleChange}>
              <option value="warga">Warga</option>
              <option value="bukan warga">Bukan Warga</option>
            </select>
          </div>

          {/* Nama Warga atau Peminjam */}
          {formData.borrower_type === "warga" ? (
            <div className="mb-3">
              <label>Nama Warga</label>
              <select
                className="form-select"
                name="borrower_id"
                value={formData.borrower_id}
                onChange={handleChange}
              >
                <option value="">-- Pilih Warga --</option>
                {residents
                  .filter((r) => r.status?.toLowerCase() === "aktif")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} – {r.nik}
                    </option>
                  ))}
              </select>
              {errors.borrower_id && <div className="text-danger small">{errors.borrower_id}</div>}
            </div>
          ) : (
            <div className="mb-3">
              <label>Nama Peminjam</label>
              <input
                type="text"
                className="form-control"
                name="borrower_name"
                value={formData.borrower_name}
                onChange={handleChange}
              />
              {errors.borrower_name && <div className="text-danger small">{errors.borrower_name}</div>}
            </div>
          )}

          {/* Lokasi */}
          <div className="mb-3">
            <label>Lokasi</label>
            <input
              type="text"
              className="form-control"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={formData.borrower_type === "warga"}
            />
            {errors.location && <div className="text-danger small">{errors.location}</div>}
          </div>

          {/* Keterangan */}
          <div className="mb-3">
            <label>Keterangan</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

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

        {/* Snackbar */}
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`toast align-items-center text-white ${
              toastSuccess ? "bg-success" : "bg-danger"
            } ${showToast ? "show" : ""}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">{toastMessage}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowToast(false)}
              ></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
