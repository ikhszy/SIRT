const express = require('express');
const router = express.Router();
const finance = require('../controllers/financeController');

// INCOME
router.get('/income', finance.getAllIncome);
router.get('/income/:id', finance.getIncomeById);
router.post('/income', finance.addIncome);
router.put('/income/:id', finance.updateIncome);
router.delete('/income/:id', finance.deleteIncome);

// EXPENSE
router.get('/expense', finance.getAllExpense);
router.get('/expense/:id', finance.getExpenseById);
router.post('/expense', finance.addExpense);
router.put('/expense/:id', finance.updateExpense);
router.delete('/expense/:id', finance.deleteExpense);

// REPORT
router.get('/report', finance.financeReport);

// BULK IMPORT
router.get('/finance_import/preview', finance.previewFinanceImport);
router.get('/finance_import/import', finance.bulkFinanceImport);

module.exports = router;
