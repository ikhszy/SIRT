const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require("../middleware/authMiddleware");

router.get('/', authMiddleware, usersController.getAllUsers);
router.post('/', authMiddleware, usersController.addUser);
router.get('/:id', authMiddleware, usersController.getUserById);
router.put('/:id', authMiddleware, usersController.updateUser);
router.delete('/:id', authMiddleware, usersController.deleteUser);

module.exports = router;