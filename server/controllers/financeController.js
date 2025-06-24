const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.resolve(__dirname, "../db/community.sqlite");
const db = new sqlite3.Database(dbPath);
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // switched to in-memory
const xlsx = require("xlsx");

// Helper to get current datetime
const getNow = () => new Date().toISOString();

// format date filter
const formatDateForFilter = (dateStr) => {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`; // YYYY-MM-DD
};

// --- INCOME ---

exports.getAllIncome = (req, res) => {
  const sql = `
    SELECT income.*, residents.full_name as residentName
    FROM income
    LEFT JOIN residents ON income.residentId = residents.id
    WHERE income.status = 'A'
    ORDER BY income.transactionDate DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getIncomeById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      i.*, 
      r.full_name
    FROM income i
    LEFT JOIN residents r ON i.residentId = r.id
    WHERE i.id = ? AND i.status = 'A'
  `;

  db.get(sql, [id], (err, incomeRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!incomeRow) return res.status(404).json({ error: 'Income not found' });

    // Now fetch donation months if it's iuran
    const donationSql = `
      SELECT month FROM donation_history
      WHERE 
        income_id = ? AND status = 'A'
    `;

    db.all(donationSql, [id], (monthErr, rows) => {
      if (monthErr) return res.status(500).json({ error: monthErr.message });

      // Convert YYYY-MM → MM-YYYY
      const months = rows.map(row => {
        const [year, month] = row.month.split('-');
        return `${month}-${year}`;
      });

      incomeRow.months = months;
      res.json(incomeRow);
    });
  });
};



exports.addIncome = (req, res) => {
  const {
    addressId,
    residentId,
    remarks,
    months = [],
  } = req.body;

  const transactionAmount = req.body.transactionAmount ?? req.body.nominal;
  const transactionDate = req.body.transactionDate ?? req.body.tanggal;

  if (!transactionAmount || !transactionDate) {
    return res.status(400).json({ error: 'Missing required fields: nominal / tanggal' });
  }

  const now = getNow();
  const isDonation = !!addressId;
  const numericAddressId = addressId ? Number(addressId) : null;

  if (isDonation && isNaN(numericAddressId)) {
    return res.status(400).json({ error: 'Invalid address ID' });
  }

  let finalRemarks = remarks;

  const insertDonationHistory = (incomeId, transactionAmount, transactionDate, callback) => {
  if (!months.length) return callback();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO donation_history
    (address_id, month, amount, date_paid, created_at, updated_at, status, income_id)
    VALUES (?, ?, ?, ?, ?, ?, 'A', ?)
  `);

  months.forEach((month) => {
    const parts = month.split('-');
    const normalizedMonth = parts.length === 2 ? `${parts[1]}-${parts[0].padStart(2, '0')}` : month;

    stmt.run(
      numericAddressId,
      normalizedMonth,
      transactionAmount,
      transactionDate,
      now,
      now,
      incomeId // ✅ new field
    );
  });

  stmt.finalize(callback);
};

  const insertIncome = () => {
    const sql = `
      INSERT INTO income (
        residentId,
        addressId,
        remarks,
        transactionAmount,
        transactionDate,
        date_created,
        date_modified,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'A')
    `;

    db.run(
      sql,
      [
        residentId || null,
        numericAddressId || null,
        finalRemarks,
        transactionAmount,
        transactionDate,
        now,
        now,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (isDonation) {
          insertDonationHistory(this.lastID, transactionAmount, transactionDate, () =>
            res.json({ id: this.lastID })
          );
        } else {
          res.json({ id: this.lastID });
        }
      }
    );
  };

  if (isDonation) {
    const sql = `SELECT full_address FROM address WHERE id = ?`;

    db.get(sql, [numericAddressId], (err, row) => {
      if (err || !row) return res.status(400).json({ error: 'Address not found' });

      finalRemarks = `Iuran - ${row.full_address}`;

      // Check for duplicate iuran payment
      const monthCheck = months[0];
      const [m, y] = monthCheck.split('-');
      const normalizedMonth = `${y}-${m.padStart(2, '0')}`;

      const checkSql = `
        SELECT id FROM donation_history 
        WHERE address_id = ? AND month = ? AND status = 'A'
      `;

      db.get(checkSql, [numericAddressId, normalizedMonth], (err2, existing) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (existing) {
          return res.status(400).json({ error: `Pembayaran bulan ini sudah lunas untuk alamat ${row.full_address}` });
        }

        // Proceed only if no duplicate
        insertIncome();
      });
    });
  } else {
    insertIncome();
  }
};

exports.updateIncome = (req, res) => {
  const { id } = req.params;
  const {
    addressId,
    residentId,
    remarks,
    months = [],
  } = req.body;

  const transactionAmount = req.body.transactionAmount ?? req.body.nominal;
  const transactionDate = req.body.transactionDate ?? req.body.tanggal;
  const now = getNow();

  let finalRemarks = remarks;

  const newMonth = Array.isArray(months) && months.length > 0 ? months[0] : null;

  let normalizedMonth = null;
  if (newMonth) {
    const parts = newMonth.split('-');
    if (parts.length === 2) {
      normalizedMonth = `${parts[1]}-${parts[0].padStart(2, '0')}`;
    }
  }

  // Fetch original income
  const originalSql = `SELECT addressId FROM income WHERE id = ? AND status = 'A'`;
  db.get(originalSql, [id], (err, original) => {
    if (err || !original) return res.status(400).json({ error: 'Original income not found' });

    const originalAddressId = original.addressId;
    const isAddressChanged = addressId != originalAddressId;
    const isMonthChanged = true;

    // Validate duplicate if needed
    const checkDuplicateAndProceed = () => {
      if (!normalizedMonth) return performUpdate();

      if (isAddressChanged || isMonthChanged) {
        const checkSql = `
          SELECT d.id, a.full_address 
          FROM donation_history d
          JOIN address a ON a.id = d.address_id
          WHERE d.address_id = ? 
            AND d.month = ? 
            AND d.status = 'A'
            AND d.income_id != ?
        `;
        db.get(checkSql, [addressId, normalizedMonth, id], (checkErr, existing) => {
          if (checkErr) return res.status(500).json({ error: checkErr.message });

          if (existing) {
            return res.status(400).json({
              error: `Pembayaran bulan ini sudah lunas untuk alamat ${existing.full_address}`
            });
          }

          performUpdate();
        });
      } else {
        performUpdate();
      }
    };

    // Always fetch full_address for remarks
    if (addressId) {
      const addressSql = `SELECT full_address FROM address WHERE id = ?`;
      db.get(addressSql, [addressId], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'Address not found' });
        finalRemarks = `Iuran - ${row.full_address}`;
        checkDuplicateAndProceed();
      });
    } else {
      checkDuplicateAndProceed();
    }
  });

  const updateDonationHistory = (callback) => {
    if (!addressId || !months.length) return callback();

    const softDeleteSql = `
      UPDATE donation_history SET status = 'D', date_modified = ?
      WHERE address_id = ? AND income_id = ?
    `;
    db.run(softDeleteSql, [now, addressId, id], (err) => {
      if (err) return callback(err);

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO donation_history
        (address_id, month, created_at, updated_at, status, income_id)
        VALUES (?, ?, ?, ?, 'A', ?)
      `);
      months.forEach(month => {
        stmt.run([addressId, month, now, now, id]);
      });
      stmt.finalize(callback);
    });
  };

  const performUpdate = () => {
    const sql = `
      UPDATE income
      SET residentId = ?, remarks = ?, transactionAmount = ?, transactionDate = ?, date_modified = ?
      WHERE id = ? AND status = 'A'
    `;
    db.run(sql, [residentId || null, finalRemarks, transactionAmount, transactionDate, now, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (addressId) {
        updateDonationHistory((err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ updated: this.changes });
        });
      } else {
        res.json({ updated: this.changes });
      }
    });
  };
};

exports.deleteIncome = (req, res) => {
  const { id } = req.params;
  const now = getNow();

  const getAddressSql = `SELECT addressId FROM income WHERE id = ?`;
  db.get(getAddressSql, [id], (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Income not found or DB error' });

    const { addressId } = row;

    const updateIncomeSql = `UPDATE income SET status = 'D', date_modified = ? WHERE id = ?`;
    db.run(updateIncomeSql, [now, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Soft delete donation history if this was an iuran
      if (addressId) {
        const updateDonationSql = `
          UPDATE donation_history
          SET status = 'D', updated_at = ?
          WHERE address_id = ? AND status = 'A'
        `;
        db.run(updateDonationSql, [now, addressId], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ deleted: this.changes });
        });
      } else {
        return res.json({ deleted: this.changes });
      }
    });
  });
};

// --- EXPENSE ---

exports.getAllExpense = (req, res) => {
  const sql = `SELECT * FROM expense WHERE status = 'A' ORDER BY transactionDate DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getExpenseById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM expense WHERE id = ? AND status = 'A'`;
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(row);
  });
};

exports.addExpense = (req, res) => {
  const { remarks, transactionAmount, transactionDate } = req.body;
  const now = getNow();

  const sql = `
    INSERT INTO expense (remarks, transactionAmount, transactionDate, date_created, date_modified, status)
    VALUES (?, ?, ?, ?, ?, 'A')
  `;
  db.run(sql, [remarks, transactionAmount, transactionDate, now, now], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
};

exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const { remarks, transactionAmount, transactionDate } = req.body;
  const now = getNow();

  const sql = `
    UPDATE expense
    SET remarks = ?, transactionAmount = ?, transactionDate = ?, date_modified = ?
    WHERE id = ? AND status = 'A'
  `;
  db.run(sql, [remarks, transactionAmount, transactionDate, now, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const now = getNow();
  const sql = `
    UPDATE expense SET status = 'D', date_modified = ? WHERE id = ?
  `;
  db.run(sql, [now, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};

// --- FINANCE REPORT ---

exports.financeReport = (req, res) => {
  const { startDate, endDate, remarks = '', status = '' } = req.query;

  const filters = [];
  const params = [];

  if (startDate) {
    filters.push(`transactionDate >= ?`);
    params.push(startDate);
  }
  if (endDate) {
    filters.push(`transactionDate <= ?`);
    params.push(endDate);
  }
  if (remarks) {
    filters.push(`remarks LIKE ?`);
    params.push(`%${remarks}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  let results = [];

  function getIncome(cb) {
    if (status && status !== 'income') return cb(null, []);
    const sql = `
      SELECT id, transactionDate, remarks, transactionAmount, 'income' AS status
      FROM income
      ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'A'
    `;
    db.all(sql, [...params], (err, rows) => {
      if (err) return cb(err);
      cb(null, rows);
    });
  }

  function getExpense(cb) {
    if (status && status !== 'expense') return cb(null, []);
    const sql = `
      SELECT id, transactionDate, remarks, transactionAmount, 'expense' AS status
      FROM expense
      ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'A'
    `;
    db.all(sql, [...params], (err, rows) => {
      if (err) return cb(err);
      cb(null, rows);
    });
  }

  getIncome((err, incomeRows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch income data' });
    getExpense((err, expenseRows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch expense data' });
      results = incomeRows.concat(expenseRows);
      results.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
      res.json(results);
    });
  });
};

// --- PREVIEW UPLOAD ---

exports.previewFinanceImport = [
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const errors = [];
    const preview = [];

    data.forEach((row, index) => {
      const type = (row["Type"] || "").toLowerCase();
      const amount = parseFloat(row["Amount"]);
      const dateRaw = row["Date"];
      const date = new Date(dateRaw);
      const remarks = row["Remarks"] || "";
      const residentId = row["Resident ID"] || null;

      if (!type || !["income", "expense"].includes(type)) {
        errors.push({ row: index + 2, message: "Invalid Type", data: row });
        return;
      }

      if (!amount || isNaN(amount)) {
        errors.push({ row: index + 2, message: "Invalid Amount", data: row });
        return;
      }

      if (!dateRaw || isNaN(date)) {
        errors.push({ row: index + 2, message: "Invalid Date", data: row });
        return;
      }

      preview.push({
        type,
        transactionAmount: amount,
        transactionDate: date.toISOString().split('T')[0],
        remarks,
        residentId
      });
    });

    return res.json({ success: true, data: preview, errors });
  }
];

// --- IMPORT TO DB ---

exports.bulkFinanceImport = [
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const now = getNow();
    const inserted = [];
    const errors = [];

    const insertNext = (index) => {
      if (index >= data.length) {
        return res.json({ success: true, inserted, errors });
      }

      const row = data[index];
      const tanggalStr = row["Tanggal"];
      const kategori = (row["Kategori"] || "").toLowerCase();
      const amount = parseFloat(row["Nominal"]);
      const remarks = row["Keterangan"] || "";
      const jenisPendapatan = row["Jenis Pendapatan"]?.trim();
      const bulanStr = row["Bulan"] || "";
      const addressText = row["Alamat"]?.trim();

      const dateParts = tanggalStr?.split("-");
      const tanggal = dateParts?.length === 3 ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`) : null;
      const formattedDate = tanggal?.toISOString().split("T")[0];

      if (!["pendapatan", "pengeluaran"].includes(kategori) || isNaN(amount) || !formattedDate) {
        errors.push({ row: index + 2, message: "Invalid fields", data: row });
        return insertNext(index + 1);
      }

      const isIncome = kategori === "pendapatan";
      const isIuran = jenisPendapatan?.toLowerCase() === "iuran";

      const proceedInsert = (addressId = null) => {
        const dupCheckSql = isIncome
          ? `SELECT id FROM income WHERE transactionDate = ? AND transactionAmount = ? AND remarks = ? AND status = 'A'`
          : `SELECT id FROM expense WHERE transactionDate = ? AND transactionAmount = ? AND remarks = ? AND status = 'A'`;

        db.get(dupCheckSql, [formattedDate, amount, remarks], (err, existing) => {
          if (err) {
            errors.push({ row: index + 2, message: err.message, data: row });
            return insertNext(index + 1);
          }

          if (existing) {
            errors.push({ row: index + 2, message: "Duplicate record", data: row });
            return insertNext(index + 1);
          }

          // INSERT INCOME or EXPENSE
          const insertSql = isIncome
            ? `INSERT INTO income (residentId, addressId, remarks, transactionAmount, transactionDate, date_created, date_modified, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'A')`
            : `INSERT INTO expense (remarks, transactionAmount, transactionDate, date_created, date_modified, status)
               VALUES (?, ?, ?, ?, ?, 'A')`;

          const insertParams = isIncome
            ? [null, addressId, remarks, amount, formattedDate, now, now]
            : [remarks, amount, formattedDate, now, now];

          db.run(insertSql, insertParams, function (err) {
            if (err) {
              errors.push({ row: index + 2, message: err.message, data: row });
              return insertNext(index + 1);
            }

            // INSERT INTO donation_history if Iuran
            if (isIncome && isIuran && addressId && bulanStr) {
              const donationMonth = bulanStr.trim(); // format: MM-YYYY
              const dupDonationSql = `SELECT id FROM donation_history WHERE address_id = ? AND bulan = ?`;

              db.get(dupDonationSql, [addressId, donationMonth], (err, found) => {
                if (!err && !found) {
                  db.run(
                    `INSERT INTO donation_history (address_id, bulan, created_at) VALUES (?, ?, ?)`,
                    [addressId, donationMonth, now],
                    () => {} // silent insert, no wait
                  );
                }
                inserted.push({ row: index + 2, id: this.lastID });
                insertNext(index + 1);
              });
            } else {
              inserted.push({ row: index + 2, id: this.lastID });
              insertNext(index + 1);
            }
          });
        });
      };

      // Resolve addressId if needed
      if (isIncome && isIuran) {
        if (!addressText) {
          errors.push({ row: index + 2, message: "Alamat kosong untuk Iuran", data: row });
          return insertNext(index + 1);
        }
        db.get(`SELECT id FROM address WHERE full_address = ?`, [addressText], (err, row) => {
          if (err || !row) {
            errors.push({ row: index + 2, message: "Alamat tidak ditemukan", data: row });
            return insertNext(index + 1);
          }
          proceedInsert(row.id);
        });
      } else {
        proceedInsert(); // no address needed
      }
    };

    insertNext(0);
  }
];

// IURAN HISTORY

const dayjs = require('dayjs');

exports.getAddressDonations = (req, res) => {
  const { addressId } = req.params;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    return {
      month: `${monthNum.toString().padStart(2, '0')}-${currentYear}`,
      status: 'pending'
    };
  });

  const sql = `
    SELECT month
    FROM donation_history
    WHERE address_id = ? AND status = 'A'
  `;

  db.all(sql, [addressId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const paidMonths = rows.map(r => r.month);

    const finalData = monthsOfYear.map(entry => {
      if (paidMonths.includes(entry.month)) {
        return { ...entry, status: 'paid' };
      } else {
        const [mm, yyyy] = entry.month.split('-').map(Number);
        if (yyyy < currentYear || (yyyy === currentYear && mm < currentMonth)) {
          return { ...entry, status: 'late' };
        }
        return entry; // already 'pending'
      }
    });

    res.json(finalData);
  });
};

exports.getDonationSummary = (req, res) => {
  const sql = `
    SELECT
      a.full_address AS address,
      d.month,
      d.date_created
    FROM donation_history d
    LEFT JOIN address a ON d.address_id = a.id
    WHERE d.status = 'A'
    ORDER BY d.month DESC, a.full_address ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('[getDonationSummary] Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, data: rows });
  });
};

exports.getFinanceSummary = (req, res) => {
  const { type = 'income', groupBy = 'monthly' } = req.query;
  const table = type === 'expense' ? 'expense' : 'income';

  let dateFormat;
  if (groupBy === 'daily') dateFormat = "%Y-%m-%d";
  else if (groupBy === 'yearly') dateFormat = "%Y";
  else dateFormat = "%Y-%m"; // default monthly

  const sql = `
    SELECT 
      strftime('${dateFormat}', transactionDate) as period,
      SUM(transactionAmount) as total
    FROM ${table}
    WHERE status = 'A'
    GROUP BY period
    ORDER BY period ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getIuranSummary = (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0'); // '06'
  const targetMonth = `${year}-${monthStr}`; // '2025-06'

  const totalSql = `SELECT COUNT(*) as total FROM address`;
  const paidSql = `
    SELECT COUNT(DISTINCT address_id) as paid
    FROM donation_history
    WHERE status = 'A' AND month = ?
  `;

  db.get(totalSql, [], (err, totalRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(paidSql, [targetMonth], (err2, paidRow) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        total: totalRow.total,
        paid: paidRow.paid,
        unpaid: totalRow.total - paidRow.paid
      });
    });
  });
};

exports.getMonthlyIuranStatus = (req, res) => {
  const { month, year, addressId } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });

  const formattedMonth = `${year}-${month.padStart(2, '0')}`;
  const params = [formattedMonth];
  let filterClause = '';

  if (addressId) {
    filterClause = 'WHERE a.id = ?';
    params.push(addressId);
  }

  const sql = `
    SELECT 
      a.id as addressId,
      a.full_address AS address,
      dh.month IS NOT NULL AS paid
    FROM address a
    LEFT JOIN donation_history dh 
      ON a.id = dh.address_id 
      AND dh.month = ? 
      AND dh.status = 'A'
    ${filterClause}
    ORDER BY a.full_address ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = rows.map(row => ({
      address: row.address,
      status: row.paid ? 'paid' : 'unpaid'
    }));

    res.json(result);
  });
};
