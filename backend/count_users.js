const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function countUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const rolesToDelete = ['doctor', 'pharmacist', 'lab', 'lab_tech'];
    const count = await User.countDocuments({ role: { $in: rolesToDelete } });
    console.log(`Found ${count} users with roles: ${rolesToDelete.join(', ')}`);
    
    // Also list them for safety
    const users = await User.find({ role: { $in: rolesToDelete } }).select('email name role');
    console.log('Users found:');
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

countUsers();
