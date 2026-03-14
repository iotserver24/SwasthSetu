const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Dynamically load models
    const User = require('../models/User');
    const users = await User.find({}, 'email role password registryId');
    
    console.log(`\nFound ${users.length} users:`);
    console.log('='.repeat(80));
    for (const u of users) {
      const isHashed = u.password && u.password.startsWith('$2a$');
      // A double-hashed password might still start with $2a$, 
      // but let's see the start of the hash to see if they are consistent.
      const hashPrefix = u.password ? u.password.substring(0, 10) : 'NONE';
      
      console.log(`- ${u.email.padEnd(30)} | ${u.role.padEnd(12)} | Hash: ${hashPrefix}... | Valid Hash: ${isHashed}`);
    }
    console.log('='.repeat(80));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
