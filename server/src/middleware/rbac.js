const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware factory: checks that req.user is either the resource owner (makerId) or ADMIN
const requireOwnerOrAdmin = (model) => async (req, res, next) => {
  try {
    const resource = await prisma[model].findUnique({ where: { id: req.params.id } });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (req.user.role === 'ADMIN' || resource.makerId === req.user.id) {
      req.resource = resource;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  } catch (err) {
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient role' });
  }
  next();
};

module.exports = { requireOwnerOrAdmin, requireRole };
