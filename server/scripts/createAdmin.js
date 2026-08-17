const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const name = args[0] || 'System Admin';
  const email = args[1] || 'admin2@example.com';
  const password = args[2] || 'password123';
  const phone = args[3] || '9999999900';

  if (!email.includes('@') || password.length < 8) {
    console.error('Error: Please provide a valid email and a password of at least 8 characters.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    const exists = await User.findOne({ user_email: email.toLowerCase() });
    if (exists) {
      console.error(`Error: User with email ${email} already exists.`);
      process.exit(1);
    }

    const admin = await User.create({
      user_full_name: name,
      user_email: email.toLowerCase(),
      user_password_hash: password,
      user_phone_number: phone,
      user_role: 'admin',
      user_is_verified: true
    });

    console.log('----------------------------------------');
    console.log('SUCCESS: Admin User Created Successfully');
    console.log(`ID:       ${admin._id}`);
    console.log(`Name:     ${admin.user_full_name}`);
    console.log(`Email:    ${admin.user_email}`);
    console.log(`Phone:    ${admin.user_phone_number}`);
    console.log('----------------------------------------');
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
