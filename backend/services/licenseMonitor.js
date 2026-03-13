/**
 * License Monitor Service
 * Background job to check license status of all users periodically
 */

const cron = require('node-cron');
const User = require('../models/User');
const registryService = require('./registryService');

const LICENSE_CHECK_INTERVAL_HOURS = 24;

/**
 * Check and update license status for a single user
 * @param {object} user - User document
 * @returns {Promise<object>} - Updated user status
 */
async function checkUserLicense(user) {
  try {
    const registryData = await registryService.verifyRegistry(user.registryId);

    if (!registryData) {
      console.warn(`[License Monitor] Registry ID not found for user ${user.userId}: ${user.registryId}`);
      return {
        userId: user.userId,
        status: 'error',
        message: 'Registry ID not found',
      };
    }

    const previousStatus = user.licenseStatus;
    const newStatus = registryData.licenseStatus;

    // Update user license status if changed
    if (previousStatus !== newStatus) {
      user.licenseStatus = newStatus;
      user.lastLicenseCheck = new Date();

      // If license is no longer active, disable account
      if (newStatus !== 'ACTIVE') {
        user.isActive = false;
        console.log(`[License Monitor] User ${user.userId} account disabled. License status: ${newStatus}`);
      } else {
        user.isActive = true;
      }

      await user.save();

      return {
        userId: user.userId,
        status: 'updated',
        previousStatus,
        newStatus,
        accountEnabled: user.isActive,
      };
    }

    // Just update last check time
    user.lastLicenseCheck = new Date();
    await user.save();

    return {
      userId: user.userId,
      status: 'unchanged',
      licenseStatus: newStatus,
    };
  } catch (error) {
    console.error(`[License Monitor] Error checking license for user ${user.userId}:`, error.message);
    return {
      userId: user.userId,
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Run license check for all professional users
 * @returns {Promise<object>} - Summary of check results
 */
async function runLicenseCheck() {
  console.log('[License Monitor] Starting license check for all users...');

  const startTime = Date.now();

  // Find all professional users (doctors, pharmacists, lab techs)
  const users = await User.find({
    role: { $in: ['doctor', 'pharmacist', 'lab'] },
  });

  console.log(`[License Monitor] Found ${users.length} professional users to check`);

  const results = {
    total: users.length,
    active: 0,
    suspended: 0,
    inactive: 0,
    errors: 0,
    details: [],
  };

  for (const user of users) {
    const result = await checkUserLicense(user);
    results.details.push(result);

    if (result.status === 'error') {
      results.errors++;
    } else if (result.newStatus === 'SUSPENDED') {
      results.suspended++;
    } else if (result.newStatus === 'INACTIVE') {
      results.inactive++;
    } else if (result.licenseStatus === 'ACTIVE' || result.status === 'unchanged') {
      results.active++;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[License Monitor] License check completed in ${duration}ms`);
  console.log(`[License Monitor] Summary: ${results.active} active, ${results.suspended} suspended, ${results.inactive} inactive, ${results.errors} errors`);

  return results;
}

/**
 * Start the cron job for periodic license checks
 * Runs every 24 hours by default
 */
function startLicenseMonitor() {
  // Run at midnight every day
  const job = cron.schedule('0 0 * * *', async () => {
    console.log('[License Monitor] Running scheduled license check...');
    try {
      await runLicenseCheck();
    } catch (error) {
      console.error('[License Monitor] Scheduled check failed:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[License Monitor] Background job started. Will run daily at midnight IST.');

  return job;
}

/**
 * Stop the license monitor cron job
 * @param {object} job - The cron job to stop
 */
function stopLicenseMonitor(job) {
  if (job) {
    job.stop();
    console.log('[License Monitor] Background job stopped.');
  }
}

module.exports = {
  checkUserLicense,
  runLicenseCheck,
  startLicenseMonitor,
  stopLicenseMonitor,
  LICENSE_CHECK_INTERVAL_HOURS,
};