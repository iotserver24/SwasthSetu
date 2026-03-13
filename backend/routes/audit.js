const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Get audit logs (admin only)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resourceType, userId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.user = userId;

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);
    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
