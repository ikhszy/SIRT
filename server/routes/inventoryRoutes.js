const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');

router.get('/', controller.getAllInventory);
router.get('/:id', controller.getInventoryById);
router.post('/', controller.addInventory);
router.put('/:id', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);
router.post('/inventory-import', controller.bulkImportInventory);
router.post('/inventory-import/preview', controller.previewInventoryImport);

module.exports = router;
