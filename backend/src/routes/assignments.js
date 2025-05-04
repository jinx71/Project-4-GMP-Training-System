const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireMinLevel } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/assignments — DTC+ assigns a training to one user or a group of users
router.post('/', requireMinLevel('DTC'), async (req, res) => {
  try {
    const { trainingId, userIds, dueDate } = req.body;
    if (!trainingId || !Array.isArray(userIds) || userIds.length === 0 || !dueDate) {
      return res.status(400).json({ success: false, data: null, message: 'trainingId, userIds[] and dueDate are required' });
    }
    const training = await prisma.training.findUnique({ where: { id: trainingId } });
    if (!training) return res.status(404).json({ success: false, data: null, message: 'Training not found' });

    const created = [];
    for (const userId of userIds) {
      // skipDuplicates not used so each assignment is individually audited
      const existing = await prisma.trainingAssignment.findUnique({
        where: { trainingId_userId: { trainingId, userId } }
      });
      if (existing) continue;
      const assignment = await prisma.trainingAssignment.create({
        data: { trainingId, userId, assignedById: req.user.id, dueDate: new Date(dueDate) },
        include: { user: { select: { employeeId: true, name: true } } }
      });
      created.push(assignment);
      await logAudit({
        userId: req.user.id, action: 'TRAINING_ASSIGNED', entity: 'TrainingAssignment', entityId: assignment.id,
        details: `${training.code} assigned to ${assignment.user.employeeId} (${assignment.user.name}), due ${new Date(dueDate).toISOString()}`, req
      });
    }
    return res.status(201).json({ success: true, data: created, message: `${created.length} assignment(s) created` });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/assignments/me — the logged-in user's Completed / Assigned / Pending trainings
router.get('/me', requireMinLevel('USER'), async (req, res) => {
  try {
    const assignments = await prisma.trainingAssignment.findMany({
      where: { userId: req.user.id },
      include: {
        training: { include: { assessments: { select: { id: true, title: true, scheduledFrom: true, scheduledTo: true } } } },
        assignedBy: { select: { name: true, employeeId: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });
    return res.json({ success: true, data: assignments, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/assignments — DTC+ overview of all users' training status (filter: ?department=&status=)
router.get('/', requireMinLevel('DTC'), async (req, res) => {
  try {
    const { department, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (department) where.user = { department };

    const assignments = await prisma.trainingAssignment.findMany({
      where,
      include: {
        training: { select: { code: true, title: true } },
        user: { select: { employeeId: true, name: true, department: true } },
        assignedBy: { select: { name: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });
    return res.json({ success: true, data: assignments, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
