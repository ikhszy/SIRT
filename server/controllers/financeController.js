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
    SELECT i.*, r.full_name FROM income i
    LEFT JOIN residents r ON i.residentId = r.id
    WHERE i.id = ? AND i.status = 'A'
  `;
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Income not found' });
    res.json(row);
  });
};

exports.addIncome = (req, res) => {
  const { residentId, transactionAmount, transactionDate } = req.body;
  const isDonation = !!residentId;
  const now = getNow();
  let remarks = req.body.remarks;

  if (isDonation) {
    const sql = `SELECT full_name FROM residents WHERE id = ?`;
    db.get(sql, [residentId], (err, row) => {
      if (err || !row) return res.status(400).json({ error: 'Resident not found' });
      remarks = `Donation - ${row.full_name}`;
      insertIncome();
    });
  } else {
    insertIncome();
  }

  function insertIncome() {
    const insertSql = `
      INSERT INTO income (residentId, remarks, transactionAmount, transactionDate, date_created, date_modified, status)
      VALUES (?, ?, ?, ?, ?, ?, 'A')
    `;
    db.run(insertSql, [residentId || null, remarks, transactionAmount, transactionDate, now, now], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  }
};

exports.updateIncome = (req, res) => {
  const { id } = req.params;
  const { residentId, remarks, transactionAmount, transactionDate } = req.body;
  const now = getNow();

  const sql = `
    UPDATE income
    SET residentId = ?, remarks = ?, transactionAmount = ?, transactionDate = ?, date_modified = ?
    WHERE id = ? AND status = 'A'
  `;
  db.run(sql, [residentId || null, remarks, transactionAmount, transactionDate, now, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.deleteIncome = (req, res) => {
  const { id } = req.params;
  const now = getNow();
  const sql = `
    UPDATE income SET status = 'D', date_modified = ? WHERE id = ?
  `;
  db.run(sql, [now, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
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
      const type = (row["Type"] || "").toLowerCase();
      const amount = parseFloat(row["Amount"]);
      const dateRaw = row["Date"];
      const date = new Date(dateRaw);
      const remarks = row["Remarks"] || "";
      const residentId = row["Resident ID"] || null;

      if (!type || !["income", "expense"].includes(type) || isNaN(amount) || isNaN(date)) {
        errors.push({ row: index + 2, message: "Invalid fields", data: row });
        return insertNext(index + 1);
      }

      const formattedDate = date.toISOString().split('T')[0];

      // Basic duplication check
      const dupCheckSql = type === 'income'
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

        const insertSql = type === 'income'
          ? `INSERT INTO income (residentId, remarks, transactionAmount, transactionDate, date_created, date_modified, status)
             VALUES (?, ?, ?, ?, ?, ?, 'A')`
          : `INSERT INTO expense (remarks, transactionAmount, transactionDate, date_created, date_modified, status)
             VALUES (?, ?, ?, ?, ?, 'A')`;

        const insertParams = type === 'income'
          ? [residentId || null, remarks, amount, formattedDate, now, now]
          : [remarks, amount, formattedDate, now, now];

        db.run(insertSql, insertParams, function (err) {
          if (err) {
            errors.push({ row: index + 2, message: err.message, data: row });
          } else {
            inserted.push({ row: index + 2, id: this.lastID });
          }
          insertNext(index + 1);
        });
      });
    };

    insertNext(0);
  }
];
