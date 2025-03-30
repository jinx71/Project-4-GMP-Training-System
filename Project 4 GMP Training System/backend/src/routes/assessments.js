const express = require('express');
const prisma = require('../lib/prisma');
const { logAudit } = require('../lib/audit');
const { authenticate, requireMinLevel } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/assessments — Trainer+ sets questions and the assessment schedule
router.post('/', requireMinLevel('TRAINER'), async (req, res) => {
  try {
    const { trainingId, title, passMarkPct, scheduledFrom, scheduledTo, questions } = req.body;
    if (!trainingId || !title || !scheduledFrom || !scheduledTo || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'trainingId, title, schedule window and questions[] are required' });
    }
    const assessment = await prisma.assessment.create({
      data: {
        trainingId,
        title,
        passMarkPct: passMarkPct || 80,
        scheduledFrom: new Date(scheduledFrom),
        scheduledTo: new Date(scheduledTo),
        createdById: req.user.id,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            marks: q.marks || 1
          }))
        }
      },
      include: { questions: true, training: { select: { code: true } } }
    });
    await logAudit({
      userId: req.user.id, action: 'ASSESSMENT_CREATED', entity: 'Assessment', entityId: assessment.id,
      details: `"${assessment.title}" for ${assessment.training.code}, ${assessment.questions.length} questions, window ${assessment.scheduledFrom.toISOString()} to ${assessment.scheduledTo.toISOString()}`, req
    });
    return res.status(201).json({ success: true, data: assessment, message: 'Assessment created' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/assessments/:id — exam paper for a user; correct answers are never sent to the client
router.get('/:id', requireMinLevel('USER'), async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        training: { select: { code: true, title: true } },
        questions: { select: { id: true, text: true, options: true, marks: true } }
      }
    });
    if (!assessment) return res.status(404).json({ success: false, data: null, message: 'Assessment not found' });
    return res.json({ success: true, data: assessment, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// POST /api/assessments/:id/attempts — user submits an exam; auto-scored, then awaits trainer evaluation
router.post('/:id/attempts', requireMinLevel('USER'), async (req, res) => {
  try {
    const { answers } = req.body; // array of selected option indexes
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { questions: true, training: true }
    });
    if (!assessment) return res.status(404).json({ success: false, data: null, message: 'Assessment not found' });

    const now = new Date();
    if (now < assessment.scheduledFrom || now > assessment.scheduledTo) {
      return res.status(400).json({ success: false, data: null, message: 'Assessment is outside its scheduled window' });
    }

    const assignment = await prisma.trainingAssignment.findUnique({
      where: { trainingId_userId: { trainingId: assessment.trainingId, userId: req.user.id } }
    });
    if (!assignment) {
      return res.status(403).json({ success: false, data: null, message: 'You are not assigned to this training' });
    }
    if (assignment.status === 'COMPLETED') {
      return res.status(400).json({ success: false, data: null, message: 'Training already completed' });
    }

    let score = 0;
    let totalMarks = 0;
    assessment.questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (answers[i] === q.correctIndex) score += q.marks;
    });

    const attempt = await prisma.assessmentAttempt.create({
      data: { assessmentId: assessment.id, userId: req.user.id, answers, score, totalMarks }
    });
    // Submission moves the assignment to PENDING (awaiting trainer evaluation)
    await prisma.trainingAssignment.update({ where: { id: assignment.id }, data: { status: 'PENDING' } });

    await logAudit({
      userId: req.user.id, action: 'ATTEMPT_SUBMITTED', entity: 'AssessmentAttempt', entityId: attempt.id,
      details: `${req.user.employeeId} submitted "${assessment.title}" (${assessment.training.code}), auto-score ${score}/${totalMarks}`, req
    });
    return res.status(201).json({ success: true, data: { id: attempt.id, submittedAt: attempt.submittedAt }, message: 'Assessment submitted for evaluation' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// GET /api/assessments/attempts/pending — Trainer+ work queue
router.get('/attempts/pending', requireMinLevel('TRAINER'), async (req, res) => {
  try {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        user: { select: { employeeId: true, name: true, department: true } },
        assessment: { include: { training: { select: { code: true, title: true } } } }
      },
      orderBy: { submittedAt: 'asc' }
    });
    return res.json({ success: true, data: attempts, message: 'OK' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// POST /api/assessments/attempts/:id/evaluate — Trainer+ records PASS / FAIL with remarks
router.post('/attempts/:id/evaluate', requireMinLevel('TRAINER'), async (req, res) => {
  try {
    const { result, remarks } = req.body; // result: 'PASSED' | 'FAILED'
    if (!['PASSED', 'FAILED'].includes(result)) {
      return res.status(400).json({ success: false, data: null, message: 'result must be PASSED or FAILED' });
    }
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: req.params.id },
      include: { assessment: { include: { training: true } }, user: true }
    });
    if (!attempt) return res.status(404).json({ success: false, data: null, message: 'Attempt not found' });
    if (attempt.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, data: null, message: 'Attempt already evaluated' });
    }

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { status: result, remarks: remarks || null, evaluatedById: req.user.id, evaluatedAt: new Date() }
    });

    // PASS completes the assignment; FAIL returns it to ASSIGNED for retraining
    const assignment = await prisma.trainingAssignment.findUnique({
      where: { trainingId_userId: { trainingId: attempt.assessment.trainingId, userId: attempt.userId } }
    });
    if (assignment) {
      await prisma.trainingAssignment.update({
        where: { id: assignment.id },
        data: result === 'PASSED'
          ? { status: 'COMPLETED', completedAt: new Date() }
          : { status: 'ASSIGNED' }
      });
    }

    await logAudit({
      userId: req.user.id, action: 'ATTEMPT_EVALUATED', entity: 'AssessmentAttempt', entityId: attempt.id,
      details: `${attempt.user.employeeId} — "${attempt.assessment.title}" (${attempt.assessment.training.code}) evaluated as ${result}, score ${attempt.score}/${attempt.totalMarks}${remarks ? `, remarks: ${remarks}` : ''}`, req
    });
    return res.json({ success: true, data: updated, message: `Attempt evaluated as ${result}` });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

module.exports = router;
