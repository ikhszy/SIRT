// server/routes/introLettersRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/introLettersController');

router.get('/', authMiddleware, controller.getAllLetters);
router.get('/:id', authMiddleware, controller.getLetterById);
router.post('/', authMiddleware, controller.createLetter);
router.put('/:id/status', controller.updateLetterStatus);

module.exports = router;
