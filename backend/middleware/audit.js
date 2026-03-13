const AuditLog = require('../models/AuditLog');

const logAudit = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        const resourceId = req.params.pid || req.params.id || data?._id || data?.pid || '';
        await AuditLog.create({
          user: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          action,
          resourceType,
          resourceId: String(resourceId),
          details: `${action} ${resourceType} ${resourceId ? '(ID: ' + resourceId + ')' : ''}`.trim(),
          ip: req.ip || req.connection?.remoteAddress || 'unknown',
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { logAudit };
