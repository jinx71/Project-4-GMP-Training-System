const prisma = require('./prisma');

// Central audit logger. Every system event is recorded with user, action,
// affected entity and a server-side timestamp (UTC) per 21 CFR Part 11.
async function logAudit({ userId = null, action, entity = null, entityId = null, details = null, req = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || null) : null
      }
    });
  } catch (err) {
    // Audit failure must never silently pass in production; log loudly.
    console.error('AUDIT LOG FAILURE:', err.message);
  }
}

module.exports = { logAudit };
