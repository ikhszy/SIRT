import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";
import { Link } from "react-router-dom";
import Pagination from '../../Components/Pagination';

export default function InventoryTransaction() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);

  const [formFilters, setFormFilters] = useState({
    item_name: "",
    borrower: "",
    condition: "",
    date: "",
  });
  const [filters, setFilters] = useState({
    item_name: "",
    borrower: "",
    condition: "",
    date: "",
  });

  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("borrow");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchAllTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append("limit", 1000);
      const res = await api.get(`/inventory-transactions?${queryParams.toString()}`);
      setAllTransactions(res.data.data);
    } catch (err) {
      console.error("Error fetching all transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisplayedTransactions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append("page", pageNum);
      queryParams.append("limit", itemsPerPage);
      queryParams.append("transaction_type", currentTab);

      const res = await api.get(`/inventory-transactions?${queryParams.toString()}`);
      setDisplayedTransactions(res.data.data);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "borrow") {
      fetchAllTransactions();
    }

    fetchDisplayedTransactions(1);
  }, [filters, currentTab, itemsPerPage]);

  const handleChange = (e) => {
    setFormFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setFilters({ ...formFilters });

    // Only fetch all if on borrow tab
    if (currentTab === "borrow") {
      fetchAllTransactions();
    }

    fetchDisplayedTransactions(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchDisplayedTransactions(newPage);
    }
  };

  const formatDate = (datetimeStr) => new Date(datetimeStr).toLocaleDateString("id-ID");

  const isReturned = (borrowTransaction) => {
    return allTransactions.some((t) => {
      return (
        t.transaction_type === "return" &&
        t.item_id === borrowTransaction.item_id &&
        t.quantity === borrowTransaction.quantity &&
        t.location === borrowTransaction.location &&
        ((borrowTransaction.borrower_type === "warga" &&
          t.borrower_id === borrowTransaction.borrower_id) ||
          (borrowTransaction.borrower_type !== "warga" &&
            t.borrower_name === borrowTransaction.borrower_name))
      );
    });
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 text-gray-800 mb-0">
            <i className="fas fa-history me-2"></i>Riwayat Transaksi Inventaris
          </h1>
          <Link to="/inventory-transaction/add" className="btn btn-success">
            <i className="fas fa-plus me-1"></i> Tambah Transaksi
          </Link>
        </div>

        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${currentTab === "borrow" ? "active" : ""}`}
              onClick={() => setCurrentTab("borrow")}
            >
              📦 Pinjam
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${currentTab === "return" ? "active" : ""}`}
              onClick={() => setCurrentTab("return")}
            >
              ↩️ Kembali
            </button>
          </li>
        </ul>

        <form onSubmit={handleFilter} className="row g-3 mb-4">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nama Barang"
              name="item_name"
              value={formFilters.item_name}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Peminjam"
              name="borrower"
              value={formFilters.borrower}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="condition"
              value={formFilters.condition}
              onChange={handleChange}
            >
              <option value="">-- Kondisi --</option>
              <option value="baik">Baik</option>
              <option value="rusak">Rusak</option>
              <option value="hilang">Hilang</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              name="date"
              value={formFilters.date}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Filter
            </button>
          </div>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-primary">
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Barang</th>
                  <th>Jumlah</th>
                  <th>Tipe</th>
                  <th>Peminjam</th>
                  <th>Kondisi</th>
                  <th>Lokasi</th>
                  <th>Keterangan</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.created_at)}</td>
                    <td>{t.item_name}</td>
                    <td>{t.quantity}</td>
                    <td>
                      <span
                        className={
                          t.transaction_type === "borrow"
                            ? "badge bg-warning text-dark"
                            : "badge bg-success"
                        }
                      >
                        {t.transaction_type === "borrow" ? "Pinjam" : "Kembali"}
                      </span>
                    </td>
                    <td>{t.borrower_display_name}</td>
                    <td>{t.condition}</td>
                    <td>{t.location}</td>
                    <td>{t.description || "-"}</td>
                    <td>
                      {t.transaction_type === "borrow" &&
                        (isReturned(t) ? (
                          <button className="btn btn-sm btn-secondary" disabled>
                            Dikembalikan
                          </button>
                        ) : (
                          <Link
                            to={`/inventory-transaction/return/${t.id}`}
                            state={{ transaction: t }}
                            className="btn btn-sm btn-success"
                          >
                            <i className="fas fa-undo me-1"></i>Kembalikan
                          </Link>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              {total === 0
                ? "Menampilkan 0 dari 0 data"
                : `Menampilkan ${(page - 1) * itemsPerPage + 1} - ${Math.min(
                    page * itemsPerPage,
                    total
                  )} dari ${total} data`}
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2">Data per halaman:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setPage(1);
                }}
                className="form-select form-select-sm"
                style={{ width: "auto" }}
              >
                {[5, 10, 25, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            <nav>
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                onPageChange={handlePageChange}
              />
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
