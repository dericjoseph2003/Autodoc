const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');
const bcrypt = require('bcryptjs');

/**
 * Reset a user's password safely using bcrypt.
 * Uses direct updateOne with a pre-hashed value to avoid the pre-save hook double-hashing.
 */
const resetUserPassword = async (userId, plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(plainPassword, salt);
  await User.updateOne(
    { _id: userId },
    { $set: { user_password_hash: hashed, failedLoginAttempts: 0, lockUntil: null } }
  );
};

const seedDatabase = async () => {
  try {
    // 0. Clean up old logins
    await User.deleteMany({
      $or: [
        { user_email: { $in: ['owner@example.com', 'admin@example.com', 'center@example.com'] } },
        { email: { $in: ['owner@example.com', 'admin@example.com', 'center@example.com'] } }
      ]
    });
    await ServiceCenter.deleteMany({
      $or: [
        { service_center_name: 'Express Car Care' },
        { businessName: 'Express Car Care' }
      ]
    });

    // 1. Seed Owner User
    let owner = await User.findOne({ $or: [{ user_email: 'alex.owner@autodoc.com' }, { email: 'alex.owner@autodoc.com' }] });
    if (!owner) {
      owner = await User.create({
        user_full_name: 'Alex Owner',
        user_email: 'alex.owner@autodoc.com',
        user_password_hash: 'autodocowner2026',
        user_phone_number: '7777777777',
        user_role: 'owner',
        user_is_verified: true
      });
      console.log('✅ Seeded Owner User: alex.owner@autodoc.com / autodocowner2026');
    } else {
      await resetUserPassword(owner._id, 'autodocowner2026');
      console.log('🔁 Reset Owner User password (alex.owner@autodoc.com)');
    }

    // 2. Seed Admin User
    let admin = await User.findOne({ $or: [{ user_email: 'chief.admin@autodoc.com' }, { email: 'chief.admin@autodoc.com' }] });
    if (!admin) {
      admin = await User.create({
        user_full_name: 'Chief Admin',
        user_email: 'chief.admin@autodoc.com',
        user_password_hash: 'autodocadmin2026',
        user_phone_number: '9999999999',
        user_role: 'admin',
        user_is_verified: true
      });
      console.log('✅ Seeded Admin User: chief.admin@autodoc.com / autodocadmin2026');
    } else {
      await resetUserPassword(admin._id, 'autodocadmin2026');
      console.log('🔁 Reset Admin User password (chief.admin@autodoc.com)');
    }

    // 3. Seed Service Center Manager User & Profile
    let centerUser = await User.findOne({ $or: [{ user_email: 'sarah.partner@autodoc.com' }, { email: 'sarah.partner@autodoc.com' }] });
    if (!centerUser) {
      centerUser = await User.create({
        user_full_name: 'Sarah Partner',
        user_email: 'sarah.partner@autodoc.com',
        user_password_hash: 'autodocpartner2026',
        user_phone_number: '8888888888',
        user_role: 'service_center',
        user_is_verified: true
      });
      console.log('✅ Seeded Service Center User: sarah.partner@autodoc.com / autodocpartner2026');
    } else {
      await resetUserPassword(centerUser._id, 'autodocpartner2026');
      centerUser = await User.findOne({ user_email: 'sarah.partner@autodoc.com' });
      console.log('🔁 Reset Service Center User password (sarah.partner@autodoc.com)');
    }

    // Ensure linked Service Center profile exists and is approved
    let sc = await ServiceCenter.findOne({ user_id: centerUser._id });
    if (!sc) {
      sc = await ServiceCenter.create({
        user_id: centerUser._id,
        service_center_name: 'Apex Auto Service',
        service_center_address: '789 Grand Avenue, Industrial Zone',
        service_center_phone_number: '8888888888',
        city: 'Mumbai',
        pincode: '400001',
        businessRegistrationNumber: 'SC-APEX-999',
        contactPersonName: 'Sarah Partner',
        servicesOffered: ['Oil Change', 'Tyres', 'Battery', 'Engine Tuning'],
        businessDocumentUrl: '/uploads/documents/apex_doc.pdf',
        operatingHours: '8:00 AM - 7:00 PM',
        approvalStatus: 'approved',
        status: 'approved',
        service_center_is_verified: true
      });
      console.log("✅ Seeded Service Center Profile: 'Apex Auto Service' (Status: Approved)");
    } else {
      await ServiceCenter.updateOne(
        { _id: sc._id },
        { $set: { approvalStatus: 'approved', status: 'approved', service_center_is_verified: true } }
      );
      console.log("🔁 Ensured Service Center Profile 'Apex Auto Service' is Approved");
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Owner:          alex.owner@autodoc.com     / autodocowner2026');
    console.log('   Admin:          chief.admin@autodoc.com    / autodocadmin2026');
    console.log('   Service Center: sarah.partner@autodoc.com  / autodocpartner2026\n');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
  }
};

module.exports = seedDatabase;
