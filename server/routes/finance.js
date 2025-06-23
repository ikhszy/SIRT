const express = require('express');
const router = express.Router();
const finance = require('../controllers/financeController');
const authMiddleware = require("../middleware/authMiddleware");

// INCOME
router.get('/income', authMiddleware, finance.getAllIncome);
router.get('/income/:id', authMiddleware, finance.getIncomeById);
router.post('/income', authMiddleware, finance.addIncome);
router.put('/income/:id', authMiddleware, finance.updateIncome);
router.delete('/income/:id', authMiddleware, finance.deleteIncome);

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

// DONATION HISTORY
router.get('/donations/:addressId', authMiddleware, finance.getAddressDonations);
router.get("/donations/summary", authMiddleware, finance.getDonationSummary);

console.log('finance.addIncome is:', finance.addIncome);

// FINANCE DASHBOARD SUMMARY
router.get('/summary', authMiddleware, finance.getFinanceSummary);
router.get('/iuran-summary', authMiddleware, finance.getIuranSummary);

// Finance Riwayat Iuran
router.get('/iuran/status', authMiddleware, finance.getMonthlyIuranStatus);

module.exports = router;
