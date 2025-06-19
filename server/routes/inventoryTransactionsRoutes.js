const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryTransactionsController');

router.get('/', controller.getAllTransactions);
router.post('/', controller.addTransaction);

module.exports = router;
