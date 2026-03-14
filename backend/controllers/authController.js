/**
 * Auth Controller
 * Handles professional registration and login with email OTP verification
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registryService = require('../services/registryService');
const otpService = require('../services/otpService');

const JWT_EXPIRY = '7d';

/**
 * Generate JWT token for user
 * @param {object} user - User document
 * @returns {string} - JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      role: user.role,
      registryId: user.registryId,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * POST /auth/register-professional
 * Initiate professional registration
 * Steps:
 * 1. Validate registry ID
 * 2. Verify name matches registry
 * 3. Check license is active
 * 4. Send OTP to email
 */
const initiateRegistration = async (req, res) => {
  try {
    const { registryId, name, email } = req.body;

    // Validate input
    if (!registryId || !name || !email) {
      return res.status(400).json({
        error: 'All fields are required',
        required: ['registryId', 'name', 'email'],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate registry ID format
    if (!registryService.isValidRegistryFormat(registryId)) {
      return res.status(400).json({
        error: 'Invalid registry ID format. Must start with NMC (doctor), PCI (pharmacist), or PMC (lab technician).',
      });
    }

    // Verify registry ID
    const registryData = await registryService.verifyRegistry(registryId);
    if (!registryData) {
      return res.status(400).json({
        error: 'Registry ID not found. Please verify your professional registration.',
      });
    }

    // Validate name matches registry (flexible matching)
    const registryNameLower = registryData.name.toLowerCase().trim();
    const inputNameLower = name.toLowerCase().trim();

    if (!registryNameLower.includes(inputNameLower) && !inputNameLower.includes(registryNameLower)) {
      const nameParts = inputNameLower.split(/\s+/);
      const registryParts = registryNameLower.split(/\s+/);
      const matchingParts = nameParts.some(part =>
        registryParts.some(rPart => rPart.includes(part) || part.includes(rPart))
      );

      if (!matchingParts) {
        return res.status(400).json({
          error: 'Name does not match registry record',
          registryName: registryData.name,
        });
      }
    }

    // Check license status
    if (registryData.licenseStatus !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Professional license is not active',
        status: registryData.licenseStatus,
        message: registryData.details?.suspensionReason || registryData.details?.inactivityReason || 'Please contact your professional registry.',
      });
    }

    const normalizedRegistryId = registryData.registryId;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ registryId: normalizedRegistryId }, { email: normalizedEmail }],
    });

    if (existingUser) {
      if (existingUser.registryId === normalizedRegistryId) {
        return res.status(400).json({ error: 'This registry ID is already registered.' });
      }
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    // Send OTP via email
    const otpResult = await otpService.sendOtp(normalizedEmail, 'registration', {
      registryId: normalizedRegistryId,
      userData: {
        name: registryData.name,
        role: registryData.role,
        registryDetails: {
          specialization: registryData.details?.specialization,
          qualification: registryData.details?.qualification,
          registrationDate: registryData.details?.registrationDate,
        },
      },
    });

    res.json({
      message: 'OTP sent to your email address',
      email: normalizedEmail,
      registryId,
      name: registryData.name,
      role: registryData.role,
      expiresAt: otpResult.expiresAt,
    });
  } catch (err) {
    console.error('[Registration] Error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * POST /auth/verify-registration
 * Verify OTP and complete registration
 */
const verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verify OTP
    const otpResult = await otpService.verifyOtp(email, otp, 'registration');

    if (!otpResult.valid) {
      return res.status(400).json({ error: otpResult.error });
    }

    const { registryId, userData } = otpResult;

    if (!registryId || !userData) {
      return res.status(400).json({ error: 'Registration data not found. Please restart registration.' });
    }

    // Create user
    const user = await User.create({
      registryId,
      email: otpResult.email,
      name: userData.name,
      role: userData.role,
      licenseStatus: 'ACTIVE',
      lastLicenseCheck: new Date(),
      isActive: true,
      registryDetails: userData.registryDetails,
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    console.error('[Verify Registration] Error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/**
 * POST /auth/login
 * Initiate login with registry ID and email
 */
const initiateLogin = async (req, res) => {
  try {
    const { registryId, email } = req.body;

    if (!registryId) {
      return res.status(400).json({ error: 'Registry ID is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRegistryId = String(registryId).toUpperCase().trim();

    // Find user by registry ID
    const user = await User.findOne({ registryId: normalizedRegistryId });

    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please register first.' });
    }

    // Verify email matches
    if (user.email !== normalizedEmail) {
      return res.status(401).json({ error: 'Email does not match our records' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is disabled',
        message: 'Please contact support.',
      });
    }

    // Send OTP via email
    const otpResult = await otpService.sendOtp(normalizedEmail, 'login', {
      registryId: normalizedRegistryId,
    });

    res.json({
      message: 'OTP sent to your email address',
      email: normalizedEmail,
      expiresAt: otpResult.expiresAt,
    });
  } catch (err) {
    console.error('[Login] Error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * POST /auth/verify-login
 * Verify OTP and complete login
 */
const verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verify OTP
    const otpResult = await otpService.verifyOtp(email, otp, 'login');

    if (!otpResult.valid) {
      return res.status(400).json({ error: otpResult.error });
    }

    // Find user
    const user = await User.findOne({ registryId: otpResult.registryId });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is disabled',
        message: 'Please contact support.',
      });
    }

    // Check license status for professionals
    if (user.role !== 'admin' && user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Professional license is not active',
        status: user.licenseStatus,
        message: 'Please contact your professional registry.',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLicenseCheck = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    console.error('[Verify Login] Error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/**
 * POST /auth/resend-otp
 * Resend OTP for login (registration resend = call register-professional again)
 * For login, registryId is required so verify-login can find the user.
 */
const resendOtp = async (req, res) => {
  try {
    const { email, purpose, registryId } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        error: 'Email and purpose are required',
        required: ['email', 'purpose'],
      });
    }

    if (!['registration', 'login'].includes(purpose)) {
      return res.status(400).json({ error: 'Invalid purpose. Must be "registration" or "login"' });
    }

    if (purpose === 'login' && !registryId) {
      return res.status(400).json({ error: 'Registry ID is required to resend login OTP' });
    }

    const options = purpose === 'login' ? { registryId: String(registryId).toUpperCase().trim() } : {};
    const otpResult = await otpService.sendOtp(email.toLowerCase().trim(), purpose, options);

    res.json({
      message: 'OTP resent successfully',
      email: otpResult.email,
      expiresAt: otpResult.expiresAt,
    });
  } catch (err) {
    console.error('[Resend OTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
};

/**
 * POST /auth/register-admin
 * Admin registration with email/password
 */
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role, registryId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // If a registryId is supplied, ensure it isn't already taken
    if (registryId) {
      const existingRegistry = await User.findOne({ registryId: registryId.toUpperCase() });
      if (existingRegistry) {
        return res.status(400).json({ error: 'This Registry ID is already registered.' });
      }
    }

    const assignedRole = role || 'admin';

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: assignedRole,
      registryId: registryId ? registryId.toUpperCase() : undefined,
      isActive: true,
      licenseStatus: 'ACTIVE',
    });

    const token = generateToken(user);

    res.status(201).json({ user: user.toJSON(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /auth/login-admin
 * Admin login with email/password
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'This endpoint is for admin accounts only',
        hint: 'Professionals should use /auth/login with OTP',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const token = generateToken(user);

    res.json({ user: user.toJSON(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /auth/me
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  res.json(req.user);
};

/**
 * POST /auth/logout
 * Logout (client-side token removal)
 */
const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

/**
 * GET /auth/registry/:registryId
 * Check if registry ID is valid and get basic info
 */
const checkRegistry = async (req, res) => {
  try {
    const { registryId } = req.params;

    if (!registryId) {
      return res.status(400).json({ error: 'Registry ID is required' });
    }

    const registryData = await registryService.verifyRegistry(registryId);

    if (!registryData) {
      return res.status(404).json({ error: 'Registry ID not found' });
    }

    // Check if already registered (use normalized ID from registry)
    const existingUser = await User.findOne({ registryId: registryData.registryId });

    res.json({
      valid: true,
      role: registryData.role,
      licenseStatus: registryData.licenseStatus,
      registryName: registryData.registryName,
      isRegistered: !!existingUser,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify registry ID' });
  }
};

module.exports = {
  initiateRegistration,
  verifyRegistration,
  initiateLogin,
  verifyLogin,
  resendOtp,
  registerAdmin,
  loginAdmin,
  getCurrentUser,
  logout,
  checkRegistry,
};