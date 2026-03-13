const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registryService = require('../services/registryService');

/**
 * Authenticate JWT token
 * Attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled. Contact administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional authentication
 * Attaches user if token present, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};

/**
 * Require specific role(s)
 * Must be used after authenticate middleware
 * @param {...string} roles - Required roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Normalize role comparison (lab_tech and lab are equivalent)
    const userRole = req.user.role === 'lab_tech' ? 'lab' : req.user.role;
    const normalizedRoles = roles.map(r => r === 'lab_tech' ? 'lab' : r);

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: normalizedRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Check if license status is active for professional users
 * Must be used after authenticate middleware
 * Verifies license status from registry before allowing access
 */
const checkLicenseStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin users don't need license check
    if (req.user.role === 'admin') {
      return next();
    }

    // Professional users (doctor, pharmacist, lab) need license check
    if (!req.user.registryId) {
      return res.status(403).json({ error: 'No professional registry ID associated with this account.' });
    }

    // Check if we need to refresh license status (older than 24 hours)
    const licenseRefreshThreshold = 24 * 60 * 60 * 1000; // 24 hours in ms
    const needsRefresh = !req.user.lastLicenseCheck ||
                         (Date.now() - new Date(req.user.lastLicenseCheck).getTime()) > licenseRefreshThreshold;

    if (needsRefresh) {
      const registryData = await registryService.verifyRegistry(req.user.registryId);

      if (!registryData) {
        return res.status(403).json({ error: 'Unable to verify professional registry. Contact support.' });
      }

      // Update license status in database
      req.user.licenseStatus = registryData.licenseStatus;
      req.user.lastLicenseCheck = new Date();
      await req.user.save();

      // If license is not active, disable account
      if (registryData.licenseStatus !== 'ACTIVE') {
        req.user.isActive = false;
        await req.user.save();
        return res.status(403).json({
          error: 'Your professional license is not active.',
          status: registryData.licenseStatus,
          message: 'Please contact the professional registry to resolve this issue.',
        });
      }
    }

    // Verify license is active
    if (req.user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Your professional license is not active.',
        status: req.user.licenseStatus,
        message: 'Please contact the professional registry to resolve this issue.',
      });
    }

    next();
  } catch (err) {
    console.error('[License Check] Error:', err.message);
    return res.status(500).json({ error: 'Failed to verify license status. Please try again.' });
  }
};

/**
 * Admin-only middleware (for backward compatibility)
 * Must be used after authenticate middleware
 */
const adminOnly = [authenticate, requireRole('admin')];

/**
 * Doctor-only middleware
 */
const doctorOnly = [authenticate, requireRole('doctor'), checkLicenseStatus];

/**
 * Pharmacist-only middleware
 */
const pharmacistOnly = [authenticate, requireRole('pharmacist'), checkLicenseStatus];

/**
 * Lab technician-only middleware
 */
const labOnly = [authenticate, requireRole('lab', 'lab_tech'), checkLicenseStatus];

/**
 * Combined middleware for protected professional routes
 * Authenticates, checks role, and verifies license
 */
const professionalRoute = (role) => {
  const middlewares = [authenticate, requireRole(role)];
  if (role !== 'admin') {
    middlewares.push(checkLicenseStatus);
  }
  return middlewares;
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  checkLicenseStatus,
  adminOnly,
  doctorOnly,
  pharmacistOnly,
  labOnly,
  professionalRoute,
  authorizeRoles: requireRole, // Alias for backward compatibility
};