const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    const users = await User.find({}).lean();
    
    let report = `Total Users: ${users.length}\n\n`;
    users.forEach((u, i) => {
      report += `User #${i + 1}\n`;
      report += `ID: ${u._id}\n`;
      report += `Email: "${u.email}"\n`;
      report += `Role: ${u.role}\n`;
      report += `RegistryId: ${u.registryId}\n`;
      report += `UserId: ${u.userId}\n`;
      report += `Password Length: ${u.password ? u.password.length : 0}\n`;
      report += `Password Hash Start: ${u.password ? u.password.substring(0, 10) : 'N/A'}\n`;
      report += '-'.repeat(40) + '\n';
    });

    fs.writeFileSync(path.join(__dirname, 'db_report.txt'), report);
    console.log('Report generated in db_report.txt');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

inspect();
