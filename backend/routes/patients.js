const router = require('express').Router();
const QRCode = require('qrcode');
const Patient = require('../models/Patient');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Register new patient
router.post('/', authenticate, authorizeRoles('doctor', 'admin'), logAudit('CREATE', 'Patient'), async (req, res) => {
  try {
    const patient = new Patient({ ...req.body, registeredBy: req.user._id });
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search patients — requires search query (no open listing)
router.get('/', authenticate, logAudit('VIEW', 'Patient'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    // Require a search term — no browsing all patients
    if (!search || search.trim().length < 2) {
      const total = await Patient.countDocuments();
      return res.json({ patients: [], total, page: 1, totalPages: 0 });
    }

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { pid: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    };
    const patients = await Patient.find(query)
      .select('pid name age gender phone createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Patient.countDocuments(query);
    res.json({ patients, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get patient by PID
router.get('/:pid', authenticate, logAudit('VIEW', 'Patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ pid: req.params.pid });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get QR code for patient
router.get('/:pid/qr', authenticate, logAudit('VIEW', 'Patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ pid: req.params.pid });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const qrData = JSON.stringify({ pid: patient.pid, name: patient.name });
    const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.json({ qr: qrImage, pid: patient.pid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient details
router.put('/:pid', authenticate, authorizeRoles('doctor', 'admin'), logAudit('UPDATE', 'Patient'), async (req, res) => {
  try {
    const { pid } = req.params;
    const updateData = { ...req.body };
    
    // Don't allow PID or registeredBy to be updated manually
    delete updateData.pid;
    delete updateData.registeredBy;

    const patient = await Patient.findOneAndUpdate(
      { pid },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
