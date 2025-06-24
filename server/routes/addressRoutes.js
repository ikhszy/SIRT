const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const addressController = require('../controllers/addressController');

// Routes with controller delegation
router.get("/check-duplicate", addressController.checkDuplicateAddress);
router.get("/", authMiddleware, addressController.getAllAddresses);
router.get("/:id", authMiddleware, addressController.getAddressById);
router.post("/", authMiddleware, addressController.createAddress);
router.put("/:id", authMiddleware, addressController.updateAddress);
router.delete("/:id", authMiddleware, addressController.deleteAddress);

module.exports = router;
