const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireMinLevel, ROLE_LEVELS } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const TYPES = ['SUBMIT_REMINDER', 'EVALUATE_REMINDER', 'DTC_TRAINING_NOTICE', 'TRAINING_INFO'];

// POST /api/notifications — DTC notifies trainers/users; STC notifies DTCs
router.post('/', requireMinLevel('DTC'), async (req, res) => {
  try {
    const { recipientIds, type, message } = req.body;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0 || !TYPES.includes(type) || !message) {
      return res.status(400).json({ success: false, data: null, message: `recipientIds[], message and a valid type (${TYPES.join(', ')}) are required` });
    }
    // Only the STC may notify DTCs
    if (type === 'DTC_TRAINING_NOTICE' && ROLE_LEVELS[req.user.role] < ROLE_LEVELS.STC) {
      return res.status(403).json({ success: false, data: null, message: 'Only the Site Training Coordinator can notify DTCs' });
    }

    const created = [];
    for (const recipientId of recipientIds) {
      const n = await prisma.notification.create({
        data: { recipientId, senderId: req.user.id, type, message },
        include: { recipient: { select: { employeeId: true, name: true } } }
      });
      created.push(n);
      await logAudit({
        userId: req.user.id, action: 'NOTIFICATION_SENT', entity: 'Notification', entityId: n.id,
        details: `${type} sent to ${n.recipient.employeeId} (${n.recipient.name}): ${message}`, req
      });
    }
    return res.status(201).json({ success: true, data: created, message: `${created.length} notification(s) sent` });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/notifications/me
router.get('/me', requireMinLevel('USER'), async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: notifications, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireMinLevel('USER'), async (req, res) => {
  try {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n || n.recipientId !== req.user.id) {
      return res.status(404).json({ success: false, data: null, message: 'Notification not found' });
    }
    const updated = await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
    return res.json({ success: true, data: updated, message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
