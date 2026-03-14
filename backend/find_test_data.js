const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function findData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
    const Patient = mongoose.model('Patient', new mongoose.Schema({ pid: String, name: String }));
    
    const doctor = await User.findOne({ role: 'doctor' });
    const patient = await Patient.findOne();
    
    console.log('--- DATA FOUND ---');
    console.log('DOCTOR_EMAIL:', doctor ? doctor.email : 'NOT_FOUND');
    console.log('PATIENT_PID:', patient ? patient.pid : 'NOT_FOUND');
    console.log('------------------');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

findData();
