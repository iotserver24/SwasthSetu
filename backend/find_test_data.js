const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function findData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Patient = mongoose.model('Patient', new mongoose.Schema({ pid: String, name: String }));
    const patients = await Patient.find({});
    console.log('--- PATIENTS FOUND ---');
    console.log(JSON.stringify(patients, null, 2));
    console.log('------------------');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

findData();
