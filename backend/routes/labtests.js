const router = require('express').Router();
const LabTest = require('../models/LabTest');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Get pending lab tests (lab view)
router.get('/pending', authenticate, authorizeRoles('lab', 'admin'), logAudit('VIEW', 'LabTest'), async (req, res) => {
  try {
    const tests = await LabTest.find({ status: { $ne: 'completed' } })
      .populate('patient', 'pid name age gender')
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all lab tests (with optional filters)
router.get('/', authenticate, logAudit('VIEW', 'LabTest'), async (req, res) => {
  try {
    const { status, patientPid } = req.query;
    const query = {};
    if (status) query.status = status;
    if (patientPid) query.patientPid = patientPid;

    const tests = await LabTest.find(query)
      .populate('patient', 'pid name age gender')
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lab test status
router.patch('/:id/status', authenticate, authorizeRoles('lab', 'admin'), logAudit('UPDATE', 'LabTest'), async (req, res) => {
  try {
    const { status, results } = req.body;
    const update = { status, updatedBy: req.user._id };
    if (status === 'completed') {
      update.completedAt = new Date();
      if (results) update.results = results;
    }

    const test = await LabTest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('patient', 'pid name');
    if (!test) return res.status(404).json({ error: 'Lab test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
