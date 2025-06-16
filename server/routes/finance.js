const express = require('express');
const router = express.Router();
const finance = require('../controllers/financeController');
const authMiddleware = require("../middleware/authMiddleware");

// INCOME
router.get('/income', finance.getAllIncome);
router.get('/income/:id', finance.getIncomeById);
router.post('/income', finance.addIncome);
router.put('/income/:id', finance.updateIncome);
router.delete('/income/:id', finance.deleteIncome);

// EXPENSE
router.get('/expense', authMiddleware, finance.getAllExpense);
router.get('/expense/:id', authMiddleware, finance.getExpenseById);
router.post('/expense', authMiddleware, finance.addExpense);
router.put('/expense/:id', authMiddleware, finance.updateExpense);
router.delete('/expense/:id', authMiddleware, finance.deleteExpense);

// REPORT
router.get('/report', authMiddleware, authMiddleware, finance.financeReport);

// BULK IMPORT
router.get('/finance_import/preview', authMiddleware, finance.previewFinanceImport);
router.get('/finance_import/import', authMiddleware, finance.bulkFinanceImport);

module.exports = router;
