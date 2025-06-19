const db = require('../db/db');

// List all transactions
const getAllTransactions = async (req, res) => {
  const {
    item_name,
    borrower,
    condition,
    date,
    transaction_type,  // <-- added
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = `WHERE 1=1`;

  if (item_name) {
    whereClause += " AND i.name LIKE ?";
    params.push(`%${item_name}%`);
  }

  if (borrower) {
    whereClause += `
      AND (
        r.full_name LIKE ?
        OR it.borrower_name LIKE ?
      )
    `;
    params.push(`%${borrower}%`, `%${borrower}%`);
  }

  if (condition) {
    whereClause += " AND it.condition = ?";
    params.push(condition);
  }

  if (date) {
    whereClause += " AND DATE(it.created_at) = ?";
    params.push(date); // YYYY-MM-DD
  }

  // New: filter by transaction_type if provided
  if (transaction_type) {
    whereClause += " AND it.transaction_type = ?";
    params.push(transaction_type);
  }

  try {
    // 1. Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM inventory_transactions it
      LEFT JOIN inventory_items i ON i.id = it.item_id
      LEFT JOIN residents r ON r.id = it.borrower_id
      ${whereClause}
    `;
    const countResult = await db.get(countQuery, params);
    const total = countResult.total;

    // 2. Get paginated data
    const dataQuery = `
      SELECT it.*, i.name AS item_name, r.full_name AS borrower_name_resident
      FROM inventory_transactions it
      LEFT JOIN inventory_items i ON i.id = it.item_id
      LEFT JOIN residents r ON r.id = it.borrower_id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const paginatedParams = [...params, parseInt(limit), parseInt(offset)];
    const rows = await db.all(dataQuery, paginatedParams);

    res.json({
      data: rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new transaction (borrow or return)
const addTransaction = async (req, res) => {
  const {
    item_id,
    quantity,
    condition,
    location,
    description,
    borrower_type,
    borrower_id,
    borrower_name,
    transaction_type
  } = req.body;

  try {
    // Check quantity availability if borrow
    if (transaction_type === 'borrow') {
      const item = await db.get(`SELECT quantity FROM inventory_items WHERE id = ?`, [item_id]);
      if (!item || item.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient quantity in inventory' });
      }

      // Reduce inventory quantity
      await db.run(
        `UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?`,
        [quantity, item_id]
      );
    }

    if (transaction_type === 'return') {
      // Increase inventory quantity on return
      await db.run(
        `UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?`,
        [quantity, item_id]
      );
    }

    const stmt = `
      INSERT INTO inventory_transactions (
        item_id, quantity, condition, location, description,
        borrower_type, borrower_id, borrower_name, transaction_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.run(stmt, [
      item_id, quantity, condition, location, description,
      borrower_type, borrower_id || null, borrower_name || null, transaction_type
    ]);

    res.status(201).json({ message: 'Transaction recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTransactions,
  addTransaction
};
