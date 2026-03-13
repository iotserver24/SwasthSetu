const router = require('express').Router();
const Prescription = require('../models/Prescription');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Get pending prescriptions (pharmacy view)
router.get('/pending', authenticate, authorizeRoles('pharmacy', 'admin'), logAudit('VIEW', 'Prescription'), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'pending' })
      .populate('patient', 'pid name age gender')
      .populate('consultation', 'createdAt')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all prescriptions (with optional filters)
router.get('/', authenticate, logAudit('VIEW', 'Prescription'), async (req, res) => {
  try {
    const { status, patientPid } = req.query;
    const query = {};
    if (status) query.status = status;
    if (patientPid) query.patientPid = patientPid;

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'pid name age gender')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dispense prescription
router.patch('/:id/dispense', authenticate, authorizeRoles('pharmacy', 'admin'), logAudit('UPDATE', 'Prescription'), async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'dispensed', dispensedBy: req.user._id, dispensedAt: new Date() },
      { new: true }
    ).populate('patient', 'pid name');
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
