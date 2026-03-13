const router = require('express').Router();
const multer = require('multer');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { uploadToCatbox } = require('../services/catbox');
const { processConsultationAudio, processConsultationText } = require('../services/gemini');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Create consultation draft from audio (No DB save)
router.post('/audio/draft', authenticate, authorizeRoles('doctor'), upload.single('audio'), async (req, res) => {
  try {
    const { patientPid } = req.body;
    const patient = await Patient.findOne({ pid: patientPid });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    let audioUrl = '';
    if (req.file) {
      audioUrl = await uploadToCatbox(req.file.buffer, req.file.originalname || 'recording.webm');
    }

    const aiResult = await processConsultationAudio(req.file.buffer, audioUrl, {
      name: patient.name, age: patient.age, gender: patient.gender,
    });

    // Return the DRAFT back to frontend for review/editing
    res.status(200).json({
      patientPid,
      audioUrl,
      transcript: aiResult.transcript,
      detectedLanguage: aiResult.detectedLanguage,
      aiSummary: aiResult.summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create consultation draft from text (No DB save)
router.post('/text/draft', authenticate, authorizeRoles('doctor'), async (req, res) => {
  try {
    const { patientPid, text } = req.body;
    const patient = await Patient.findOne({ pid: patientPid });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const aiResult = await processConsultationText(text, {
      name: patient.name, age: patient.age, gender: patient.gender,
    });

    // Return the DRAFT back to frontend for review/editing
    res.status(200).json({
      patientPid,
      transcript: aiResult.transcript,
      detectedLanguage: aiResult.detectedLanguage,
      aiSummary: aiResult.summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalize and Save Consultation (After Doctor Review)
router.post('/save', authenticate, authorizeRoles('doctor'), logAudit('CREATE', 'Consultation'), async (req, res) => {
  try {
    const { patientPid, audioUrl, transcript, detectedLanguage, aiSummary } = req.body;
    const patient = await Patient.findOne({ pid: patientPid });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const consultation = await Consultation.create({
      patient: patient._id,
      doctor: req.user._id,
      patientPid: patient.pid,
      audioUrl: audioUrl || '',
      transcript: transcript || '',
      detectedLanguage: detectedLanguage || 'Unknown',
      aiSummary: aiSummary || {},
      createdAt: new Date(), // Explicitly storing date/time of final save
    });

    if (aiSummary?.prescriptions?.length) {
      await Prescription.create({
        consultation: consultation._id,
        patient: patient._id,
        patientPid: patient.pid,
        doctorName: req.user.name,
        medications: aiSummary.prescriptions.map(p => ({
          name: p.medication || p.name || 'Unknown',
          dosage: p.dosage || '',
          frequency: p.frequency || '',
          duration: p.duration || '',
        })),
      });
    }

    if (aiSummary?.labTests?.length) {
      for (const test of aiSummary.labTests) {
        await LabTest.create({
          consultation: consultation._id,
          patient: patient._id,
          patientPid: patient.pid,
          testName: test.testName,
          instructions: test.instructions,
          orderedBy: req.user.name,
        });
      }
    }

    const populated = await Consultation.findById(consultation._id)
      .populate('patient', 'pid name age gender')
      .populate('doctor', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get consultation by ID
router.get('/:id', authenticate, logAudit('VIEW', 'Consultation'), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'pid name age gender phone')
      .populate('doctor', 'name email');
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get consultations for a patient
router.get('/patient/:pid', authenticate, logAudit('VIEW', 'Consultation'), async (req, res) => {
  try {
    const consultations = await Consultation.find({ patientPid: req.params.pid })
      .populate('doctor', 'name email')
      .sort({ createdAt: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
