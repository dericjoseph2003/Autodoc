const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc');
    console.log('Connected to MongoDB.');

    const email = 'royal@autodoc.com';
    const plainPassword = 'autodocpartner2026';

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(plainPassword, salt);

    let user = await User.findOne({ user_email: email });
    if (!user) {
      user = await User.create({
        user_full_name: 'Royal Motors Manager',
        user_email: email,
        user_password_hash: hash,
        user_phone_number: '9876543211',
        user_role: 'service_center',
        user_is_verified: true
      });
      console.log(`✅ Created User: ${email} / ${plainPassword}`);
    } else {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            user_password_hash: hash,
            user_is_verified: true,
            failedLoginAttempts: 0,
            lockUntil: null
          }
        }
      );
      console.log(`✅ Reset User Password: ${email} / ${plainPassword}`);
    }

    let sc = await ServiceCenter.findOne({
      $or: [
        { serviceCenterId: 'sc-royal-motors-kanjirappally' },
        { service_center_name: /Royal Motors/i },
        { businessName: /Royal Motors/i }
      ]
    });

    if (sc) {
      await ServiceCenter.updateOne(
        { _id: sc._id },
        {
          $set: {
            user_id: user._id,
            approvalStatus: 'approved',
            status: 'approved',
            service_center_is_verified: true
          }
        }
      );
      console.log(`✅ Linked Service Center '${sc.name || sc.service_center_name}' to User ID: ${user._id}`);
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
