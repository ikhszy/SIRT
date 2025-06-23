const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/', donationController.createDonation);
router.get('/history/:addressId', donationController.getDonationHistoryByAddress);
router.get('/report', donationController.getDonationReport);

module.exports = router;
