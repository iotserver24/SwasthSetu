const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, password: String }));
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    await User.updateOne({ email: 'iotserver24@gmail.com' }, { $set: { password: hashedPassword } });
    
    console.log('--- PASSWORD RESET SUCCESS ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

resetPassword();
