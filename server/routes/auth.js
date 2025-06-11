// routes/auth.js (or directly in your main app file)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const SUPER_ADMIN = {
  username: 'super_admin',
  password: '123'  // ← make sure this matches your frontend
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
    res.json({ success: true, token: 'super_token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

module.exports = router;