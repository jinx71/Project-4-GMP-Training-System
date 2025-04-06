const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/users — Administrator creates a user account
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { employeeId, name, email, password, role, department } = req.body;
    if (!employeeId || !name || !email || !password || !role || !department) {
      return res.status(400).json({ success: false, data: null, message: 'All fields are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { employeeId, name, email, passwordHash, role, department }
    });
    await logAudit({
      userId: req.user.id, action: 'USER_CREATED', entity: 'User', entityId: user.id,
      details: `Created ${user.employeeId} (${user.name}) with role ${user.role}`, req
    });
    const { passwordHash: _, ...safe } = user;
    return res.status(201).json({ success: true, data: safe, message: 'User created' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, data: null, message: 'Employee ID or email already exists' });
    }
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/users — Admin (account management) and DTC/STC (assignment targets) need the user list.
router.get('/', async (req, res) => {
  try {
    const allowed = ['ADMIN', 'DTC', 'STC'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, data: null, message: 'Insufficient role permissions' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, employeeId: true, name: true, email: true, role: true, department: true, active: true, createdAt: true },
      orderBy: { employeeId: 'asc' }
    });
    return res.json({ success: true, data: users, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// PATCH /api/users/:id/role — Administrator sets a user role; old → new value is audited.
router.patch('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ success: false, data: null, message: 'User not found' });

    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    await logAudit({
      userId: req.user.id, action: 'USER_ROLE_CHANGED', entity: 'User', entityId: user.id,
      details: `${user.employeeId}: role ${before.role} -> ${role}`, req
    });
    const { passwordHash, ...safe } = user;
    return res.json({ success: true, data: safe, message: 'Role updated' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
