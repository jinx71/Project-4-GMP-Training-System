const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireMinLevel } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/reports/users/:id — STC+ full training report for any user (report access itself is audited)
router.get('/users/:id', requireMinLevel('STC'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, employeeId: true, name: true, email: true, role: true, department: true }
    });
    if (!user) return res.status(404).json({ success: false, data: null, message: 'User not found' });

    const assignments = await prisma.trainingAssignment.findMany({
      where: { userId: user.id },
      include: { training: { select: { code: true, title: true, sopReference: true } }, assignedBy: { select: { name: true } } },
      orderBy: { assignedAt: 'desc' }
    });
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId: user.id },
      include: {
        assessment: { include: { training: { select: { code: true, title: true } } } },
        evaluatedBy: { select: { name: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    await logAudit({
      userId: req.user.id, action: 'REPORT_VIEWED', entity: 'User', entityId: user.id,
      details: `Training report viewed for ${user.employeeId} (${user.name})`, req
    });
    return res.json({ success: true, data: { user, assignments, attempts }, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
