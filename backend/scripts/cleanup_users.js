const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    
    // Delete users that might have corrupted hashes from the double-hashing bug
    // or just the one the user is likely testing with.
    const result = await User.deleteMany({ 
      email: { $in: ['iotserver24@gmail.com', 'test@hospital.com'] } 
    });
    
    console.log(`Deleted ${result.deletedCount} potentially corrupted user accounts.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

cleanup();
