const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function findData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
    const user = await User.findById('69b4e3330afb0ae9537ef6b9');
    console.log('--- USER FOUND ---');
    console.log(JSON.stringify(user, null, 2));
    console.log('------------------');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

findData();
