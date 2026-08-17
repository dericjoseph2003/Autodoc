const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  const mongoUri = 'mongodb://localhost:27017/autodoc';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  console.log('All Users in DB:', users.map(u => ({ email: u.user_email, role: u.user_role })));

  const admin = await User.findOne({ user_email: 'chief.admin@autodoc.com' });
  if (!admin) {
    console.log('Admin user chief.admin@autodoc.com not found!');
  } else {
    const rawAdmin = await User.findOne({ user_email: 'chief.admin@autodoc.com' }).select('+user_password_hash');
    console.log('Admin document in DB:', rawAdmin.toObject());
    console.log('Hashed Password:', rawAdmin.user_password_hash);

    const isMatch = await rawAdmin.comparePassword('autodocadmin2026');
    console.log('Password Match for "autodocadmin2026":', isMatch);
  }

  await mongoose.disconnect();
};

run().catch(console.error);
