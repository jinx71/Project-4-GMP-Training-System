const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireMinLevel } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/trainings — DTC and above define training modules
router.post('/', requireMinLevel('DTC'), async (req, res) => {
  try {
    const { code, title, description, sopReference, department } = req.body;
    if (!code || !title || !description || !department) {
      return res.status(400).json({ success: false, data: null, message: 'code, title, description and department are required' });
    }
    const training = await prisma.training.create({ data: { code, title, description, sopReference, department } });
    await logAudit({
      userId: req.user.id, action: 'TRAINING_CREATED', entity: 'Training', entityId: training.id,
      details: `${training.code} — ${training.title}`, req
    });
    return res.status(201).json({ success: true, data: training, message: 'Training created' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, data: null, message: 'Training code already exists' });
    }
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/trainings — visible to all training-hierarchy roles
router.get('/', requireMinLevel('USER'), async (req, res) => {
  try {
    const trainings = await prisma.training.findMany({
      include: { assessments: { select: { id: true, title: true, scheduledFrom: true, scheduledTo: true } } },
      orderBy: { code: 'asc' }
    });
    return res.json({ success: true, data: trainings, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
