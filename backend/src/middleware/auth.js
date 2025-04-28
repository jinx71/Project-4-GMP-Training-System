const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Training-role hierarchy. ADMIN is deliberately OUTSIDE this hierarchy:
// segregation of duties — administrators manage accounts and the audit
// trail but do not take part in training execution.
const ROLE_LEVELS = { USER: 1, TRAINER: 2, DTC: 3, STC: 4 };

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, data: null, message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      return res.status(401).json({ success: false, data: null, message: 'Account not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid or expired session' });
  }
}

// Minimum level within the training hierarchy (excludes ADMIN)
function requireMinLevel(minRole) {
  return (req, res, next) => {
    const level = ROLE_LEVELS[req.user.role] || 0;
    if (level >= ROLE_LEVELS[minRole]) return next();
    return res.status(403).json({ success: false, data: null, message: 'Insufficient role permissions' });
  };
}

function requireAdmin(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  return res.status(403).json({ success: false, data: null, message: 'Administrator access required' });
}

module.exports = { authenticate, requireMinLevel, requireAdmin, ROLE_LEVELS };
