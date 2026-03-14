const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const Otp = require('../models/Otp');

    const targetEmail = 'iotserver24@gmail.com';
    const normalizedEmail = targetEmail.toLowerCase().trim();

    console.log(`\nSearching for: ${normalizedEmail}`);
    
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      console.log('✅ User found in database!');
      console.log(`Role: ${user.role}`);
      console.log(`RegistryId: ${user.registryId}`);
      console.log(`Password set: ${!!user.password}`);
    } else {
      console.log('❌ User NOT found in database.');
    }

    const otps = await Otp.find({ email: normalizedEmail });
    console.log(`\nPending OTPs for this email: ${otps.length}`);
    for (const o of otps) {
      console.log(`- Purpose: ${o.purpose} | Created: ${o.createdAt} | PendingData: ${!!o.pendingUserData}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
