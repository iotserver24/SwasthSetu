const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole, checkLicenseStatus } = require('../middleware/auth');

// ─── Professional Registration Flow ────────────────────────────────────────────────

// POST /api/auth/register-professional
// Initiate professional registration (sends OTP)
router.post('/register-professional', authController.initiateRegistration);

// POST /api/auth/verify-registration
// Verify OTP and complete registration
router.post('/verify-registration', authController.verifyRegistration);

// ─── Professional Login Flow ──────────────────────────────────────────────────────

// POST /api/auth/login
// Initiate login (sends OTP)
router.post('/login', authController.initiateLogin);

// POST /api/auth/verify-login
// Verify OTP and complete login
router.post('/verify-login', authController.verifyLogin);

// ─── OTP Management ────────────────────────────────────────────────────────────────

// POST /api/auth/resend-otp
// Resend OTP for registration or login
router.post('/resend-otp', authController.resendOtp);

// ─── Admin/Legacy Routes (Email/Password) ──────────────────────────────────────────

// POST /api/auth/register-admin
// Create admin account (email/password)
router.post('/register', authController.registerAdmin);

// POST /api/auth/login-admin
// Login admin account (email/password)
router.post('/login-admin', authController.loginAdmin);

// ─── Protected Routes ───────────────────────────────────────────────────────────

// GET /api/auth/me
// Get current authenticated user
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/logout
// Logout (client clears token)
router.post('/logout', authenticate, authController.logout);

// ─── Registry Check ──────────────────────────────────────────────────────────────

// GET /api/auth/registry/:registryId
// Check if registry ID is valid
router.get('/registry/:registryId', authController.checkRegistry);

// ─── License Status Check (Protected) ─────────────────────────────────────────────

// GET /api/auth/license-status
// Check current user's license status
router.get('/license-status', authenticate, checkLicenseStatus, (req, res) => {
  res.json({
    licenseStatus: req.user.licenseStatus,
    lastLicenseCheck: req.user.lastLicenseCheck,
    isActive: req.user.isActive,
  });
});

module.exports = router;