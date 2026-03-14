const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function wipe() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const Otp = require('../models/Otp');
    
    const userResult = await User.deleteMany({});
    const otpResult = await Otp.deleteMany({});
    
    console.log(`Successfully wiped database:`);
    console.log(`- Deleted ${userResult.deletedCount} Users`);
    console.log(`- Deleted ${otpResult.deletedCount} OTPs`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error during wipe:', err);
  }
}

wipe();
