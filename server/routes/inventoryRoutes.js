const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');

router.post('/inventory-import/preview', controller.previewInventoryImport);
router.post('/inventory-import/bulk', controller.bulkImportInventory);
router.get('/', controller.getAllInventory);
router.get('/:id', controller.getInventoryById);
router.post('/', controller.addInventory);
router.put('/:id', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);

module.exports = router;
