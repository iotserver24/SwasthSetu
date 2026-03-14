const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function deleteUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const rolesToDelete = ['doctor', 'pharmacist', 'lab', 'lab_tech'];
    
    console.log(`Deleting users with roles: ${rolesToDelete.join(', ')}...`);
    
    const result = await User.deleteMany({ role: { $in: rolesToDelete } });
    
    console.log(`Successfully deleted ${result.deletedCount} users.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  }
}

deleteUsers();
