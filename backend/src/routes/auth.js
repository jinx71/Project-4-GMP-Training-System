const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && user.active && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
      await logAudit({ userId: user ? user.id : null, action: 'LOGIN_FAILED', details: `Failed login attempt for ${email}`, req });
      return res.status(401).json({ success: false, data: null, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
    await logAudit({ userId: user.id, action: 'LOGIN', details: `${user.employeeId} logged in`, req });

    const { passwordHash, ...safe } = user;
    return res.json({ success: true, data: { token, user: safe }, message: 'Login successful' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// POST /api/auth/logout — recorded for the audit trail
router.post('/logout', authenticate, async (req, res) => {
  await logAudit({ userId: req.user.id, action: 'LOGOUT', details: `${req.user.employeeId} logged out`, req });
  return res.json({ success: true, data: null, message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { passwordHash, ...safe } = req.user;
  return res.json({ success: true, data: safe, message: 'OK' });
});

module.exports = router;
