const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/audit — read-only audit trail with filters (?action=&userId=&from=&to=)
// There are intentionally NO update or delete endpoints for audit records.
router.get('/', async (req, res) => {
  try {
    const { action, userId, from, to } = req.query;
    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }
    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { employeeId: true, name: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
    // Viewing the audit trail is itself an auditable event
    await logAudit({ userId: req.user.id, action: 'AUDIT_TRAIL_VIEWED', details: 'Audit trail accessed by administrator', req });
    return res.json({ success: true, data: logs, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
